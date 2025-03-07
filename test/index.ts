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

//const url = "http://dt-wendu.itdev.ad.npr.org/";
const url = "https://st-orkes.npr.org/api";
const isOrkes = url.includes("orkes");
console.log("isOrkes", isOrkes);
const opts: WenduWorkerOptions = {
  //url: `http://localhost:1331`,
  url: url,
  keyId: isOrkes ? process.env.USER_ID : null,
  secret: isOrkes ? process.env.USER_SECRET : null,
  pollInterval: 5_000,
  total: 3,
  workerIdentity: "local-dev-roller",
  logToConsole: true,
  //taskDomain: "dev",
};

console.log(opts);

/*
const client = new WenduApiClient(opts);
client
  .startWorkflow({
    name: "joeTest_json_var_test",
    //name: "asdf",
  })
  .then(console.log)
  .catch(console.error);
  */

class DiceWorker extends WenduPollingWorker {
  constructor(opts: WenduWorkerOptions) {
    super(opts);
  }

  taskDef(): TaskDef | any {
    return {
      name: "_test_sleep",
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

    await this.sleep(15_000);
    return res;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
}

const worker = new DiceWorker(opts);
worker.start();
