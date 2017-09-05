module.exports = {
  name: 'upgrader',

  bodyTemplate: [MOVE, WORK, CARRY],

  dependsOn: {
      'mule': 0.5,
  },

  /** @param Room room */
  targetPopulation: function(room) {
      if (room.controller.level < 8) {
          return 3;
      }
      if (room.controller.ticksToDowngrade < 4000) {
          return 1;
      }
      return 0;
  },

  /**
   * @param {Creep] creep
   */
  run: function(creep) {
      const target = creep.room.controller;
      if (target.ticksToDowngrade > 3000 && target.level == 8) {
          return;
      }
      let result = creep.upgradeController(target)
      if (result == ERR_NOT_IN_RANGE) {
          result = creep.moveTo(target);
      }
      if (result !== OK && result !== ERR_NOT_ENOUGH_RESOURCES) {
          console.log(creep.name, target.pos.roomName, result);
      }
  },
};
