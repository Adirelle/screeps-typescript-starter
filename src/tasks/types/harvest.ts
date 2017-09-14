import { TargettedTask } from '../targetted';
import { TASK_HARVEST } from '../task';

interface HarvestSpot {
  id: string;
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


  public readonly priority = 1000;

  public isValidTarget(_target: HarvestSpot): boolean {
    return true;
  }

  public isValidCreep(creep: Creep): boolean {
    return creep.type.type === 'worker' && !creep.isFull();
  }

  protected doCreepCompatibility(creep: Creep): number {
    return 1.0 - Math.pow(creep.energy / creep.carryCapacity, 2);
  }

  protected doRun(): ResultCode {
    return this.creep!.harvest(this.target.source);
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
            spots.push({id: `${source.id}-${x}-${y}`, source, pos: new RoomPosition(x, y, room.name)});
          }
        }
      );
    });
  return spots;
}
