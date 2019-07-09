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

	inputKeys?: string[];
	outputKeys?: string[];

	// key=value object
	inputTemplate?: any;

	/*
	 RETRY : Retries the task again
	 TIME_OUT_WF : Workflow is marked as TIMED_OUT and terminated
	 ALERT_ONLY : Registers a counter (task_timeout)
	*/
	timeoutPolicy?: 'RETRY' | 'TIME_OUT_WF' | 'ALERT_ONLY';

	//  FIXED : Reschedule the task after the retryDelaySeconds
	// EXPONENTIAL_BACKOFF : reschedule after retryDelaySeconds  * attemptNumber
	retryLogic?: 'FIXED' | 'EXPONENTIAL_BACKOFF';

	retryDelaySeconds?: number;
}