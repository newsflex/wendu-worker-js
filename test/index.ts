import {
  Task,
  TaskDef,
  WenduPollingWorker,
  WenduWorkerOptions,
  WenduWorkerResult,
} from "wendu-worker";

if (!process.env.USER_ID || !process.env.USER_SECRET) {
  throw new Error("Missing process.env.USER_KEY and process.env.USER_SECRET");
}

const opts: WenduWorkerOptions = {
  //url: `http://localhost:1331`,
  //url: "https://npr-app.orkesconductor.io/",
  //url: `http://dt-wendu.itdev.ad.npr.org/`,
  url: "https://nexus-stage-wtz.orkesconductor.net/api",
  keyId: process.env.USER_ID,
  secret: process.env.USER_SECRET,
  pollInterval: 2_000,
  total: 10,
  workerIdentity: "local-dev-roller",
  logToConsole: true,
  //taskDomain: "dev",
};

class DiceWorker extends WenduPollingWorker {
  constructor(opts: WenduWorkerOptions) {
    super(opts);
  }

  taskDef(): TaskDef | any {
    return {
      name: "dice_roll2",
      description: "rolling a dice",
      retryCount: 0,
      responseTimeoutSeconds: 15,
      timeoutSeconds: 30,
      inputKeys: ["sides"],
      outputKeys: ["roll"],
      inputTemplate: null,
      timeoutPolicy: "RETRY",
      retryDelaySeconds: 15,
    };
  }

  // actual work goes inside execute method.
  // this is fired for each task dequeues from Polling interval
  protected async execute(task: Task): Promise<WenduWorkerResult> {
    // default to 6 sided dice
    const sides = task.inputData["sides"] || 6;
    const roll = Math.floor(sides * Math.random()) + 1;

    const res: WenduWorkerResult = {
      status: "COMPLETED",
      outputData: { roll: roll },
      logs: [
        {
          log: "i am the simpliest task there is",
          createdTime: new Date().getTime(),
        },
      ],
    };

    return res;
  }
}

const worker = new DiceWorker(opts);

worker.start();
