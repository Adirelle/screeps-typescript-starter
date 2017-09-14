import { BaseTask, Task } from './task';

interface TaskTarget {
  id?: string;
  name?: string;
  pos: RoomPosition;
}

export abstract class TargettedTask<T extends TaskTarget> extends BaseTask {

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
      this.creep.stopTask(`Target ${this.target} is not valid anymore`);
    }
  }

  public isSameAs(other: Task): boolean {
    return super.isSameAs(other) && other instanceof TargettedTask && this.isSameTargetAs(other.target);
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

  protected isSameTargetAs(other: TaskTarget): boolean {
    return other.id === this.target.id || other.name === this.target.name;
  }

  protected abstract targetToJSON(target: T): any;
  protected abstract targetFromJSON(data: any): T;
}
