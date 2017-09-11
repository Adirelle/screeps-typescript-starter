
export const enum TaskType {
  BUILD = 'build',
  GATHER = 'gather',
  HARVEST = 'harvest',
  IDLE = 'idle',
  REFILL = 'refill',
  REPAIR = 'repair',
  UPGRADE = 'upgrade'
}

export interface Task {
  readonly type: TaskType;
  readonly priority: number;
  creep?: Creep;

  run(): void;
  getPos(): RoomPosition;
  creepCompatibility(creep: Creep): number;
  isValidCreep(creep: Creep): boolean;
  isSameAs(other: Task): boolean;
  toString(): string;
}

export abstract class BaseTask implements Task {
  protected memory: { [key: string]: any } = {};

  private _creep?: Creep;

  public abstract get type(): TaskType;
  public abstract get priority(): number;

  public get creep(): Creep|undefined {
    return this._creep;
  }

  public set creep(creep: Creep|undefined) {
    const prev = this._creep;
    if (creep === prev) {
      return;
    }
    this._creep = creep;
    if (prev) {
      delete prev.task;
    }
    if (creep) {
      if (!creep.memory.task) {
        creep.memory.task = this.memory;
      } else {
        this.memory = creep.memory.task = _.assign({}, this.memory);
      }
      this.memory.type = this.type;
      creep.task = this;
    } else {
      this.memory = _.assign({}, this.memory);
    }
  }

  constructor(creep?: Creep) {
    this.creep = creep;
  }

  public abstract getPos(): RoomPosition;

  public isSameAs(other: Task): boolean {
    return (other.type === this.type
      && other.priority === this.priority
      && other.creep === this.creep);
  }

  public run(): void {
    if (!this.creep || !this.isValidCreep(this.creep)) {
      return;
    }
    let result = this.doRun();
    if (result === ERR_NOT_IN_RANGE) {
      result = this.moveToTarget();
      if (result === ERR_TIRED) {
        return;
      }
    }
    if (result !== OK) {
      delete this.creep;
    }
  }

  public creepCompatibility(creep: Creep): number {
    if (!this.isValidCreep(creep)) {
      return 0;
    }
    return this.doCreepCompatibility(creep);
  }

  public toString(): string {
    return `${this.type}(${this.getPos()},${this.priority})`;
  }

  public abstract isValidCreep(creep: Creep): boolean;

  protected abstract doCreepCompatibility(creep: Creep): number;
  protected abstract doRun(): ResultCode;

  protected moveToTarget(): ResultCode {
    return this.creep!.moveTo(this.getPos());
  }
}

export type Planner = (room: Room) => Task[];
