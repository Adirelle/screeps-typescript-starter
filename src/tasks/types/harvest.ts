import { log } from '../../lib/logger/log';
import { registerSerializer, Serializer } from '../../lib/serializer';
import managers from '../registry';
import { Enqueue, Manager, Task } from '../task';

const HARVEST_TASK = 'harvest';

class HarvestTask implements Task {
  public readonly type = HARVEST_TASK;
  public readonly priority = 1000;

  constructor(public source: Source, public pos: RoomPosition) {
  }

  public toString() {
    return `harvest(${this.source.id},${this.pos})`;
  }

  public isSameAs(other: any): boolean {
    return (other instanceof HarvestTask) &&
      other.source.id === this.source.id &&
      other.pos.x === this.pos.x &&
      other.pos.y === this.pos.y;
  }
}

class HarvestTaskManager implements Manager<HarvestTask> {
  public readonly type = HARVEST_TASK;
  public readonly requiredBodyParts = [WORK, CARRY, MOVE];

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
    let result = creep.harvest(source);
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(pos);
    }
    if (result !== OK && result !== ERR_TIRED) {
      creep.stopTask();
    }
  }

  public isCompatible(creep: Creep) {
    return creep.isEmpty();
  }

  private findSourceSlots(
    room: Room
  ): Array<{ sourceId: string; x: number; y: number }> {
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
