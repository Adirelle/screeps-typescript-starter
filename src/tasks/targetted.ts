import { BaseTask, Task } from './task';

interface TaskTarget {
  id: string;
  pos: RoomPosition;
}

export abstract class TargettedTask<T extends TaskTarget> extends BaseTask {
  private _target: T|null;

  public get target(): T {
    if (this._target) {
      return this._target;
    }
    this._target = Game.getObjectById<T>(this.memory.targetId);
    if (!this._target) {
      throw new Error(`Unknown object ${this.memory.targetId}`);
    }
    return this._target;
  }

  public set target(target: T) {
    this.memory.targetId = target.id;
  }

  constructor(creep?: Creep, target?: T) {
    super(creep);
    if (target) {
      this.target = target;
    }
  }

  public getPos(): RoomPosition {
    return this.target.pos;
  }

  public isSameAs(other: Task): boolean {
    return (super.isSameAs(other)
      && (other instanceof TargettedTask)
      && (other.target && other.target.id) === (this.target && this.target.id)
    );
  }

  public run(): void {
    if (this.isValidTarget(this.target)) {
      super.run();
    } else {
      delete this.creep;
    }
  }

  public toString(): string {
    return `${this.type}(${this.target},${this.priority})`;
  }

  public abstract isValidTarget(target: T): boolean;

  protected moveToTarget(): ResultCode {
    return this.creep!.moveTo(this.target);
  }
}
