
export function manageTowers(room: Room) {
  _.each(
    _.filter(
      room.myActiveStructures,
      (t: Structure) => t instanceof StructureTower && t.energy > 0
    ),
    manageTower
  );
}

function manageTower(tower: Tower) {
  if (attackHostiles(tower)) {
    return;
  }
  if (healFriends(tower)) {
    return;
  }
  if (repairStructs(tower)) {
    return;
  }
}

function attackHostiles(tower: Tower) {
  const hostile = tower.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS);
  log.debug(tower, 'attackHostiles', hostile);
  if (!hostile) {
    log.debug(tower, 'No hostile creep');
    return false;
  }
  log.debug(tower, 'attacks', hostile);
  return tower.attack(hostile) === OK;
}

function healFriends(tower: Tower) {
  const friend = tower.pos.findClosestByRange<Creep>(tower.room.myCreeps, {filter: (c: Creep) => c.hits < c.hitsMax});
  if (!friend) {
    log.debug(tower, 'No wounded creep');
    return false;
  }
  log.debug(tower, 'heals', friend);
  return tower.heal(friend) === OK;
}

function repairStructs(tower: Tower) {
  const struct = tower.pos.findClosestByRange<Structure>(
    FIND_STRUCTURES,
    {filter: (s: Structure) => isMineOrNeutral(s) && s.hits < s.hitsMax}
  );
  if (!struct) {
    log.debug(tower, 'No structure to repair');
  }
  return tower.repair(struct) === OK;
}

function isMineOrNeutral(struct: Structure): boolean {
  return (struct as OwnedStructure).my !== false;
}
