
/**
 * A request to Start a new wf
 * AKA create a WF Instance
 *
 * @export
 * @interface WorkflowStart
 */
export interface WorkflowStart {
	name: string;
	version?: number;
	input?: any;

	correlationId?: string;
}