import { BaseTask } from './task';

export abstract class TargettedTask<T extends {pos: RoomPosition}> extends BaseTask {

  public get pos() {
    return this.target && this.target.pos;
  }

  constructor(public target: T, creep?: Creep) {
    super(creep);
  }

  public run(): void {
    if (this.hasValidTarget()) {
      super.run();
    } else if (this.creep) {
      this.creep.stopTask();
    }
  }

  public toString(): string {
    return `${this.type}(${this.target},${this.priority})`;
  }

  public hasValidTarget(): boolean {
    return this.isValidTarget(this.target);
  }

  public abstract isValidTarget(_target: T): boolean;

  public toJSON(): any {
    return { type: this.type, target: this.targetToJSON(this.target) };
  }

  public fromJSON({target}: any): void {
    this.target = this.targetFromJSON(target);
  }

  protected moveToTarget(): ResultCode {
    return this.creep!.moveTo(this.target);
  }

  protected abstract targetToJSON(target: T): any;
  protected abstract targetFromJSON(data: any): T;
}
