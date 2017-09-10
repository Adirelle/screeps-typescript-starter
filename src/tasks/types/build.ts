import { registerSerializer } from '../../lib/serializer';
import managers from '../registry';
import { SerializedTargettedTask, TargettedTask, TargettedTaskSerializer } from '../targetted';
import { BaseManager, Enqueue } from '../task';

const BUILD_TASK = 'build';

class BuildTask extends TargettedTask<ConstructionSite> {
  public readonly type = BUILD_TASK;

  public get priority() {
    const f = this.target.progress / this.target.progressTotal;
    switch (this.target.structureType) {
      case 'road':
        return 150 + 100 * f;
      default:
        return 100 + 100 * f;
    }
  }
}

class BuildTaskManager extends BaseManager<BuildTask> {
  public readonly type = BUILD_TASK;

  public manage(room: Room, enqueue: Enqueue<BuildTask>) {
    const tasks = _.map(
      room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES),
      (site: ConstructionSite) => new BuildTask(site)
    );
    tasks.sort((a, b) => b.priority - a.priority);
    for (const task of tasks.slice(0, 5)) {
      enqueue(task);
    }
  }

  public run(creep: Creep, {target}: BuildTask) {
    this.doOrMoveOrStop(creep.build(target), target, creep);
  }
}

class BuildTaskSerializer extends TargettedTaskSerializer<ConstructionSite> {
  public readonly type = BUILD_TASK;

  protected buildTask(target: ConstructionSite, _u: SerializedTargettedTask): TargettedTask<ConstructionSite> {
    return new BuildTask(target);
  }
}

managers.register(new BuildTaskManager());
registerSerializer(new BuildTaskSerializer());
