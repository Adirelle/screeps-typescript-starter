interface Mapper {
  prefix: string;
  getId: (value: any) => string;
  denormalize: (id: string) => any;
}

const gameObjectMapper: Mapper = {
  prefix: 'GO',
  getId: ({ id }: { id: string }) => id,
  denormalize: (id: string) => Game.getObjectById(id)
};

const roomMapper: Mapper = {
  prefix: 'RO',
  getId: (room: Room) => room.name,
  denormalize: (name: string) => Game.rooms[name]
};

const denormalizers: { [prefix: string]: (id: string) => any } = {};

_.each(
  [
    [Creep.prototype, gameObjectMapper],
    [ConstructionSite.prototype, gameObjectMapper],
    [Source.prototype, gameObjectMapper],
    [Structure.prototype, gameObjectMapper],
    [StructureExtension.prototype, gameObjectMapper],
    [StructureController.prototype, gameObjectMapper],
    [Room.prototype, roomMapper]
  ],
  ([prototype, { prefix, getId, denormalize }]: [any, Mapper]) => {
    prototype.toJSON = function() {
      return prefix + ':' + getId(this);
    };
    denormalizers[prefix] = denormalize;
  }
);

export function denormalize(value: any, _key?: string): any {
  if (typeof value === 'string' && value.length > 4 && value[2] === ':') {
    const denormalizer = denormalizers[value.substr(0, 2)];
    if (denormalizer) {
      return denormalizer(value.substr(3));
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
