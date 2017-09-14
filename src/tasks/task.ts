export type TaskType = 'build'|'gather'|'harvest'|'idle'|'refill'|'repair'|'upgrade';

export const TASK_BUILD: TaskType = 'build';
export const TASK_GATHER: TaskType = 'gather';
export const TASK_HARVEST: TaskType = 'harvest';
export const TASK_IDLE: TaskType = 'idle';
export const TASK_REFILL: TaskType = 'refill';
export const TASK_REPAIR: TaskType = 'repair';
export const TASK_UPGRADE: TaskType = 'upgrade';

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

  toJSON(): any;
  fromJSON(data: any): void;
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
    try {
      return `${this.type}(${this.priority})`;
    } catch (ex) {
      return JSON.stringify(this);
    }
  }

  public hasValidCreep(): boolean {
    return this.creep ? this.isValidCreep(this.creep) : false;
  }

  public run(): void {
    if (!this.creep) {
      log.warning(`${this} has no creep !`);
      return;
    }
    if (!this.hasValidCreep()) {
      this.creep.stopTask('does not fit the requirements anymore');
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
      this.creep.stopTask(`action failed (${result})`);
    }
  }

  public creepCompatibility(creep: Creep): number {
    if (!this.isValidCreep(creep)) {
      return 0;
    }
    return this.doCreepCompatibility(creep);
  }

  public toJSON(): any {
    return { type: this.type };
  }

  public fromJSON(_x: any): void {
    /* NOOP */
  }

  public abstract isValidCreep(creep: Creep): boolean;

  protected moveToTarget(): ResultCode {
    return this.pos ? this.creep!.moveTo(this.pos) : ERR_NOT_FOUND;
  }

  protected abstract doCreepCompatibility(creep: Creep): number;
  protected abstract doRun(): ResultCode;
}
