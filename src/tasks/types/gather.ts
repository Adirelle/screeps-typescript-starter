import { TargettedTask } from '../targetted';
import { TaskType } from '../task';

export class GatherTask extends TargettedTask<Creep> {
  public readonly type = TaskType.GATHER;

  public get priority() {
    return 100.0 * this.target.energy / this.target.carryCapacity;
  }

  public isValidCreep(creep: Creep) {
    return !creep.isFull() && !creep.isTask(TaskType.HARVEST);
  }

  public isValidTarget(target: Creep) {
    return target !== this.creep && target.energy > 0;
  }

  protected doRun() {
    return this.target.transfer(this.creep!, RESOURCE_ENERGY);
  }

  protected doCreepCompatibility(creep: Creep) {
    return (creep.type.type === 'mule' ? 1.0 : 0.7) *  (1.0 - Math.pow(creep.payload / creep.carryCapacity, 2));
  }
}

const singleton = new GatherTask();

export function planGathers(room: Room): GatherTask[] {
  return _.map(
    _.filter(room.myCreeps, (t) => singleton.isValidTarget(t)),
    (t) => new GatherTask(undefined, t)
  );
}
