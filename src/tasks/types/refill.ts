import { registerSerializer } from '../../lib/serializer';
import managers from '../registry';
import { TargettedTask, TargettedTaskSerializer } from '../targetted';
import { Enqueue, Manager } from '../task';

const REFILL_TASK = 'refill';

type EnergyStructure = EnergyContainer & Structure;

class RefillTask extends TargettedTask<EnergyStructure> {
  public readonly type = REFILL_TASK;

  public get priority() {
    const f = 1.0 - this.target.energy / this.target.energyCapacity;
    switch (this.target.structureType) {
      case STRUCTURE_SPAWN:
        return 400 + 500 * f;
      default:
        return 500 * f;
    }
  }
}

class RefillTaskManager implements Manager<RefillTask> {
  public readonly type = REFILL_TASK;
  public readonly requiredBodyParts = [CARRY, MOVE];

  public manage(room: Room, enqueue: Enqueue<RefillTask>) {
    _.each(
      room.find<EnergyStructure>(
        FIND_MY_STRUCTURES,
        {filter: (s: EnergyStructure) => (
          s.isActive()
          && s.energyCapacity
          && s.energy < s.energyCapacity
        )}
      ),
      (struct: EnergyStructure) => enqueue(new RefillTask(struct))
    );
  }

  public run(creep: Creep, {target}: RefillTask) {
    if (!creep.energy || target.energy === target.energyCapacity) {
      creep.stopTask();
      return;
    }
    let result = creep.transfer(target, RESOURCE_ENERGY);
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(target);
    }
    if (result !== OK && result !== ERR_TIRED) {
      creep.stopTask();
    }
  }

  public isCompatible(creep: Creep) {
    return creep.energy === creep.carryCapacity;
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
