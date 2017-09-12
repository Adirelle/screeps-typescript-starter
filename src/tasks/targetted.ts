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

  protected moveToTarget(): ResultCode {
    return this.creep!.moveTo(this.target);
  }
}
