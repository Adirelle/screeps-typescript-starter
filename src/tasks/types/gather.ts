import { registerSerializer } from '../../lib/serializer';
import managers from '../registry';
import { SerializedTargettedTask, TargettedTask, TargettedTaskSerializer } from '../targetted';
import { Enqueue, Manager } from '../task';

const GATHER_TASK = 'gather';

class GatherTask extends TargettedTask<Creep> {
  public readonly type = GATHER_TASK;

  public get priority() {
    return 100.0 * this.target.energy / this.target.carryCapacity;
  }
}

class GatherTaskManager implements Manager<GatherTask> {
  public readonly type = GATHER_TASK;
  public readonly requiredBodyParts = [CARRY, MOVE];

  public manage(room: Room, enqueue: Enqueue<GatherTask>) {
    _.each(room.myCreeps, (creep) => {
      if (creep.hasTask('harvest') || creep.hasTask('idle')) {
        enqueue(new GatherTask(creep));
      }
    });
  }

  public run(creep: Creep, {target}: GatherTask) {
    if (creep.isFull() || !target.energy) {
      creep.stopTask();
      return;
    }
    let result = target.transfer(creep, RESOURCE_ENERGY);
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(target);
    }
    if (result !== OK && result === ERR_FULL) {
      creep.stopTask();
    }
  }

  public isCompatible(creep: Creep) {
    return creep.energy === 0;
  }
}

class GatherTaskSerializer extends TargettedTaskSerializer<Creep> {
  public readonly type = GATHER_TASK;

  protected buildTask(target: Creep, _u: SerializedTargettedTask): TargettedTask<Creep> {
    return new GatherTask(target);
  }
}

managers.register(new GatherTaskManager());
registerSerializer(new GatherTaskSerializer());
