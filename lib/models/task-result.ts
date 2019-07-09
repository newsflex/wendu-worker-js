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
	taskId: string;
	status: 'IN_PROGRESS' | 'FAILED' | 'COMPLETED',
	output?: any;
	logs?: string[]
}
