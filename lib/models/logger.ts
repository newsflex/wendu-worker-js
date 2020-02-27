import { TaskResultLog } from './task-result-log';
const debug = require('debug')('wendu');

export class WorkerLog {

   private logs: TaskResultLog[] = [];

   /**
    *
    */
   constructor(private opts?: { logToConsole?: boolean }) {

   }

   public log(msg: string) {
      this.add(msg);
   }

	public debug(msg: string) {
      this.add(`DEBUG: ${msg}`);
   }

	public info(msg: string) {
      this.add(`INFO: ${msg}`);
   }

   public warn(msg: string) {
      this.add(`WARN: ${msg}`);
   }

   public error(msg: string) {
      this.add(`ERROR: ${msg}`);
   }

   private add(msg: string) {
      const t = new Date().getTime();
      this.logs.push({ log: msg, createdTime: t });
      debug(`${t}: ${msg}`);

      if (this.opts?.logToConsole === true) {
         console.log(`${t}: ${msg}`);
      }
   }

   public getAll(): TaskResultLog[] {
      return this.logs || [];
   }
}