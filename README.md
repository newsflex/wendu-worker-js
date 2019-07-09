# wendu-worker-js

A lightweight Wendu Worker Typescript/Javascript lib for polling the Wendu Orchestration API

## Worker Implementation

A worker is a micro-server that performs a task for the Wendu Orchestration engine. A woker should be implemented in the following pattern

1) Register the TaskDefinition with a unique task name this worker performs. Task name should be lowercase with alpha-numerica chars and dashes. For example: `copy-file`
1) The worker should periodically (interval) poll (GET) the API for tasks in the queue.
1) Once a worker gets a task via polling it should immediately  acknowledge (POST) it has received the task. An un-acked task will get requed for other workers.
1) The worker should perform the unique task/work as necessary
1) Once completed (success or failed) the result should be reported (POST) back to the API.

## Installation

Install with
```
npm install wendu-worker-js
```

## How to Use the Client

### Create a client

Create and reuse this client. It uses <https://github.com/microsoft/typed-rest-client/> under the hood for HTTP calls.

```
const opts: WenduApiOptions = {
	url: `http://localhost:1331`,
	pollInterval: 5*1000,
	workerIdentity: 'worker-joe',
};

const client = new WenduApiClient(opts);
```

### Register a Task Definition

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
  output: {
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
4) Run `tsc --init` (tsc > 3.0.3)

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
7) Run `npm install --save wendu-worker-test`
8) Write a new worker with a new/unique task def
9) Compile and run with `tsc && DEBUG=wendu node index.js `