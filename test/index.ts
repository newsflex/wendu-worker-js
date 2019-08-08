import { WenduWorkerOptions, WenduPollingWorker, WenduWorkerResult, Task, TaskDef } from 'wendu-worker';

const opts: WenduWorkerOptions = {
	url: `http://localhost:1331`,
	pollInterval: 5*1000,
	total: 2,
	workerIdentity: 'say-hello-task-worker',
	taskName: 'say-hello',
};

class HelloWorker extends WenduPollingWorker {

	constructor(opts: WenduWorkerOptions) {
		super(opts);
	}

	taskDef(): TaskDef {
		return {
			name: 'say-hello',
			description: 'i simply say hello world.',
			retryCount: 0,
			timeoutSeconds: 2,
			inputKeys: ['name'],
			outputKeys: ['msg'],
			inputTemplate: null,
			timeoutPolicy: 'RETRY',
			retryDelaySeconds: 15,
		}
	}

	// actual work goes inside execute method.
	// this is fired for each task dequeues from Polling interval
	protected async execute(task: Task): Promise<WenduWorkerResult> {

		const output = { msg: `Hello World from task id=${task.taskId}` };

		console.log(output);

		const res: WenduWorkerResult = {
			status: 'COMPLETED',
			outputData: output,
			logs: [
				{ log: 'i am the simpliest task there is', createdTime: new Date().getTime() }
			]
		};

		return res;
	}
}

const worker = new HelloWorker(opts);

worker.start();

// worker.stop();
