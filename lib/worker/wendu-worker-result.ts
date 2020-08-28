import { TaskResultLog } from "../models";

/**
 * A smaller subset of task result data required for
 * sending the result to the API.
 *
 * The base class with create a bigger model
 * with taskId and workflowId automatically.
 *
 * @export
 * @interface WenduWorkerResult
 */
export interface WenduWorkerResult {
  status: "IN_PROGRESS" | "FAILED" | "COMPLETED";

  /**
   * key/value data. Only put data in here that subsequeue tasks/workflow require.
   * Keep it small!
   *
   * @type {{ [key: string]: any }}
   * @memberof WenduWorkerResult
   */
  outputData?: { [key: string]: any };

  logs?: TaskResultLog[];
}
