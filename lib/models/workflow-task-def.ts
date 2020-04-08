export interface WorkflowTaskDef {
    /**
     * Name of the task. MUST be registered as a task with Conductor before starting the workflow
     *
     * @type {string}
     * @memberof WorkflowTaskDef
     */
    name: string;
    version?: number;
    /**
     * Alias used to refer the task within the workflow. MUST be unique within workflow.
     *
     * @type {string}
     * @memberof WorkflowTaskDef
     */
    taskReferenceName: string;
    /**
     * Optional task description
     *
     * @type {string}
     * @memberof WorkflowTaskDef
     */
    description?: string;
    type: string;
    // true or false. When set to true - workflow continues even if the task fails. The status of the task is reflected as COMPLETED_WITH_ERRORS
    optional?: boolean;
    inputParameters?: any;
    // not supported
    domain?: string;
    // for decision system task
    caseValueParam?: string;
    decisionCases?: {
        [key: string]: WorkflowTaskDef[];
    };
    defaultCase?: WorkflowTaskDef[];
}
