import { WenduApiClient, TaskResult, WenduApiOptions } from 'wendu-worker';

const opts: WenduApiOptions = {
	url: `http://localhost:1331`,
	pollInterval: 5*1000,
	workerIdentity: 'test-worker',
};

const client = new WenduApiClient(opts);

let pollAndDoWork = async () => {

	console.debug(`Wendu API=${opts.url} interval=${opts.pollInterval} id=${opts.workerIdentity}`);
	// ask for an item to de-queue
	console.debug('polling for task-say-hello');
	const tasks = await client.poll('task-say-hello', 1);
	console.debug(tasks);

	if (tasks && tasks.length === 0) {
		console.debug('no tasks found in queue');
	}

	for (let t of tasks) {

		// tell the api you have recieved the task (acknowledge it)
		const acked = await client.ack(t);
		console.debug(`acked = ${acked === true} taskId=${t.taskId}`);

		// do some real work in here


		// once done you send result to api
		const result: TaskResult = {
			workflowInstanceId: t.workflowId,
			status: 'COMPLETED',
			taskId: t.taskId,
			workerId: opts.workerIdentity,
			outputData: {
				report: 'can be anything in here'
			},
			logs: [{ log: 'log messages get saved into wf task results', createdTime: new Date().getTime().toString() }]
		};

		await client.postResult(result);
		console.debug(`Task Result Sent for taskId=${result.taskId}`);
	}
}

setInterval(() => pollAndDoWork(), opts.pollInterval);

