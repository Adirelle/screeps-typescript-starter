

interface Creep extends EnergyContainer {
  readonly color: string;
  readonly payload: number;
  isEmpty(): boolean;
  isFull(): boolean;

  canMoveTo(x: number, y: number, roomName?: string): boolean;
  canMoveTo(pos: RoomPosition): boolean;

  moveOneTo(x: number, y: number, roomName?: string): ResultCode;
  moveOneTo(pos: RoomPosition): ResultCode;

  moveToGoal(x: number, y: number, range?: number, roomName?: string): ResultCode;
  moveToGoal(pos: RoomPosition, range?: number): ResultCode;
  moveToGoal(goal: { pos: RoomPosition }, range?: number): ResultCode;
  moveToGoal(goal: { pos: RoomPosition, range?: number }): ResultCode;
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
  readonly costMatrix: CostMatrix;
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
