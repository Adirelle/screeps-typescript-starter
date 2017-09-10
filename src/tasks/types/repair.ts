import { registerSerializer } from '../../lib/serializer';
import managers from '../registry';
import { SerializedTargettedTask, TargettedTask, TargettedTaskSerializer } from '../targetted';
import { Enqueue, Manager } from '../task';

const REPAIR_TASK = 'repair';

type Repairable = Structure & HitPoints;

class RepairTask extends TargettedTask<Repairable> {
  public readonly type = REPAIR_TASK;

  public get priority() {
    const f = this.target.hits / this.target.hitsMax;
    return 400 - 100 * f;
  }
}

class RepairTaskManager implements Manager<RepairTask> {
  public readonly type = REPAIR_TASK;
  public readonly requiredBodyParts = [WORK, CARRY, MOVE];

  public manage(room: Room, enqueue: Enqueue<RepairTask>) {
    const tasks = _.map(
      room.find<Repairable>(
        FIND_MY_STRUCTURES,
        {filter: (r: Structure) => (
          r.isActive()
          && r.hitsMax
          && r.hits < 0.95 * r.hitsMax
        )}
      ),
      (r: Repairable) => new RepairTask(r)
    );
    tasks.sort((a, b) => b.priority - a.priority);
    for (const task of tasks.slice(0, 5)) {
      enqueue(task);
    }
  }

  public run(creep: Creep, {target}: RepairTask) {
    if (!creep.energy) {
      creep.stopTask();
      return;
    }
    let result = creep.repair(target);
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(target);
    }
    if (result !== OK && result !== ERR_TIRED) {
      creep.stopTask();
    }
  }

  public isCompatible(creep: Creep) {
    return creep.energy > 0;
  }
}

class RepairTaskSerializer extends TargettedTaskSerializer<Repairable> {
  public readonly type = REPAIR_TASK;

  protected buildTask(target: Repairable, _u: SerializedTargettedTask): TargettedTask<Repairable> {
    return new RepairTask(target);
  }
}

managers.register(new RepairTaskManager());
registerSerializer(new RepairTaskSerializer());
