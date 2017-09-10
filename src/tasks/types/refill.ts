import { registerSerializer } from '../../lib/serializer';
import managers from '../registry';
import { TargettedTask, TargettedTaskSerializer } from '../targetted';
import { BaseManager, Enqueue } from '../task';

const REFILL_TASK = 'refill';

type EnergyStructure = EnergyContainer & Structure;

class RefillTask extends TargettedTask<EnergyStructure> {
  public readonly type = REFILL_TASK;

  public get priority() {
    switch (this.target.structureType) {
      case STRUCTURE_SPAWN:
      case STRUCTURE_EXTENSION:
        return 1000 - 20 * this.target.room.myCreeps.length;
      default:
        return this.target.energyCapacity - this.target.energy;
    }
  }
}

class RefillTaskManager extends BaseManager<RefillTask> {
  public readonly type = REFILL_TASK;

  public manage(room: Room, enqueue: Enqueue<RefillTask>) {
    _.each(
      _.filter(
        room.myActiveStructures,
        (s: EnergyStructure) => s.energyCapacity && s.energy < s.energyCapacity
      ),
      (struct: EnergyStructure) => enqueue(new RefillTask(struct))
    );
  }

  public run(creep: Creep, {target}: RefillTask) {
    if (creep.isEmpty() || target.energy === target.energyCapacity) {
      creep.stopTask();
      return;
    }
    this.doOrMoveOrStop(creep.transfer(target, RESOURCE_ENERGY), target, creep);
  }

  public fitnessFor(creep: Creep, _task: RefillTask) {
    return (creep.type.type === 'mule' ? 1.0 : 0.7) * Math.pow(creep.energy / creep.carryCapacity, 2);
  }
}

class RefillTaskSerializer extends TargettedTaskSerializer<EnergyStructure> {
  public readonly type = REFILL_TASK;

  protected buildTask(target: EnergyStructure, _u: any) {
    return new RefillTask(target);
  }
}

managers.register(new RefillTaskManager());
registerSerializer(new RefillTaskSerializer());
