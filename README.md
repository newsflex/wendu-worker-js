# wendu-worker-js

A lightweight Wendu Worker Typescript/Javascript lib for polling the Wendu Orchestration API

Install using `npm install --save wendu-worker-js`

## General Worker Steps

A worker is a micro-server that performs a task for the Wendu Orchestration engine. A woker should be implemented in the following pattern

1) Register the TaskDefinition with a unique task name this worker performs. Task name should be lowercase with alpha-numerica chars and dashes. For example: `copy-file`
1) The worker should periodically (interval) poll (GET) the API for tasks in the queue.
1) Once a worker gets a task via polling it should immediately  acknowledge (POST) it has received the task. An un-acked task will get requed for other workers.
1) The worker should perform the unique task/work as necessary
1) Once completed (success or failed) the result should be reported (POST) back to the API.

## How to Create your own Polling Worker

If you implement the included abstract class WenduPollingWorker then most of the worker logic is already implemented.
The base class will:
	- register the task definition in Wendu API
	- manage the polling of the task to Wendu API
	- acknowledge that a task has been received to Wendu API
	- notify Wendu that the task is in progress to Wendu API
	- run the async `execute(task)` method you provide
	- report the final result to Wendu API

Example Polling Worker implementation:

```
import { WenduWorkerOptions, WenduPollingWorker, WenduWorkerResult, Task, TaskDef } from 'wendu-worker-js';

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
```

Example Output:

```
  wendu Worker=say-hello-task-worker is starting +0ms
  wendu Worker=say-hello-task-worker will poll for work exery 5000 MS +2ms
  wendu Worker=say-hello-task-worker has started +1ms
  wendu HTTP GET /tasks/poll/say-hello?worker=say-hello-task-worker&total=2&interval=5000 res=200 returned 0 items +0ms
  wendu HTTP GET /tasks/poll/say-hello?worker=say-hello-task-worker&total=2&interval=5000 res=200 returned 1 items +5s
  wendu POST /tasks/163d3398-aaf0-4616-80c6-4dc855c5c15f/ack +1ms
  wendu HTTP res status=200 +4ms
  wendu Worker=say-hello-task-worker acked = true taskId=163d3398-aaf0-4616-80c6-4dc855c5c15f +30s
  wendu { workflowInstanceId: '83bbc064-51b8-4e16-a16b-889a9394cab5',
  wendu   taskId: '163d3398-aaf0-4616-80c6-4dc855c5c15f',
  wendu   workerId: 'say-hello-task-worker',
  wendu   status: 'IN_PROGRESS',
  wendu   outputData: undefined,
  wendu   logs: undefined } +1ms
  wendu HTTP POST /tasks res=200 +5ms
  wendu Worker=say-hello-task-worker Task Result Sent for taskId=163d3398-aaf0-4616-80c6-4dc855c5c15f +6ms
```

## How to Use the Client

Under the hood the worker uses a Wendu API client. In most cases a worker implementation does not need to reference the API directly.

### Create a client

Create and reuse this client. It uses <https://github.com/mikeal/bent> under the hood for HTTP calls which will work in browser or nodejs.

```
const opt: WenduApiOptions = {
	url: `http://localhost:1331`
};

const client = new WenduApiClient(opt);
```

### Register a Task Definition

A task def must be registered before it can be used in a workflow. It is ok to register a task more than once as long as you do not try to change the actual def. Any changes to the def should packaged into a NEW task defintion.

- `async register(taskDef: TaskDef): Promise<TaskDef> `

```
await client.register({
			name: 'hello-world',
			timeoutPolicy: 'RETRY',
			timeoutSeconds: 5,
			retryLogic: 'FIXED',
			retryCount: 1,
			inputKeys: ['name', 'language'],
			outputKeys: ['greeting'],
			inputTemplate: {}
		});
```

### Poll for Tasks

- `async poll(taskName: string, total: number): Promise<Task[] | null>`

```
const tasks = await client.poll('move-file', 10);
```

### Acknowledge a Task has been Received

- `async ack(task: { taskId: string }): Promise<boolean>`

```
const acked = await client.ack(t);
```

### Post Task Completion Results

- `async postResult(result: TaskResult): Promise<TaskResult>`

```
const result: TaskResult = {
  status: 'COMPLETED',
  taskId: t.taskId,
  outputData: {
	 filePath: '//fileshare/temp/newfile.mp3'
  },
  logs: ['INFO: Moving file']
 };

await client.postResult(result);
```

## Example Client Code

See example in `/test` subfolder

### Getting Started: Writing a NodeJS Typescript Worker

1) Create a new directory
2) Use Node 10.8. `nvm use 10.8.0`
3) Run `npm init`
3) Run `npm i typescript --save-dev`
4) Run `npx tsc --init` (tsc > 3.0.3) (npx is a npm package runner and runs tsc locally)

Use the following tsconfig.json options:

```
{ "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "moduleResolution": "node",
    "typeRoots": [ "node_modules/@types" ]
}
```

5) Run `npm install --save-dev @types/node`
6) Run `npm install --save-dev debug`
7) Run `npm install --save wendu-worker-js`
8) Write a new worker with a new/unique task def
9) Change package.json "start" command to `tsc && DEBUG=wendu node index.js` or run directly with `npx tsc && DEBUG=wendu node index.js`