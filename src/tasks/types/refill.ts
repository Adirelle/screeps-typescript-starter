import { TargettedTask } from '../targetted';
import { getObjectByIdOrDie, TASK_BUILD, TASK_REFILL, TASK_REPAIR, TASK_UPGRADE } from '../task';
import { StructurePriority } from './build';

type RefillTarget = (EnergyContainer & Structure) | Creep;

const constructiveTasks = {
  [TASK_BUILD]: true,
  [TASK_REPAIR]: true,
  [TASK_UPGRADE]: true
};

function isValidTarget(target: RefillTarget) {
  if (target instanceof Creep) {
    return !target.isFull() && constructiveTasks[target.task.type];
  }
  return target.energyCapacity ? target.energy < target.energyCapacity : false;
}

export class RefillTask extends TargettedTask<RefillTarget> {
  public static plan(room: Room) {
    return _.map(
      _.filter(
        _.flatten([room.myActiveStructures, room.myCreeps] as RefillTarget[][]),
        isValidTarget
      ),
      (s: RefillTarget) => new RefillTask(s)
    );
  }

  public get type() {
    return TASK_REFILL;
  }

  public get priority() {
    if (this.target instanceof Creep) {
      return this.target.task.priority * 1.1;
    }
    return 150 + (StructurePriority[this.target.structureType] || 100);
  }

  public isValidCreep(creep: Creep) {
    return !creep.isEmpty();
  }

  public isValidTarget(target: RefillTarget) {
    return isValidTarget(target);
  }

  public doRun() {
    return this.creep!.transfer(this.target, RESOURCE_ENERGY);
  }

  public doCreepCompatibility(creep: Creep) {
    return (
      (creep.type.type === 'mule' ? 1.0 : 0.7) *
      Math.pow(creep.energy / creep.carryCapacity, 2)
    );
  }

  protected targetToJSON(target: RefillTarget) {
    return target.id;
  }

  protected targetFromJSON(id: any) {
    return getObjectByIdOrDie<RefillTarget>(id);
  }
}
