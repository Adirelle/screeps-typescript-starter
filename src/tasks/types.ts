
export type EnergizedStructure = Structure & EnergyContainer;

export type Outcome = string | { outcome: string; value?: any };

type Transitions = ((outcome: string, current: string) => string) | { [outcome: string]: string };

export interface State {
  transitions: Transitions;
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
