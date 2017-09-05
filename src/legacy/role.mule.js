module.exports = {
  name: 'mule',

  bodyTemplate: [CARRY, MOVE],

  dependsOn: {
      'harvester': 2,
  },

  /** @param Room room */
  targetPopulation: function(room, pop) {
      return Math.max(1, pop.harvester * 2);;
  },

  /**
   * @param {Creep] creep
   */
  run: function(creep) {
      const mem = creep.memory;
      let target = mem.target && Game.getObjectById(mem.target),
          task = target && mem.task,
          maxIter = 10,
          blacklist = [];

      do {
          if (target && task) {
              let result = -999;
              if (task == 'withdraw') {
                  if (target.carry[RESOURCE_ENERGY] > 0 || creep.carry[RESOURCE_ENERGY] < creep.carryCapacity) {
                      result = target.transfer(creep, RESOURCE_ENERGY);
                  }
              } else {
                  if (creep.carry[RESOURCE_ENERGY] > 0) {
                      result = creep.transfer(target, RESOURCE_ENERGY);
                  }
              }
              if (result == ERR_NOT_IN_RANGE) {
                  result = creep.moveTo(target);
              }
              if (result != OK && result != ERR_TIRED) {
                  blacklist.push(target);
                  task = target = undefined;
              } else {
                  break;
              }
          }

          if (creep.carry[RESOURCE_ENERGY] == 0) {
              target = findHarvesterToEmpty(creep, blacklist);
              if (target) {
                  task = 'withdraw';
              }
          } else {
              target = findTargetToRefill(creep, blacklist);
              if (target) {
                  task = 'transfer';
              }
          }

      } while (target && task && --maxIter);

      if (task != mem.task || (target && target.id) != mem.target) {
          if (target && task) {
              creep.say(task + "ing");
              mem.target = target.id;
              mem.task = task;
          } else {
              mem.target = mem.task = undefined;
          }
      }
  },
};

/**
* @param {Creep} creep
*
* @return {Creep|null}
*/
function findHarvesterToEmpty(creep, blacklist) {
  const allH = creep.room.find(FIND_MY_CREEPS, {filter: {memory: {role: 'harvester'}}}),
      harvesters = _.difference(allH, blacklist);
  const maxPayload = _.max(_.map(harvesters, c => c.carry[RESOURCE_ENERGY]));
  return creep.pos.findClosestByPath(harvesters, {filter: c => c.carry[RESOURCE_ENERGY] == maxPayload});
}

/**
* @param {Creep|Structure} target
*
* @return {number}
*/
function getEnergyPayload(target) {
  if (target instanceof Creep) {
      return target.carry[RESOURCE_ENERGY];
  } else if (target instanceof Structure) {
      return target.energy || 0;
  }
  return 0;
}

/**
* @param {Creep} creep
*
* @return {Creep|Structure|null}
*/
function findTargetToRefill(creep, blacklist) {
  let targets = [];

  _.each(
      creep.room.find(FIND_MY_CREEPS, {filter: c => c.carryCapacity && c.memory.role != 'harvester' && c.memory.role != 'mule'}),
      c => targets.push({ pos: c.pos, target: c, prio: 1000.0 * (c.carryCapacity - _.sum(c.carry)) / c.carryCapacity })
  );
  _.each(
      creep.room.find(FIND_MY_STRUCTURES, {filter: s => s.isActive() && s.energyCapacity}),
      s => targets.push({ pos: s.pos, target: s, prio: 100.0 * (s.energyCapacity - s.energy) / s.energyCapacity })
  );

  const maxPrio = _.max(_.map(targets, t => t.prio)),
      nearestTarget = creep.pos.findClosestByPath(targets, {filter: t => t.prio == maxPrio});

  return nearestTarget ? nearestTarget.target : null;
}
