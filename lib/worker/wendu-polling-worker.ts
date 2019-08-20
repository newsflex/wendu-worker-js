import { WenduApiClient } from '../api';
import { WenduWorkerOptions } from './wendu-worker-options';
import { Task, TaskResult, TaskDef } from '../models';
import { WenduWorkerResult } from './wendu-worker-result';

const debug = require('debug')('wendu');


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

	private pollingInterval: NodeJS.Timeout;
	private api: WenduApiClient;

	get id(): string {
		return this.config.workerIdentity;
	}

	constructor(private config: WenduWorkerOptions) {
		config.taskName = this.taskDef().name;
		this.api = new WenduApiClient(config);
	}

	public async start() {
		debug(`Worker=${this.id} is starting`);
		this.stopPolling();

		if (!this.config.pollInterval || this.config.pollInterval === 0) {
			throw new Error(`You must provide a valid polling interval in config`);
		}

		await this.registerTaskDef();

		debug(`Worker=${this.id} will poll for work exery ${this.config.pollInterval} MS`);

		this.pollingInterval = setInterval(async () => { await this.pollForWork() }, this.config.pollInterval);

		debug(`Worker=${this.id} has started`);
	};

	private async registerTaskDef() {
		const td = this.taskDef();

		if (!td) {
			debug(`No Task def provided. Skipping task def registration. It must already exist or worker will fail.`);
			return;
		}

		debug(`attempting to register taskdef=${td.name}`);
		if (td.name !== this.config.taskName) {
			throw new Error('Task Def name must match polling task name');
		}
		await this.api.register(this.taskDef());
	}

	private async pollForWork() {
		if (isNaN(this.config.total)) {
			throw new Error('You must provide a valid number of items to poll for (to dequeue)');
		}

		const tasks = await this.api.poll(this.config);
		await Promise.all(tasks.map(async t => await this.processTask(t)));
	}

	private async processTask(t: Task) {
		await this.ackTask(t);
		await this.sendTaskResult(t, { status: 'IN_PROGRESS' });
		try {

			const result = await this.execute(t);
			await this.sendTaskResult(t, result);

		} catch (err) {

			debug(`ERROR: Failed to perform taskId=${t.taskId} work due to un-caught err in worker implementation. Reporting task as failed`);
			debug(err);

			await this.sendTaskResult(t, {
				status: 'FAILED', logs: [{
					log: err.toString(),
					createdTime: new Date().getTime()
				}]
			});
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

		// once done you send result to api
		const taskResult: TaskResult = {

			workflowInstanceId: t.workflowId,
			taskId: t.taskId,
			workerId: this.id,

			// worker will provide this dynamic data
			status: result.status,
			outputData: result.outputData,
			logs: result.logs
		};

		await this.api.postResult(taskResult);
		debug(`Worker=${this.id} Task Result Sent for taskId=${taskResult.taskId}`);
	}

	private async ackTask(t: Task) {
		// tell the api you have recieved the task (acknowledge it)
		const acked = await this.api.ack(t);
		debug(`Worker=${this.id} acked = ${acked === true} taskId=${t.taskId}`);
	}

	public async stop() {
		debug(`Worker=${this.id} is stopping`);
		this.stopPolling();
		debug(`Worker=${this.id} has stopped`);
	}

	private stopPolling() {
		if (this.pollingInterval) {
			debug(`Worker=${this.id} clearing Polling interval`);
			clearInterval(this.pollingInterval);
		}
	}
}