
export interface Task {
  readonly id: string;
  readonly type: string;
  priority: number;
  pos: RoomPosition;
  isSameAs(other: any): boolean;
  toString(): string;
}

export abstract class BaseTask implements Task {
  public abstract get type(): string;
  public abstract get priority(): number;
  public abstract get pos(): RoomPosition;

  private _id?: string;

  public get id(): string {
    if (this._id !== undefined) {
      return this._id;
    }
    const id = this.toString();
    this._id = id;
    return id;
  }

  public isSameAs(other: any): boolean {
    return other instanceof BaseTask && other.id === this.id;
  }

  public toString(): string {
    return `${this.type}(${this.pos},${this.priority})`;
  }
}

export type Enqueue<T> = (t: T) => void;

export interface Manager<T extends Task> {
  readonly type: string;
  manage(room: Room, enqueue: Enqueue<T>): void;
  run(creep: Creep, task: T): void;
  fitnessFor(creep: Creep, task: T): number;
}

export abstract class BaseManager<T extends Task> {
  public abstract get type(): string;

  public abstract manage(room: Room, enqueue: Enqueue<T>): void;
  public abstract run(creep: Creep, task: T): void;

  public fitnessFor(creep: Creep, _task: T): number {
    if (creep.type.type !== 'worker') {
      return 0;
    }
    return Math.pow(creep.energy / creep.carryCapacity, 2);
  }

  protected doOrMoveOrStop(result: ResultCode, target: TargetPosition, creep: Creep): void {
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(target);
    }
    if (result !== OK && result !== ERR_TIRED) {
      creep.stopTask();
    }
  }
}
