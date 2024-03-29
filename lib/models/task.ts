import { WorkerLog } from "./logger";

/**
 * The unit of work to be completed by the worker.
 * - input is a key/value object of various parameters.
 * - logs may be (optionaly) stored in the task to be viewed later in devops/debug from API
 * - output is a key/value object that should be set by the worker. only populate data needed by the wf or other tasks. Keep it small
 * - workflowId (optional) is for logging and reference
 *
 * @export
 * @interface Task
 */
export interface Task {
  name: string;
  taskId: string;
  status: string;
  inputData: any;
  output?: any;

  correlationId: string;
  workflowInstanceId?: string;

  logger?: WorkerLog;
}
