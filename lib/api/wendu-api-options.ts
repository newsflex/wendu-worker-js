export class WenduApiOptions {

	/**
	 * Wendu API url - use http://localhost:1331 when testing a local instance
	 *
	 * @type {string}
	 * @memberof WenduApiOptions
	 */
	url: string;

	/**
	 * Optional
	 * The client includes this int he GET querystring to identity itself to the orchestrator
	 *
	 * @type {string}
	 * @memberof WenduApiOptions
	 */
	workerIdentity?: string


	/**
	 * Optional
	 * The client doesn't poll for you but if set this interval will be included in the GET queyrstring
	 * to let the orchestrator know often you will be polling for.
	 *
	 * @type {number}
	 * @memberof WenduApiOptions
	 */
	pollInterval?: number;
}