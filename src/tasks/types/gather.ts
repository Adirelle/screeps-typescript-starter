import { TargettedTask } from '../targetted';
import { TASK_GATHER, TASK_HARVEST } from '../task';

function isValidTarget(target: Creep) {
  return target.energy > 0 && target.isTask(TASK_HARVEST);
}

export class GatherTask extends TargettedTask<Creep> {

  public static plan(room: Room): GatherTask[] {
    return _.map(
      _.filter(room.myCreeps, (c) => isValidTarget(c)),
      (c) => new GatherTask(c)
    );
  }

  public readonly type = TASK_GATHER;

  public isValidTarget(target: Creep) {
    return isValidTarget(target);
  }

  public isValidCreep(creep: Creep) {
    return !creep.isFull() && !creep.isTask(TASK_HARVEST);
  }

  public get priority() {
    return 100.0 * this.target.energy / this.target.carryCapacity;
  }

  protected doRun() {
    return this.target.transfer(this.creep!, RESOURCE_ENERGY);
  }

  protected doCreepCompatibility(creep: Creep) {
    return (creep.type.type === 'mule' ? 1.0 : 0.7) *  (1.0 - Math.pow(creep.payload / creep.carryCapacity, 2));
  }
}
