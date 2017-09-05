export { CreepRole, CreepPopulation, CreepRoleRegistry, CreepFactory } from './role';

import { factory as hFactory } from './harvester';
import { factory as mFactory } from './mule';
import { factory as uFactory } from './upgrader';

export const roles = new CreepRoleRegistry({
  harvester: hFactory,
  mule: mFactory,
  upgrader: uFactory
});
