/**
 * These logs will get stored as part of Task Execution history.
 * For Example:
 * 	{ "log": "HTTP GET status=200", "createdTime": 1550178825 }
 */
export class TaskResultLog {

	/**
	 * Text message. For consistency use prefix: WARN: or ERROR: inside log string
	 *
	 * @type {string}
	 * @memberof TaskResultLog
	 */
	log: string;


	/**
	 * createdTime should be "number of milliseconds* since the Unix Epoch".
	 * Use "new Date().getTime()"
	 *
	 * @type {number}
	 * @memberof TaskResultLog
	 */
	createdTime: number;
}