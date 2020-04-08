import { WorkflowTaskDef } from "./workflow-task-def";

/**
 * Workflow Definition
 *
 * @export
 * @interface WorkflowDef
 */
export interface WorkflowDef {


    /**
     *
     * Required
     * @type {string}
     * @memberof WorkflowDef
     */
    name: string;
  
    /**
     *
     * Optional
     * @type {string}
     * @memberof WorkflowDef
     */
    description?: string;
  
    // defaults to highest
    version: number;
  
    tasks: WorkflowTaskDef[];
  
    // v1 support
    disabled?: boolean;
  
  
    /**
     * List of input parameters. Used for documenting the required inputs to workflow
     * Optional
     * @type {*}
     * @memberof WorkflowDef
     */
    inputParameters?: string[];
  
  
    /**
     * JSON template used to generate the output of the workflow
     * If not specified, the output is defined as the output of the last executed task
     * @type {*}
     * @memberof WorkflowDef
     */
    outputParameters?: any;
  
    restartable?: boolean;
  }