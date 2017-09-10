import { log } from '../../lib/logger/log';
import { registerSerializer, Serializer } from '../../lib/serializer';
import managers from '../registry';
import { BaseManager, BaseTask, Enqueue } from '../task';

const HARVEST_TASK = 'harvest';

class HarvestTask extends BaseTask {
  public readonly type = HARVEST_TASK;
  public readonly priority = 1000;

  constructor(public source: Source, public pos: RoomPosition) {
    super();
  }

  public toString() {
    return `harvest(${this.source.id},${this.pos})`;
  }
}

class HarvestTaskManager extends BaseManager<HarvestTask> {
  public readonly type = HARVEST_TASK;

  public manage(room: Room, enqueue: Enqueue<HarvestTask>) {
    const slots = this.findSourceSlots(room);
    _.each(slots, ({ x, y, sourceId }) => {
      const source = Game.getObjectById<Source>(sourceId) as Source;
      const pos = new RoomPosition(x, y, room.name);
      enqueue(new HarvestTask(source, pos));
    });
  }

  public run(creep: Creep, {source, pos}: HarvestTask) {
    if (creep.isFull()) {
      creep.stopTask();
      return;
    }
    this.doOrMoveOrStop(creep.harvest(source), pos, creep);
  }

  public fitnessFor(creep: Creep, _task: HarvestTask) {
    if (creep.type.type !== 'worker') {
      return 0;
    }
    return 1.0 - Math.pow(creep.payload / creep.carryCapacity, 2);
  }

  private findSourceSlots(room: Room): Array<{ sourceId: string; x: number; y: number }> {
    if (room.memory.sourceSlots) {
      return room.memory.sourceSlots;
    }
    const sources = room.find<Source>(FIND_SOURCES_ACTIVE);
    room.memory.sourceSlots = [];
    _.each(sources, (source) => {
      _.each(
        room.lookForAtArea(
          LOOK_TERRAIN,
          source.pos.y - 1,
          source.pos.x - 1,
          source.pos.y + 1,
          source.pos.x + 1,
          true
        ),
        ({ x, y, terrain }: LookAtResultWithPos) => {
          if (terrain === 'swamp' || terrain === 'plain') {
            log.debug(`Source slot: ${source.id}, ${x}, ${y}`);
            room.memory.sourceSlots.push({ sourceId: source.id, x, y });
          }
        }
      );
    });
    return room.memory.sourceSlots;
  }
}

interface SerializedHarvestTask {
  type: string;
  sourceId: string;
  x: number;
  y: number;
}

class HarvestSerializer
  implements Serializer<HarvestTask, SerializedHarvestTask> {
  public readonly type = HARVEST_TASK;

  public serialize({ source, pos: { x, y } }: HarvestTask) {
    return {
      priority: 0,
      sourceId: source.id,
      type: HARVEST_TASK,
      x,
      y
    } as SerializedHarvestTask;
  }

  public unserialize({ sourceId, x, y }: SerializedHarvestTask) {
    const source = Game.getObjectById<Source>(sourceId);
    if (!source) {
      throw new Error(`Unknown source ${sourceId}`);
    }
    return new HarvestTask(source, new RoomPosition(x, y, source.room.name));
  }
}

registerSerializer(new HarvestSerializer());
managers.register(new HarvestTaskManager());
