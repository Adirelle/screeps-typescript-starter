export {
  Role,
  Population,
  Factory
} from './role';

import { Registry } from './role';

import * as Harvester from './harvester';
import * as Mule from './mule';
import * as Upgrader from './upgrader';

export const registry = new Registry({
  harvester: Harvester.factory,
  mule: Mule.factory,
  upgrader: Upgrader.factory
});
