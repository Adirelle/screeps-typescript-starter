import { BaseRole, CreepFactory, CreepPopulation, CreepRole } from './role';

export const factory: CreepFactory = new class {
  public name = 'harvester';
  public  bodyTemplate = [MOVE, WORK, CARRY];

  public create(creep: Creep): CreepRole {
    return new Harvester(creep);
  }

  public targetPopulation(room: Room, _pop: CreepPopulation): number {
    if (!room.memory.sourceSpots) {
      room.memory.sourceSpots = getSourceSpots(room);
    }
    return room.memory.sourceSpots || 1;
  }
}();

export class Harvester extends BaseRole {
  public run(): void {
    const creep = this.creep;

    if ((creep.carry.energy || 0) >= creep.carryCapacity) {
      return;
    }

    const mem = creep.memory;
    let target = mem.target && Game.getObjectById<Source>(mem.target);

    if (!target) {
      target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    }
    if (target === null) {
      return;
    }

    let result = creep.harvest(target);
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(target);
    }
    mem.target = result === OK ? target.id : undefined;
  }
}

function getSourceSpots(room: Room): number {
  let count = 0;
  _.each(room.find<Source>(FIND_SOURCES), (s: Source) => {
    const terrains = room.lookForAtArea(
      LOOK_TERRAIN,
      s.pos.y - 1,
      s.pos.x - 1,
      s.pos.y + 1,
      s.pos.x + 1,
      true
    );
    _.each(terrains, (t: LookAtResult) => {
      if (t.terrain === 'swamp' || t.terrain === 'plain') {
        count++;
      }
    });
  });
  return count;
}
