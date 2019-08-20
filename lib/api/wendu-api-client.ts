import * as rm from 'typed-rest-client/RestClient';

import { Task, TaskResult, TaskDef } from '../models';
import { WenduApiOptions } from './wendu-api-options';
import { WenduWorkerOptions } from '../worker';

const debug = require('debug')('wendu');

export class WenduApiClient {

	private api: rm.RestClient;

	constructor(private opts: WenduApiOptions) {
		this.api = new rm.RestClient('Wendu-Worker', this.opts.url);
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
			total: config.total
		};

		const route = `/tasks/poll/${qs.name}?worker=${qs.id}&total=${qs.total}&interval=${qs.interval}`;
		//tood post;
		const resp = await this.api.get<Task[]>(route);
		const totalFound = resp && resp.result ? resp.result.length : 0;
		debug(`HTTP GET ${route} res=${resp.statusCode} returned ${totalFound} items`);
		return resp.result;
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
			throw new Error('You must provide the taskId to acknowledge');
		}

		const route = `/tasks/${task.taskId}/ack`;
		debug(`POST ${route}`);
		const resp = await this.api.create<any>(route, {});
		debug(`HTTP res status=${resp.statusCode}`);
		return resp.statusCode === 200;
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
		const resp = await this.api.create<TaskResult>('/tasks', result);
		debug(`HTTP POST /tasks res=${resp.statusCode}`);
		if (resp.statusCode === 200) {
			return resp.result;
		}

		throw new Error(`Failed to post result due to api statusCode=${resp.statusCode}`)
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
			throw new Error('A Task definition must have a name');
		}

		debug(taskDef);
		const resp = await this.api.create<TaskDef>('/metadata/taskdefs', taskDef);
		debug(`HTTP POST /metadata/taskdefs res=${resp.statusCode}`);
		if (resp.statusCode === 200) {
			return resp.result;
		}

		throw new Error(`Failed to regiser task definition due to api statusCode=${resp.statusCode}`)
	}
}