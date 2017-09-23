
export function manageLinks(room: Room) {
  const links = room.find<Link>(
    FIND_MY_STRUCTURES,
    { filter: (s: Structure) => s.isActive() && s.isLink()}
  );
  links.sort((a, b) => b.energy - a.energy);
  while (links.length > 1) {
    const lower = links.pop()!;
    log.debug('lower', lower, lower.energy);
    while (links.length > 0) {
      const higher = links.shift()!;
      log.debug('higher', higher, higher.energy, higher.cooldown);
      if (higher.cooldown) {
        continue;
      }
      const amount = (higher.energy - lower.energy) / 2;
      if (amount < higher.energyCapacity * 0.10) {
        return;
      }
      const result = higher.transferEnergy(lower as any, amount);
      if (result === OK) {
        log.debug(`Transfered ${amount} energy from ${higher} to ${lower}`);
      } else {
        log.debug(`Could not transfered ${amount} energy from ${higher} to ${lower}`);
      }
      break;
    }
  }
}
