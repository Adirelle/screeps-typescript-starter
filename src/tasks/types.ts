
export type EnergizedStructure = Structure & EnergyContainer;

export type Outcome = string | { outcome: string; value?: any };

export interface State {
  transitions: { [outcome: string]: string };
  action(creep: Creep, value: any, state: string): Outcome;
}

export interface Task {
  name: string;
  value: any;
  pos: RoomPosition;
  priority: number;
}

export interface HarvestSpot {
  id: string;
  pos: RoomPosition;
}
