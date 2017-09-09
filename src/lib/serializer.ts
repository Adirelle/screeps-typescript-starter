import { log } from './logger/log';

export interface Serializer<U, S> {
  readonly type: string;
  serialize(u: U): S;
  unserialize(s: S): U;
}

const serializers: { [type: string]: Serializer<any, any> } = {};

export function registerSerializer(serializer: Serializer<any, any>): void {
  if (serializers[serializer.type]) {
    return;
  }
  serializers[serializer.type] = serializer;
  log.debug(`Registered ${serializer.type} serializer`);
}

interface Typed {
  type: string;
}

export function serialize<U extends Typed, S extends Typed>(u: U): S {
  const serializer = serializers[u.type];
  if (!serializer) {
    throw new Error(`Do not know how to serialize type ${u.type}`);
  }
  return serializer.serialize(u);
}

export function unserialize<S extends Typed, U extends Typed>(s: S): U {
  const serializer = serializers[s.type];
  if (!serializer) {
    throw new Error(`Do not know how to unserialize type ${s.type}`);
  }
  return serializer.unserialize(s);
}
