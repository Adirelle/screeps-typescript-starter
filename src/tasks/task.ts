export type TaskType = 'build'|'gather'|'harvest'|'idle'|'refill'|'repair'|'upgrade';

export const TASK_BUILD = 'build';
export const TASK_GATHER = 'gather';
export const TASK_HARVEST = 'harvest';
export const TASK_IDLE = 'idle';
export const TASK_REFILL = 'refill';
export const TASK_REPAIR = 'repair';
export const TASK_UPGRADE = 'upgrade';

export interface Task {
  readonly type: TaskType;
  readonly priority: number;
  readonly pos?: RoomPosition;
  creep?: Creep;

  run(): void;
  creepCompatibility(creep: Creep): number;
  isValidCreep(creep: Creep): boolean;
  isSameAs(other: Task): boolean;
  toString(): string;
}

export abstract class BaseTask implements Task {

  public abstract get type(): TaskType;
  public abstract get priority(): number;
  public abstract get pos(): RoomPosition|undefined;

  constructor(public creep?: Creep) {}

  public isSameAs(other: Task): boolean {
    return this.type === other.type;
  }

  public toString(): string {
    return `${this.type}(${this.priority})`;
  }

  public abstract isValidCreep(creep: Creep): boolean;

  public hasValidCreep(): boolean {
    return this.creep ? this.isValidCreep(this.creep) : false;
  }

  public run(): void {
    if (this.hasValidCreep()) {
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

  protected moveToTarget(): ResultCode {
    return this.pos ? this.creep!.moveTo(this.pos) : ERR_NOT_FOUND;
  }

  protected abstract doCreepCompatibility(creep: Creep): number;
  protected abstract doRun(): ResultCode;
}
