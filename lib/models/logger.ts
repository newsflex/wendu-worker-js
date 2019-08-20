import { TaskResultLog } from './task-result-log';

export class Logger {

   private logs: TaskResultLog[] = [];

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
      this.logs.push({ log: msg, createdTime: new Date().getTime() });
   }

   public getAll(): TaskResultLog[] {
      return this.logs || [];
   }
}