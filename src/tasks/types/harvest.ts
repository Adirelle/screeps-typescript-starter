import { TargettedTask } from '../targetted';
import { getObjectByIdOrDie, Task, TASK_HARVEST } from '../task';

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

  public isSameAs(other: Task): boolean {
    return (other instanceof HarvestTask
      && other.target.source.id === this.target.source.id
      && other.target.pos.x === this.target.pos.x
      && other.target.pos.y === this.target.pos.y
    );
  }

  public toString(): string {
    try {
      return `${this.type}(${this.target.source},${this.target.pos},${this.priority})`;
    } catch (ex) {
      return JSON.stringify(this);
    }
  }

  public isValidTarget(_target: HarvestSpot): boolean {
    return true;
  }

  public isValidCreep(creep: Creep): boolean {
    return creep.type.type === 'worker' && !creep.isFull();
  }

  protected doCreepCompatibility(creep: Creep): number {
    return 1.0 - Math.pow(creep.energy / creep.energyCapacity, 2);
  }

  protected doRun(): ResultCode {
    return this.creep!.harvest(this.target.source);
  }

  protected targetToJSON({source, pos: {x, y}}: HarvestSpot) {
    return {source: source.id, x, y};
  }

  protected targetFromJSON({source, x, y}: any) {
    const sourceObj = getObjectByIdOrDie<Source>(source);
    return {source: sourceObj, pos: new RoomPosition(x, y, sourceObj.room.name)};
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
