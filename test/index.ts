import {
	WenduWorkerOptions, WenduPollingWorker, WenduWorkerResult,
	Task, TaskDef, WenduApiClient, WenduApiOptions
} from 'wendu-worker';

const opts: WenduWorkerOptions = {
	url: `http://localhost:1331`,
	//url: `http://dt-wendu.itdev.ad.npr.org/`,
	pollInterval:500,
	total: 10,
	workerIdentity: 'local-dev-roller',
	taskName: 'dice-roll',
};

class DiceWorker extends WenduPollingWorker {

	constructor(opts: WenduWorkerOptions) {
		super(opts);
	}

	taskDef(): TaskDef {
		return {
			name: 'dice-roll',
			description: 'rolling a dice',
			retryCount: 0,
			timeoutSeconds: 1,
			inputKeys: ['sides'],
			outputKeys: ['roll'],
			inputTemplate: null,
			timeoutPolicy: 'RETRY',
			retryDelaySeconds: 15,
		}
	}

	// actual work goes inside execute method.
	// this is fired for each task dequeues from Polling interval
	protected async execute(task: Task): Promise<WenduWorkerResult> {

		// default to 6 sided dice
		const sides = task.input['sides'] || 6;
		const roll = Math.floor(sides * Math.random()) + 1;

		const res: WenduWorkerResult = {
			status: 'COMPLETED',
			outputData: { roll: roll },
			logs: [
				{ log: 'i am the simpliest task there is', createdTime: new Date().getTime() }
			]
		};

		return res;
	}
}

const worker = new DiceWorker(opts);

worker.start();

// worker.stop();


/* Example 2 - Creating a direct API client */

const opt: WenduApiOptions = {
	url: `http://localhost:1331`
};

const client = new WenduApiClient(opt);