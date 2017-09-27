
export type EnergizedStructure = Structure & EnergyContainer;

export type Outcome = string | { outcome: string; value?: any };

type Transitions = ((outcome: string, current: string) => string) | { [outcome: string]: string };

export interface State {
  transitions: Transitions;
  action(creep: Creep, value: any, state: string): Outcome;
}

export type TaskType = 'recharge' | 'work';

export interface Task {
  readonly id: string;
  readonly name: string;
  readonly pos: RoomPosition;
  priority: number;
  assigned: boolean;

  checkAssignation(creep: Creep): boolean;
  toOutcome(): Outcome;
}

export class BaseTask<T extends { pos: RoomPosition, id: string }> implements Task {
  public readonly id: string;
  public readonly pos: RoomPosition;
  public assigned = false;

  constructor(
    public readonly name: string,
    public readonly target: T,
    public priority: number
  ) {
    this.pos = target.pos;
    this.id = this.name + ':' + target.id;
  }

  public checkAssignation(creep: Creep) {
    if (!this.assigned) {
      const o = this.toOutcome();
      if (creep.memory.state === o.outcome && _.isEqual(creep.memory.value, o.value)) {
        this.assigned = true;
      }
    }
    return this.assigned;
  }

  public toOutcome() {
    return { outcome: this.name, value: this.target.id };
  }

  public toString(): string {
    return this.id;
  }
}

export interface HarvestSpot {
  id: string;
  pos: RoomPosition;
}
