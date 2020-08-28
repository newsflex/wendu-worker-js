const bent = require("bent");
const debug = require("debug")("wendu");

import {
  Task,
  TaskResult,
  TaskDef,
  WorkflowStart,
  WorkflowDef,
} from "../models";
import { WenduApiOptions } from "./wendu-api-options";
import { WenduWorkerOptions } from "../worker";

export class WenduApiClient {
  private getJson: any;
  private postJson: any;

  constructor(private opts: WenduApiOptions) {
    // always remove the trailing slash if the user provided it
    if (this.opts.url.endsWith("/")) {
      const len = this.opts.url.length;
      this.opts.url = this.opts.url.substring(0, len - 1);
    }

    // see https://github.com/mikeal/bent
    this.getJson = bent("GET", this.opts.url, "json");
    this.postJson = bent("POST", this.opts.url, "json");
  }

  /**
   * Ask the Wendu API for x (total) items from the
   * queue for the given task name.
   *
   * @param {string} taskName unique task name
   * @param {number} total number of items to dequeue
   * @returns {(Promise<Task[] | null>)}
   * @memberof WenduApiClient
   */
  public async poll(config: WenduWorkerOptions): Promise<Task[] | null> {
    const qs = {
      name: encodeURIComponent(config.taskName),
      id: encodeURIComponent(config.workerIdentity),
      interval: config.pollInterval,
      total: config.total,
    };

    const route = `/tasks/poll/${qs.name}?worker=${qs.id}&total=${qs.total}&interval=${qs.interval}`;
    const start = new Date().getTime();
    const items = await this.getJson(route);
    const elapsed = new Date().getTime() - start;
    debug(`HTTP GET ${route} returned ${items?.length} items. ${elapsed} ms`);
    return items;
  }

  /**
   * Acknowledge you (the worker) have recieved the task
   *
   * @param {{ taskId: string }} task
   * @returns {Promise<boolean>}
   * @memberof WenduApiClient
   */
  public async ack(task: { taskId: string }): Promise<boolean> {
    if (!task.taskId) {
      throw new Error("You must provide the taskId to acknowledge");
    }

    const route = `/tasks/${task.taskId}/ack`;
    debug(`POST ${route}`);
    await this.postJson(route, {});
    return true;
  }

  /**
   * Send the final task result to the API. Send all failures and completes.
   * You may also send an IN_PROGRESS status for tasks that you expect to take a long time for better visibility.
   *
   * @param {TaskResult} result
   * @returns {Promise<TaskResult>}
   * @memberof WenduApiClient
   */
  public async postResult(result: TaskResult): Promise<TaskResult> {
    debug(result);
    const resp = await this.postJson(`/tasks`, result);
    debug(`HTTP POST /tasks res=${JSON.stringify(resp)}`);
    return resp;
  }

  /**
   * Register a new Task Definition before polling the task queue.
   *
   *
   * @param {TaskDef} taskDef
   * @returns {Promise<TaskDef>}
   * @memberof WenduApiClient
   */
  public async register(taskDef: TaskDef): Promise<TaskDef> {
    if (!taskDef.name) {
      throw new Error("A Task definition must have a name");
    }

    debug(taskDef);
    const resp = await this.postJson("/metadata/taskdefs", taskDef);
    debug(`HTTP POST /metadata/taskdefs resp=${JSON.stringify(resp)}`);
    return resp;
  }

  public async startWorkflow(wf: WorkflowStart): Promise<any> {
    if (!wf.name) {
      throw new Error("A Workflow name must be provided to start a wf");
    }

    debug(wf);
    const resp = await this.postJson("/workflows", wf);
    debug(`HTTP POST /metadata/taskdefs res=${JSON.stringify(resp)}`);
    return resp;
  }

  public async createWorkflowDef(wf: WorkflowDef): Promise<any> {
    if (!wf.name) {
      throw new Error("A Workflow name must be provided");
    }

    debug(wf);
    const resp = await this.postJson("/metadata/workflow", wf);
    debug(`HTTP POST /metadata/workflow res=${JSON.stringify(resp)}`);
    return resp;
  }
}
