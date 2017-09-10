import { registerSerializer } from '../../lib/serializer';
import managers from '../registry';
import { SerializedTargettedTask, TargettedTask, TargettedTaskSerializer } from '../targetted';
import { BaseManager, Enqueue } from '../task';

const GATHER_TASK = 'gather';

class GatherTask extends TargettedTask<Creep> {
  public readonly type = GATHER_TASK;

  public get priority() {
    return 100.0 * this.target.energy / this.target.carryCapacity;
  }
}

class GatherTaskManager extends BaseManager<GatherTask> {
  public readonly type = GATHER_TASK;

  public manage(room: Room, enqueue: Enqueue<GatherTask>) {
    _.each(room.myCreeps, (creep) => {
      if (creep.energy > 0 && creep.isTask('harvest')) {
        enqueue(new GatherTask(creep));
      }
    });
  }

  public run(creep: Creep, { target }: GatherTask) {
    if (creep.isFull() || target.isEmpty() || !target.isTask('harvest')) {
      creep.stopTask();
      return;
    }
    this.doOrMoveOrStop(target.transfer(creep, RESOURCE_ENERGY), target, creep);
  }

  public fitnessFor(creep: Creep, task: GatherTask) {
    if (task.target.id === creep.id) {
      return 0;
    }
    return (creep.type.type === 'mule' ? 1.0 : 0.7) * (1.0 - Math.pow(creep.payload / creep.carryCapacity, 2));
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
