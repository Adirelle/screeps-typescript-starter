import { log } from '../../lib/logger/log';
import { registerSerializer, Serializer } from '../../lib/serializer';
import managers from '../registry';
import { Enqueue, Manager, Task } from '../task';

const GATHER_TASK = 'gather';

class GatherTask implements Task {
  public readonly type = GATHER_TASK;

  constructor(public readonly target: Creep) {
  }

  public get priority(): number {
    return this.target.payload / this.target.carryCapacity;
  }

  public toString() {
    return `gather(${this.target.name},${this.priority})`;
  }

  public isSameAs(other: any) {
    return other instanceof GatherTask && other.target.id === this.target.id;
  }
}

class GatherTaskManager implements Manager<GatherTask> {
  public readonly type = GATHER_TASK;
  public readonly requiredBodyParts = [CARRY, MOVE];

  public manage(room: Room, enqueue: Enqueue<GatherTask>) {
    _.each(room.creeps, (creep) => {
      if (creep.hasTask('harvest')) {
        log.debug('need gather for', creep.name);
        enqueue(new GatherTask(creep));
      }
    });
  }

  public run(creep: Creep, {target}: GatherTask) {
    let result = target.transfer(creep, RESOURCE_ENERGY);
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(target);
    }
    if (result === ERR_FULL) {
      creep.task = null;
    }
  }

  public isCompatible(creep: Creep) {
    return !creep.hasTask('harvest') && !creep.isFull();
  }
}

interface SerializedGatherTask {
  readonly type: 'gather';
  readonly targetName: string;
}

class GatherTaskSerializer implements Serializer<GatherTask, SerializedGatherTask> {
  public readonly type = GATHER_TASK;

  public serialize({target}: GatherTask): SerializedGatherTask {
    return {type: GATHER_TASK, targetName: target.name};
  }
  public unserialize({targetName}: SerializedGatherTask): GatherTask {
    const target = Game.creeps[targetName];
    if (!target) {
      throw new Error(`Unknown creep ${targetName}`);
    }
    return new GatherTask(target);
  }
}

managers.register(new GatherTaskManager());
registerSerializer(new GatherTaskSerializer());
