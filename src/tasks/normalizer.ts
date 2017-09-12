export function normalize(value: any): any {

  if (value instanceof Room) {
    return 'RO:' + value.name;
  }

  if (value instanceof Creep && value.my) {
    return 'CR:' + value.name;
  }

  if (value instanceof ConstructionSite && value.my) {
    return 'CS:' + value.id;
  }

  if (value instanceof Spawn && value.my) {
    return 'SP:' + value.name;
  }

  if (value instanceof Flag) {
    return 'FL:' + value.name;
  }

  if (value instanceof OwnedStructure && value.my) {
    return 'ST:' + value.id;
  }

  if (
    value instanceof Creep ||
    value instanceof ConstructionSite ||
    value instanceof Source ||
    value instanceof Structure
  ) {
    return 'GO:' + value.id;
  }

  if (_.isArray(value)) {
    return _.map(value, normalize);
  }

  if (_.isObject(value)) {
    return _.mapValues(value, normalize);
  }

  return value;
}

export function denormalize(value: any): any {

  if (typeof value === 'string' && value[2] === ':') {
    const what = value.substr(0, 2);
    const id = value.substr(3);
    switch (what) {
      case 'RO': return Game.rooms[id];
      case 'CR': return Game.creeps[id];
      case 'SP': return Game.spawns[id];
      case 'ST': return Game.structures[id];
      case 'FL': return Game.flags[id];
      case 'CS': return Game.constructionSites[id];
      case 'GO': return Game.getObjectById<any>(id);
    }
  }

  if (_.isArray(value)) {
    return _.map(value, denormalize);
  }

  if (_.isObject(value)) {
    return _.mapValues(value, denormalize);
  }

  return value;
}
