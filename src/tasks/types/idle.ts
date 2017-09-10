import { registerSerializer, Serializer } from '../../lib/serializer';
import managers from '../registry';
import { Enqueue, Manager, Task } from '../task';

const IDLE_TASK = 'idle';

class IdleTask implements Task {
  public readonly type = IDLE_TASK;
  public readonly priority = -1e6;
  public readonly pos = new RoomPosition(0, 0, 'neverland');
  public toString() { return IDLE_TASK; }
  public isSameAs(other: any) { return other instanceof IdleTask; }
}

class IdleTaskManager implements Manager<IdleTask> {
  public readonly type = IDLE_TASK;
  public readonly requiredBodyParts = [];

  public manage(_room: Room, _enqueue: Enqueue<IdleTask>) {
    // NOOP
  }

  public run(_creep: Creep, _task: IdleTask) {
    // NOOP
  }

  public isCompatible(_creep: Creep) {
    return true;
  }
}

interface SerializedIdleTask {readonly type: 'idle'; }
export const idleSingleton = new IdleTask();
const serializedSingleton: SerializedIdleTask = {type: 'idle'};

class IdleTaskSerializer implements Serializer<IdleTask, SerializedIdleTask> {
  public readonly type = IDLE_TASK;

  public serialize(_u: IdleTask): SerializedIdleTask {
    return serializedSingleton;
  }
  public unserialize(_s: SerializedIdleTask): IdleTask {
    return idleSingleton;
  }
}

managers.register(new IdleTaskManager());
registerSerializer(new IdleTaskSerializer());
