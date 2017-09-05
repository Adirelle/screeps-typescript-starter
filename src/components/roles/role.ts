
export interface CreepPopulation {
  [role: string]: number
};

export interface CreepRole {
  run(): void;
}

export abstract class BaseRole implements CreepRole {
  constructor(
    public readonly creep: Creep,
  ) {};

  abstract run(): void;
}

export interface CreepFactory {
  readonly name: string;
  readonly bodyTemplate: string[];
  readonly dependsOn?: CreepPopulation;

  create(creep: Creep): CreepRole;
  targetPopulation(room: Room, pop: CreepPopulation): number;
}

export class CreepRoleRegistry {
  constructor(
    private readonly factories: { [name: string]: CreepFactory }
  ) {}

  public factory(role: string): CreepFactory {
    return this.factories[role];
  }

  public spawn(creep: Creep, roleName: string): CreepRole {
    creep.memory.role = roleName;
    return this.factory(roleName).create(creep);
  }

  public reload(creep: Creep): CreepRole {
    return this.factory(creep.memory.role).create(creep);
  }
}
