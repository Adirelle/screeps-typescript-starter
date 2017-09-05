const actions = {
  'harvest': harvest,
  'upgrade': upgrade,
  'transfer': transfer,
  'build': build
};
const actionPrecedence = ['harvest', 'upgrade', 'transfer', 'build'];

module.exports = {
  name: 'worker',

  bodyTemplate: [CARRY, WORK, MOVE, MOVE],

  /** @param Room room */
  targetPopulation: function(room) {
      return 1;
  },

  /**
   * @param {Creep] creep
   */
  run: function(creep) {

      if (!creep.memory.harvest && !creep.carry[RESOURCE_ENERGY]) {
          creep.memory.harvest = findClosestSource(creep);
      }

      if (doAction(creep, 'harvest')) {
          return;
      }

      if (doAction(creep, 'upgrade')
          || doAction(creep, 'transfer')
          || doAction(creep, 'build')) {
          return;
      }

      idle(creep);
  },
};

/**
* @param {Creep} creep
* @param {string} action
*
* @return bool
*/
function doAction(creep, action) {
  const mem = creep.memory,
      targetId = mem[action];
  if (!targetId) {
      return false;
  }
  const newId = actions[action](creep, targetId) || undefined;
  mem[action] = newId;
  if (!newId) {
      return false;
  }
  if (action != mem.task) {
      mem.task = action;
      creep.say(`${action}ing`);
  }
  return true;
}

/**
* @param {Creep} creep
*
* @return {string}
*/
function idle(creep) {
  const struct = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: s => s.energyCapacity && s.energy < s.energyCapacity});
  if (struct) {
      creep.memory.transfer = struct.id;
      return;
  }

  const site = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
  if(site) {
      creep.memory.build = site.id;
      return;
  }

  if (creep.room.controller.level < 8) {
      creep.memory.upgrade = creep.room.controller.id;
      return;
  }
}

/**
* @param {Creep} creep
*
* @return {string}
*/
function harvest(creep, sourceId) {
  if (_.sum(creep.carry) >= creep.carryCapacity) {
      creep.memory.harvest = undefined;
      return;
  }

  return doWork(
      creep,
      sourceId,
      s => s.energy >= 0,
      s => creep.harvest(s)
  );
}

/**
* @param {Creep} creep
* @param {string} targetId
* @param {function} check
* @param {function} act
*
* @return {string|null}
*/
function doWork(creep, targetId, check, act) {
  const target = Game.getObjectById(targetId);
  if (!target || !check(target)) {
      return;
  }

  const result = act(target);
  if (result == ERR_NOT_IN_RANGE) {
      const result = creep.moveTo(target, {visualizePathStyle: {}});
      if (result != OK && result != ERR_TIRED) {
          return;
      }
  } else if (result == ERR_NOT_ENOUGH_RESOURCES) {
      creep.memory.harvest = findClosestSource(creep, target);
  } else if (result != OK) {
      return;
  }
  return target.id;
}

/**
* @param {Creep}  creep
* @param target
*
* @return {string|null}
*/
function findClosestSource(creep, target) {
  const source = ((target && target.pos || target) || creep.pos).findClosestByPath(FIND_SOURCES_ACTIVE, s => s.energy >= 0);
  return source ? source.id : null;
}

/**
* @param {Creep} creep
*
* @return {string}
*/
function upgrade(creep) {
  return doWork(
      creep,
      creep.room.controller.id,
      c => c.ticksToDowngrade < 5000 || c.level < 8,
      c => creep.upgradeController(c)
  );
}

/**
* @param {Creep} creep
*
* @return {string|null}
*/
function transfer(creep, structId) {
  return doWork(
      creep,
      structId,
      s => s.energy < s.energyCapacity,
      s => creep.transfer(s, RESOURCE_ENERGY)
  );
}

/**
* @param {Creep} creep
*
* @return {string}
*/
function build(creep, siteId) {
  return doWork(
      creep,
      siteId,
      s => true,
      s => creep.build(s)
  );
}
