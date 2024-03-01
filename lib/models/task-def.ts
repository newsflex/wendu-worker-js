/**
 * Task Definition - A worker SHOULD register the task definition it is
 * capable of performing. Once registered the task can be used in workflows.
 *
 * @export
 * @interface TaskDef
 */
export interface TaskDef {
  // unique identifier
  name: string;

  description?: string;

  retryCount?: number;
  timeoutSeconds?: number;
  responseTimeoutSeconds?: number;

  /** When configured with a value > 0, the system will wait for this task to complete successfully until this number of seconds from when the task is first polled. We can use this to fail a workflow when a task breaches the overall SLA for completion. */
  pollTimeoutSeconds?: number;

  inputKeys?: string[];
  outputKeys?: string[];

  // key=value object
  inputTemplate?: any;

  /*
	 RETRY : Retries the task again
	 TIME_OUT_WF : Workflow is marked as TIMED_OUT and terminated
	 ALERT_ONLY : Registers a counter (task_timeout)
	*/
  timeoutPolicy?: "RETRY" | "TIME_OUT_WF" | "ALERT_ONLY";

  // FIXED : Reschedule the task after the retryDelaySeconds
  // EXPONENTIAL_BACKOFF : reschedule after retryDelaySeconds  * attemptNumber
  // LINEAR_BACKOFF: Reschedule after retryDelaySeconds backoffRate attemptNumber
  retryLogic?: "FIXED" | "EXPONENTIAL_BACKOFF" | "LINEAR_BACKOFF";

  /** LINEAR_BACKOFF: Reschedule after retryDelaySeconds backoffRate attemptNumber */
  backoffRate?: number;

  retryDelaySeconds?: number;

  /** you can add the workflow name to be run on the failure of your current workflow: */
  failureWorkflow?: string;
}
