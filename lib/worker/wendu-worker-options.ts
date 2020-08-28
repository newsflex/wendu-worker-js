import { WenduApiOptions } from "../api";

export interface WenduWorkerOptions extends WenduApiOptions {
  /**
   * The unique task name the worker will poll for and complete
   *
   * @type {string}
   * @memberof WorkerConfig
   */
  taskName?: string;

  /**
   * Optional
   * The client includes this int he GET querystring to identity itself to the orchestrator
   *
   * @type {string}
   * @memberof WenduApiOptions
   */
  workerIdentity?: string;

  /**
   * Optional
   * The client doesn't poll for you but if set this interval will be included in the GET queyrstring
   * to let the orchestrator know often you will be polling for.
   *
   * @type {number}
   * @memberof WenduApiOptions
   */
  pollInterval?: number;

  /**
   * The total number of tasks the worker will attempt to dequeue each polling check.
   *
   * @type {number}
   * @memberof WenduWorkerOptions
   */
  total: number;

  logToConsole?: boolean;
}
