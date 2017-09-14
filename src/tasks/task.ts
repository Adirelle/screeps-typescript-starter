export type TaskType = 'build'|'gather'|'harvest'|'idle'|'refill'|'repair'|'upgrade'|'pickup'|'heal';

export const TASK_BUILD: TaskType = 'build';
export const TASK_GATHER: TaskType = 'gather';
export const TASK_HARVEST: TaskType = 'harvest';
export const TASK_IDLE: TaskType = 'idle';
export const TASK_REFILL: TaskType = 'refill';
export const TASK_REPAIR: TaskType = 'repair';
export const TASK_UPGRADE: TaskType = 'upgrade';
export const TASK_PICKUP: TaskType = 'pickup';
export const TASK_HEAL: TaskType = 'heal';

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

export const ErrorMessages: { [code: number]: string } = {
  [OK]: 'ok',
  [ERR_NOT_OWNER]: 'not owner',
  [ERR_NO_PATH]: 'no path',
  [ERR_NAME_EXISTS]: 'name exists',
  [ERR_BUSY]: 'busy',
  [ERR_NOT_FOUND]: 'not found',
  [ERR_NOT_ENOUGH_ENERGY]: 'not enough energy/resources/extensions',
  [ERR_INVALID_TARGET]: 'invalid target',
  [ERR_FULL]: 'full',
  [ERR_NOT_IN_RANGE]: 'not in range',
  [ERR_INVALID_ARGS]: 'invalid args',
  [ERR_TIRED]: 'tired',
  [ERR_NO_BODYPART]: 'missing required bodypart',
  [ERR_RCL_NOT_ENOUGH]: 'RCL too low',
  [ERR_GCL_NOT_ENOUGH]: 'GCL too low'
};

export abstract class BaseTask implements Task {

  public abstract get type(): TaskType;
  public abstract get priority(): number;
  public abstract get pos(): RoomPosition|undefined;

  constructor(public creep?: Creep) {}

  public isSameAs(other: Task): boolean {
    return this.type === other.type && this.pos === other.pos;
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
      this.creep.stopTask(`action failed (${ErrorMessages[result]})`);
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
    if (!this.pos) {
      return ERR_NOT_FOUND;
    }
    const creep = this.creep!;
    return creep.moveTo(
      this.pos,
      { visualizePathStyle: { stroke: creep.color, strokeWidth: 0.05, lineStyle: 'dotted', opacity: 0.95 } }
    );
  }

  protected abstract doCreepCompatibility(creep: Creep): number;
  protected abstract doRun(): ResultCode;
}

export function getObjectByIdOrDie<T>(id: string): T {
  const object = Game.getObjectById<T>(id);
  if (object === null) {
    throw new Error(`Could not found game object #${id}`);
  }
  return object;
}
