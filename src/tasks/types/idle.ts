import { Task, TaskType } from '../task';

const nullPos = new RoomPosition(NaN, NaN, 'neverland');

class IdleTask implements Task {
  public readonly type = TaskType.IDLE;
  public readonly priority = -1e6;

  public get creep(): Creep|undefined {
    return undefined;
  }

  public set creep(_creep: Creep|undefined) {
    /* NOOP */
  }

  public toString() {
    return TaskType.IDLE;
  }

  public isSameAs(other: Task) {
    return other.type === TaskType.IDLE;
  }

  public run() {
    /* NOOP */
  }

  public getPos() {
    return nullPos;
  }

  public creepCompatibility(_creep: Creep) {
    return 0;
  }

  public isValidCreep(_creep: Creep) {
    return false;
  }
}

export const idleSingleton = new IdleTask();
