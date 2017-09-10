import { registerSerializer } from '../../lib/serializer';
import managers from '../registry';
import { SerializedTargettedTask, TargettedTask, TargettedTaskSerializer } from '../targetted';
import { BaseManager, Enqueue } from '../task';

const REPAIR_TASK = 'repair';

type Repairable = Structure & HitPoints;

class RepairTask extends TargettedTask<Repairable> {
  public readonly type = REPAIR_TASK;

  public get priority() {
    const f = this.target.hits / this.target.hitsMax;
    return 400 - 100 * f;
  }
}

class RepairTaskManager extends BaseManager<RepairTask> {
  public readonly type = REPAIR_TASK;

  public manage(room: Room, enqueue: Enqueue<RepairTask>) {
    const tasks = _.map(
      _.filter(
        room.myActiveStructures,
        (r: Structure) => r.hitsMax && r.hits < 0.95 * r.hitsMax
      ),
      (r: Repairable) => new RepairTask(r)
    );
    tasks.sort((a, b) => b.priority - a.priority);
    for (const task of tasks.slice(0, 5)) {
      enqueue(task);
    }
  }

  public run(creep: Creep, {target}: RepairTask) {
    this.doOrMoveOrStop(creep.repair(target), target, creep);
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
