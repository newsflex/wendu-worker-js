export interface WenduEvent {
  /** Event name/key - required **/
  name: string;

  /** Assign a correlation to track events through wendu system **/
  correlationId?: string;

  /** Key/Value object  **/
  input: any;
}
