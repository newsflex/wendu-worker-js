import { TaskResultLog } from './task-result-log';

/**
 * The worker lets the API know about the task result.
 * An IN_PROGRESS is an optional update when the task starts.
 * The Worker MUST send the final Failed or Completed result before
 * the API/Orchestration service marks the task as a TIMEOUT
 * and requeues the task again.
 *
 * @export
 * @interface TaskResult
 */
export interface TaskResult {
	workflowInstanceId: string;

	taskId: string;

	reasonForIncompletion?: string;

	// not implemented
	callbackAfterSeconds?: number;

	status: 'IN_PROGRESS' | 'FAILED' | 'COMPLETED',

	workerId: string;

	outputData?: { [key: string]: any };

	logs?: TaskResultLog[]
}
