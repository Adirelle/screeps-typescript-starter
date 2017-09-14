import { Task, TASK_IDLE } from '../task';

class IdleTask implements Task {
  public readonly type = TASK_IDLE;
  public readonly priority = -1e6;

  public get creep(): Creep|undefined {
    return undefined;
  }

  public set creep(_creep: Creep|undefined) {
    /* NOOP */
  }

  public toString() {
    return TASK_IDLE;
  }

  public isSameAs(other: Task) {
    return other.type === TASK_IDLE;
  }

  public run() {
    /* NOOP */
  }

  public creepCompatibility(_creep: Creep) {
    return 0;
  }

  public isValidCreep(_creep: Creep) {
    return false;
  }

  public toJSON() {
    return undefined;
  }

  public fromJSON(_x: any): void {
    /* NOOP */
  }
}

export const idleSingleton = new IdleTask();
