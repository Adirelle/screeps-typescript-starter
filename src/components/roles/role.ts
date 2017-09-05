export interface Population {
  [role: string]: number;
}

export interface Role {
  run(): void;
}

export abstract class BaseRole implements Role {
  constructor(public readonly creep: Creep) {}

  public abstract run(): void;
}

export interface Factory {
  readonly name: string;
  readonly bodyTemplate: string[];
  readonly dependsOn?: Population;

  create(creep: Creep): Role;
  targetPopulation(room: Room, pop: Population): number;
}

export class Registry {
  constructor(public readonly factories: { [name: string]: Factory }) {}

  public factory(role: string): Factory {
    return this.factories[role];
  }

  public spawn(creep: Creep, roleName: string): Role {
    creep.memory.role = roleName;
    return this.factories[roleName].create(creep);
  }

  public reload(creep: Creep): Role {
    return this.factories[creep.memory.role].create(creep);
  }
}
