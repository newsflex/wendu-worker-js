import { WenduApiClient } from "../api";
import { Task, TaskDef, TaskResult, WorkerLog } from "../models";
import { WenduWorkerOptions } from "./wendu-worker-options";
import { WenduWorkerResult } from "./wendu-worker-result";

const debug = require("debug")("wendu");
const os = require("os");
/**
 * Implement this class to create a long running
 * polling worker to run tasks.
 * You  MUST implement the `execute(task: Task)` method
 *
 * @export
 * @abstract
 * @class PollingWorker
 */
export abstract class WenduPollingWorker {
  private MAX_TIME_WITHOUT_POLLING = 5 * 60 * 1000; // 5 minutes
  private pollingInterval: NodeJS.Timeout;
  protected api: WenduApiClient;
  private lastTaskTime = Date.now();
  private interval;

  // how many tasks is this worker doing right now?
  private activeQueue = 0;

  get id(): string {
    return this.config.workerIdentity;
  }

  constructor(private config: WenduWorkerOptions) {
    config.taskName = this.taskDef().name;
    config.workerIdentity = config.workerIdentity ?? this.getIdentity();
    this.api = new WenduApiClient(config);

    // Periodically reset activeQueue if stuck
    this.interval = setInterval(() => this.resetStuckQueue(), 60 * 1000); // Run every minute
  }

  private getIdentity(): string {
    return `wendu-worker-${os.hostname()}`;
  }

