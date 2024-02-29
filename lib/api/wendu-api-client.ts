const bent = require("bent");
const debug = require("debug")("wendu");
import fetch from "node-fetch";
import {
  Task,
  TaskDef,
  TaskResult,
  WenduEvent,
  WorkflowDef,
  WorkflowStart,
} from "../models";
import { WenduWorkerOptions } from "../worker";
import { WenduApiOptions } from "./wendu-api-options";

export class WenduApiClient {
  private postJson: any;

  // token cache
  private token: string = null;

  public isOrkesMode() {
    return this.opts?.keyId && this.opts?.secret;
  }

  constructor(private opts: WenduApiOptions) {
    // always remove the trailing slash if the user provided it
    if (this.opts.url.endsWith("/")) {
      const len = this.opts.url.length;
      this.opts.url = this.opts.url.substring(0, len - 1);
    }

    // see https://github.com/mikeal/bent
    const headers = {};
    this.postJson = bent(
      "POST",
      200,
      201,
      400,
      404,
      this.opts.url,
      "json",
      headers
    );
  }

  public async getToken() {
    if (!this.isOrkesMode()) {
      // wendu mode has no need for tokens but orkes does
      // orkes mode will provide these values
      debug("getToken disabled due to missing keyId and secret (legacy mode)");
      return null;
    }

    debug("get json web token");

    if (this.token) {
      return this.token;
    }

    const route = `/token`;

    const token = await this.postJson(route, {
      keyId: this.opts.keyId,
      keySecret: this.opts.secret,
    });
    debug(`HTTP Token = `, token);
    this.token = token.token;
    return this.token;
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
      total: config.total,
    };

    // worker querystring for wendu and workerId/domain for conductor
    let route = `/tasks/poll/${qs.name}?worker=${qs.id}&workerid=${qs.id}&total=${qs.total}&interval=${qs.interval}`;

    // blank domains cause issues so only add if there is a proper app domain
    if (config.taskDomain?.length > 0) {
      route = route + `&domain=${config.taskDomain ?? ""}`;
    }

    let token = await this.getToken();
    let url = this.opts.url + route;

    debug("GET " + url);
    const response = await fetch(url, {
      method: "get",
      headers: {
        "X-Authorization": token,
        "Content-Type": "application/json",
        "User-Agent": "wendu-worker",
      },
    });
    debug(`HTTP POST ${url} resp=${response.status}`);
    if (response.status === 200) {
      const data = await response.json();
      debug("data", data);
      return data as Task[];
    }

    //const items = await this.getJson(route);
    //const elapsed = new Date().getTime() - start;
    //debug(`HTTP GET ${route} returned ${items?.length} items. ${elapsed} ms`);
    //return items;
    return [];
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
      throw new Error("You must provide the taskId to acknowledge");
    }

    const route = `/tasks/${task.taskId}/ack`;
    debug(`POST ${route}`);
    //await this.postJson(route, {});
    return true;
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
    //const resp = await this.postJson(`/tasks`, result);

    let token = await this.getToken();
    let url = this.opts.url + "/tasks";

    const resp = await fetch(url, {
      method: "post",
      headers: {
        "X-Authorization": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    });

    debug(`HTTP POST ${url} res=${resp.status}`);

    if (resp.status !== 200) {
      let respErrorBody;
      try {
        respErrorBody = await resp.json();
      } catch (err2) {
        debug(err2);
      }

      throw new Error(
        `Failed to report task result to Orch API ${resp?.status} ${resp?.statusText} ${respErrorBody}`
      );
    }

    return result;
  }

  /**
   * Register a new Task Definition before polling the task queue.
   *
   *
   * @param {TaskDef} taskDef
   * @returns {Promise<TaskDef>}
   * @memberof WenduApiClient
   */
  public async register(taskDef: TaskDef, token): Promise<TaskDef> {
    if (!taskDef.name) {
      throw new Error("A Task definition must have a name");
    }

    try {
      debug(taskDef);

      const token = await this.getToken();

      const body = [taskDef];
      //const resp = await this.postJson("/metadata/taskdefs", data);

      let url = this.opts.url + "/metadata/taskdefs";

      const response = await fetch(url, {
        method: "post",
        body: JSON.stringify(body),
        headers: {
          "X-Authorization": token,
          "Content-Type": "application/json",
        },
      });
      debug(`HTTP POST ${url} resp=${response.status}`);
      if (response.status === 200) {
        return taskDef;
      }
    } catch (err) {
      debug("ERROR:" + err);
      throw err;
    }
  }

  public async startWorkflow(wf: WorkflowStart): Promise<any> {
    if (!wf.name) {
      throw new Error("A Workflow name must be provided to start a wf");
    }

    debug(wf);
    const resp = await this.postJson("/workflows", wf);
    debug(`HTTP POST /workflows res=${JSON.stringify(resp)}`);
    return resp;
  }

  public async createWorkflowDef(wf: WorkflowDef): Promise<any> {
    if (!wf.name) {
      throw new Error("A Workflow name must be provided");
    }

    debug(wf);
    const resp = await this.postJson("/metadata/workflow", wf);
    debug(`HTTP POST /metadata/workflow res=${JSON.stringify(resp)}`);
    return resp;
  }

  /** Relays events into Message Queue in Wendu.
   * This will queue any wfs that may be listening for these events **/
  public async queueEvent(event: WenduEvent): Promise<any> {
    if (!event.name) {
      throw new Error("A Wendu Event name must be provided");
    }

    debug(event);
    const resp = await this.postJson("/events", event);
    debug(`HTTP POST /events res=${JSON.stringify(resp)}`);
    return resp;
  }
}
