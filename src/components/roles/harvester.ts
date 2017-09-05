
export class Harvester {
  public name = 'harvester';
  public bodyTemplate = [MOVE, WORK, CARRY];

  public targetPopoultation(room: Room): number {
    if (!room.memory.sourceSpots) {
      room.memory.sourceSpots = getSourceSpots(room);
    }
    return room.memory.sourceSpots || 1;
  }

  public run(creep: Creep): void {
    if ((creep.carry[RESOURCE_ENERGY] || 0) >= creep.carryCapacity) {
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
    mem.target = (result === OK) ? target.id : undefined;
  }
}

function getSourceSpots(room: Room): number {
  let count = 0;
  _.each(room.find<Source>(FIND_SOURCES), (s: Source) => {
      const terrains = room.lookForAtArea(LOOK_TERRAIN, s.pos.y - 1, s.pos.x - 1, s.pos.y + 1, s.pos.x + 1, true);
      _.each(terrains, t => {
          if (t.terrain === 'swamp' || t.terrain === 'plain') {
              count++;
          }
      });
  });
  return count;
}