  public async start() {
    debug(`Worker=${this.id} is starting. Wendu API=${this.config.url}`);
    this.stopPolling();

    if (!this.config.pollInterval || this.config.pollInterval === 0) {
      throw new Error(`You must provide a valid polling interval in config`);
    }

    // safety check to make sure no one is polling too fast. You shouldn't need to poll more than
    // every 100 ms
    if (this.config.pollInterval < 100) {
      throw new Error(
        `You cannot poll faster than every 100 ms. Increase the pollInterval ms config to a value > 100`
      );
    }

    await this.registerTaskDef();

    debug(
      `Worker=${this.id} will poll for work exery ${this.config.pollInterval} MS`
    );

    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForWork();
      } catch (err) {
        console.error("failed to poll for work", err);
      }
    }, this.config.pollInterval);

    debug(`Worker=${this.id} has started`);
  }

  private async registerTaskDef() {
    const td = this.taskDef();

    if (!td) {
      debug(
        `No Task def provided. Skipping task def registration. It must already exist or worker will fail.`
      );
      return;
    }

    debug(`attempting to register taskdef=${td.name}`);
    if (td.name !== this.config.taskName) {
      throw new Error("Task Def name must match polling task name");
    }
    let token;
    try {
      token = await this.api.getToken();
    } catch (err) {
      console.error("failed to get token", err);
    }
    await this.api.register(this.taskDef(), token);
  }

  private async pollForWork() {
    if (isNaN(this.config.total)) {
      throw new Error(
        "You must provide a valid number of items to poll for (to dequeue)"
      );
    }

    if (this.activeQueue >= this.config.total) {
      // this worker is busy and cannot take on any more work
      debug(
        `Woker is busy. (activeQueue) ${this.activeQueue} vs ${this.config.total} (total)`
      );
      return;
    }

    this.lastTaskTime = Date.now();

    try {
      const data = await this.api.poll(this.config, this.activeQueue);
      const tasks = Array.isArray(data) ? data : [data];
      await Promise.all(tasks.map(async (t) => await this.processTask(t)));
    } catch (err) {
      debug(err);
      if (
        err.name === "MissingTaskDef" ||
        err.message.indexOf("MissingTaskDef") > -1
      ) {
        // we need to re-register the task
        debug(
          "Task def missing. Attempting to re-register the task def with API"
        );
        await this.registerTaskDef();
      } else {
        throw err;
      }
    }
  }

  private async processTask(t: Task) {
    this.activeQueue++;

    // do not send this in orkes mode. it will cause the task to requeue
    if (!this.api.isOrkesMode()) {
      await this.trySendTaskResult(t, { status: "IN_PROGRESS" });
    }

    try {
      t.logger = new WorkerLog({ logToConsole: this.config.logToConsole });
      const result = await this.execute(t);

      result.logs = result.logs ?? [];
      const items = t.logger?.getAll() ?? [];
      if (items) {
        result.logs.push(...items);
      }

      await this.trySendTaskResult(t, result);
    } catch (err) {
      debug(
        `ERROR: Failed to perform taskId=${t.taskId} work due to un-caught err in worker implementation. Reporting task as failed`
      );
      debug(err);

      await this.trySendTaskResult(t, {
        status: "FAILED",
        logs: [
          {
            log: err.toString(),
            createdTime: new Date().getTime(),
          },
        ],
      });
    } finally {
      this.activeQueue--;
    }
  }

  private async trySendTaskResult(t: Task, result: WenduWorkerResult) {
    try {
      await this.sendTaskResult(t, result);
    } catch (err) {
      console.error(
        `Failed to send ${result?.status} status for taskId=${t?.taskId}`,
        err,
        result
      );
      debug(
        `Failed to send ${result?.status} status for taskId=${t?.taskId}`,
        err
      );
    }
  }

  private resetStuckQueue() {
    if (Date.now() - this.lastTaskTime > this.MAX_TIME_WITHOUT_POLLING) {
      console.warn(
        `Resetting activeQueue. No task completed in ${this.MAX_TIME_WITHOUT_POLLING} ms`
      );
      debug(
        `Resetting activeQueue. No task completed in ${this.MAX_TIME_WITHOUT_POLLING} ms`
      );
      this.activeQueue = 0;
    }
  }

  /**
   * Provide the task def to be registered on star().
   * Return null or undefined to skip task defition registration on start()
   *
   * @protected
   * @abstract
   * @returns {TaskDef}
   * @memberof WenduPollingWorker
   */
  protected abstract taskDef(): TaskDef;

  /**
   * All meaninful and task specific works goes in here.
   * You must return a WorkerResult and the base class will save
   * the result to the API.
   *		- you SHOULD use a try/catch and catch your own errors and report FAILED results
   *    - you SHOULD NOT implement retries. Wendu Orchestrator will handle requeues and retries
   *
   * @protected
   * @abstract
   * @param {Task} task
   * @returns {Promise<WenduWorkerResult>}
   * @memberof PollingWenduWorker
   */
  protected abstract execute(task: Task): Promise<WenduWorkerResult>;

  /**
   * The task is finished or failed or has started.
   *
   * @param {Task} t
   * @param {('IN_PROGRESS' | 'FAILED' | 'COMPLETED')} status
   * @param {*} output key/value data for task output
   * @param {any[]} logs
   * @memberof PollingWorker
   */
  public async sendTaskResult(t: Task, result: WenduWorkerResult) {
    // always log which server is running this work for dev sanity
    result.logs = result.logs ?? [];
    result.logs.push({
      log: `Server: ${os.hostname()}`,
      createdTime: new Date().getTime(),
    });

    // once done you send result to api
    const taskResult: TaskResult = {
      workflowInstanceId: t.workflowInstanceId,
      taskId: t.taskId,
      workerId: this.id,
      reasonForIncompletion: result.reasonForIncompletion,
      // worker will provide this dynamic data
      status: result.status,
      outputData: result.outputData,
      logs: result.logs,
    };

    await this.api.postResult(taskResult);
    debug(
      `Worker=${this.id} Task Result Sent for taskId=${
        taskResult.taskId
      } ${JSON.stringify(taskResult)}`
    );
  }

  public async stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    // todo...really we should NACK all pending tasks
    this.stopPolling();
    debug(`Worker=${this.id} has stopped`);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}
