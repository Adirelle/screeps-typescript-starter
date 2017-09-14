import { TargettedTask } from '../targetted';
import { TASK_HARVEST } from '../task';

interface HarvestSpot {
  pos: RoomPosition;
  source: Source;
}

export class HarvestTask extends TargettedTask<HarvestSpot> {

  public static plan(room: Room): HarvestTask[] {
    return _.map(findHarvestSpots(room), (s) => new HarvestTask(s));
  }

  public get type() {
    return TASK_HARVEST;
  }

  public get priority() {
    return Math.min(300, 600 * this.target.source.energy / this.target.source.energyCapacity);
  }


  public isValidTarget(_target: HarvestSpot): boolean {
    return true;
  }

  public isValidCreep(creep: Creep): boolean {
    return creep.type.type === 'worker' && !creep.isFull();
  }

  public toJSON() {
    return {
      sourceId: this.target.source.id,
      type: this.type,
      x: this.target.pos.x,
      y: this.target.pos.y
    };
  }

  public fromJSON({sourceId, x, y}: any) {
    const source = Game.getObjectById<Source>(sourceId)!;
    this.target = {
      pos: new RoomPosition(x, y, source.room.name),
      source
    };
  }
  protected doCreepCompatibility(creep: Creep): number {
    return 1.0 - Math.pow(creep.energy / creep.carryCapacity, 2);
  }

  protected doRun(): ResultCode {
    return this.creep!.harvest(this.target.source);
  }

  protected targetToJSON({source, pos: {x, y}}: HarvestSpot) {
    return {source: source.id, x, y};
  }

  protected targetFromJSON({source, x, y}: any) {
    const sourceObj = Game.getObjectByIdOrDie<Source>(source);
    return {source: sourceObj, pos: new RoomPosition(x, y, source.room.name)};
  }
}

const findHarvestSpots = _.memoize(_findHarvestSpots, (room: Room) => room.name);

function _findHarvestSpots(room: Room): HarvestSpot[] {
  const spots: HarvestSpot[] = [];
  _.each(
    room.find<Source>(FIND_SOURCES_ACTIVE),
    (source) => {
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
            spots.push({source, pos: new RoomPosition(x, y, room.name)});
          }
        }
      );
    });
  return spots;
}
