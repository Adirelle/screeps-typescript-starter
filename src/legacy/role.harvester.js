module.exports = {
  name: 'harvester',

  bodyTemplate: [MOVE, WORK, CARRY],

  /** @param Room room */
  targetPopulation: function(room) {
      if (!room.memory.sourceSpots) {
          room.memory.sourceSpots = getSourceSpots(room);
      }
      return room.memory.sourceSpots || 1;
  },

  /**
   * @param {Creep] creep
   */
  run: function(creep) {
      if (creep.carry[RESOURCE_ENERGY] >= creep.carryCapacity) {
          return;
      }

      const mem = creep.memory;
      let target = mem.target && Game.getObjectById(mem.target);

      if (!target) {
          target = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
      }

      let result = creep.harvest(target);
      if (result == ERR_NOT_IN_RANGE) {
          result = creep.moveTo(target);
      }
      mem.target = (result == OK) ? target.id : undefined;
  },
};

function getSourceSpots(room) {
  let count = 0;
  _.each(room.find(FIND_SOURCES), s => {
      const terrains = room.lookForAtArea(LOOK_TERRAIN, s.pos.y - 1, s.pos.x - 1, s.pos.y + 1, s.pos.x + 1, true);
      _.each(terrains, t => {
          if (t.terrain == 'swamp' || t.terrain == 'plain') {
              count++;
          }
      });
  });
  return count;
}
