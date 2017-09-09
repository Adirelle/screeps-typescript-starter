import { registerSerializer, Serializer } from '../lib/serializer';
import managers from './registry';
import { Enqueue, Manager, Task } from './task';

const IDLE_TASK = 'harvest';

class IdleTask implements Task {
  public readonly type = IDLE_TASK;
  public readonly priority = -1e6;
  public toString() { return 'idle'; }
}

class IdleTaskManager implements Manager {
  public readonly type = IDLE_TASK;
  public readonly requiredBodyParts = [];

  public manage(_room: Room, _enqueue: Enqueue) {
    // NOOP
  }

  public run(_creep: Creep) {
    // NOOP
  }

  public isCompatible(_creep: Creep) {
    return true;
  }
}

interface SerializedIdleTask {readonly type: 'idle'; }
const singleton = new IdleTask();
const serializedSingleton: SerializedIdleTask = {type: 'idle'};

class IdleTaskSerializer implements Serializer<IdleTask, SerializedIdleTask> {
  public readonly type = IDLE_TASK;

  public serialize(_u: IdleTask): SerializedIdleTask {
    return serializedSingleton;
  }
  public unserialize(_s: SerializedIdleTask): IdleTask {
    return singleton;
  }
}

managers.register(new IdleTaskManager());
registerSerializer(new IdleTaskSerializer());
