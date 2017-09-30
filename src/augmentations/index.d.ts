
interface Creep extends EnergyContainer {
  readonly color: string;
  readonly payload: number;
  isEmpty(): boolean;
  isFull(): boolean;
}

declare namespace NodeJS {
  interface Global {
    isEnergyContainer(x: any): x is EnergyContainer;
  }
}

interface Room {
  readonly myCreeps: Creep[];
  readonly myStructures: Structure[];
  readonly myActiveStructures: Structure[];
  toString(): string;
}

interface RoomPosition {
  toString(): string;
}

interface Structure {
  isTraversable(): boolean;

  isMine(): this is OwnedStructure;
  isHostile(): this is OwnedStructure;

  isContainer(): this is StructureContainer;
  isController(): this is StructureController;
  isExtension(): this is StructureExtension;
  isExtractor(): this is StructureExtractor;
  isKeeperLair(): this is StructureKeeperLair;
  isLab(): this is StructureLab;
  isLink(): this is StructureLink;
  isNuker(): this is StructureNuker;
  isObserver(): this is StructureObserver;
  isPortal(): this is StructurePortal;
  isPowerBank(): this is StructurePowerBank;
  isPowerSpawn(): this is StructurePowerSpawn;
  isRampart(): this is StructureRampart;
  isRoad(): this is StructureRoad;
  isSpawn(): this is StructureSpawn;
  isStorage(): this is StructureStorage;
  isTerminal(): this is StructureTerminal;
  isTower(): this is StructureTower;
  isWall(): this is StructureWall;

  toString(): string;
}
