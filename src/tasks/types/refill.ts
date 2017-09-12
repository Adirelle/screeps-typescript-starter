import { TargettedTask } from '../targetted';
import { TASK_REFILL } from '../task';

type EnergyStructure = EnergyContainer & Structure;

function isValidTarget(target: EnergyStructure) {
  return target.energyCapacity ? target.energy < target.energyCapacity : false;
}

export class RefillTask extends TargettedTask<EnergyStructure> {

  public static plan(room: Room) {
    return _.map(
      _.filter(room.myActiveStructures, isValidTarget),
      (s: EnergyStructure) => new RefillTask(s)
    );
  }

  public readonly type = TASK_REFILL;

  public get priority() {
    switch (this.target.structureType) {
      case STRUCTURE_SPAWN:
      case STRUCTURE_EXTENSION:
        return 1000 - 20 * this.target.room.myCreeps.length;
      default:
        return this.target.energyCapacity - this.target.energy;
    }
  }

  public isValidCreep(creep: Creep) {
    return !creep.isEmpty();
  }

  public isValidTarget(target: EnergyStructure) {
    return isValidTarget(target);
  }

  public doRun() {
    return this.creep!.transfer(this.target, RESOURCE_ENERGY);
  }

  public doCreepCompatibility(creep: Creep) {
    return (creep.type.type === 'mule' ? 1.0 : 0.7) * Math.pow(creep.energy / creep.carryCapacity, 2);
  }
}
