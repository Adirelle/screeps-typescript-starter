import { BODY_TYPES, BodyType } from './body_types';

declare global {
  interface Creep {
    type: BodyType;
  }
}

Object.defineProperty(Creep.prototype, 'type', {
  configurable: true,
  get(this: Creep) {
    return BODY_TYPES[this.memory.type];
  },
  set(this: Creep, type: BodyType) {
    this.memory.type = type.type;
  }
});
