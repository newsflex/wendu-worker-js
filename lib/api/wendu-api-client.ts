import * as rm from 'typed-rest-client/RestClient';

import { Task, TaskResult, TaskDef } from '../models';
import { WenduApiOptions } from './wendu-api-options';

const debug = require('debug')('wendu');

export class WenduApiClient {

	private api: rm.RestClient;

	constructor(private opts: WenduApiOptions) {
		this.opts.workerIdentity = this.opts.workerIdentity || 'worker'
		this.api = new rm.RestClient(this.opts.workerIdentity, this.opts.url);
	}

	public async poll(taskName: string, total: number): Promise<Task[] | null> {

		const qs = {
			name: encodeURIComponent(taskName),
			id: encodeURIComponent(this.opts.workerIdentity),
			interval: this.opts.pollInterval,
			total: total || 1
		};

		const route = `/tasks/poll/${qs.name}?worker=${qs.id}&total=${qs.total}&interval=${qs.interval}`;

		debug(`GET ${route}`);
		const resp = await this.api.get<Task[]>(route);
		debug(`HTTP res status=${resp.statusCode}`);
		return resp.result;
	}

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

	public async postResult(result: TaskResult): Promise<TaskResult> {
		debug('POST /tasks');
		const resp = await this.api.create<TaskResult>('/tasks', result);
		debug(`HTTP res status=${resp.statusCode}`);
		if (resp.statusCode === 200) {
			return resp.result;
		}

		throw new Error(`Failed to post result due to api statusCode=${resp.statusCode}`)
	}

	public async register(taskDef: TaskDef): Promise<TaskDef> {

		if (!taskDef.name) {
			throw new Error('A Task definition must have a name');
		}

		debug(`POST /metadata/taskdefs`);
		const resp = await this.api.create<TaskDef>('/metadata/taskdefs', taskDef);
		debug(`HTTP res status=${resp.statusCode}`);
		if (resp.statusCode === 200) {
			return resp.result;
		}

		throw new Error(`Failed to regiser task definition due to api statusCode=${resp.statusCode}`)
	}
}