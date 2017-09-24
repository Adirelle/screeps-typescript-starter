export const enum BodyTypeName {
  WORKER = 'worker',
  MULE = 'mule'
}

export class BodyType {

  constructor(
    public readonly type: BodyTypeName,
    public readonly num: number,
    public readonly priority: number,
    public readonly body: BodyPartType[]
  ) {}

  public toString() {
    return `${this.type}(${this.body})`;
  }

  public getBody(size: number = 1): BodyPartType[] {
    const body = [];
    for (const part of this.body) {
      for (let i = 0; i < size; i++) {
        body.push(part);
      }
    }
    body.push(MOVE);
    return body;
  }

  public getCost(size: number = 1): number {
    const body = this.getBody(size);
    return _.sum(body, (t) => BODYPART_COST[t]);
  }
}

export const BODY_TYPES: { readonly [type: string]: BodyType } = {
  // [BodyTypeName.MULE]: new BodyType(BodyTypeName.MULE, 2, 90, [MOVE, CARRY]),
  [BodyTypeName.WORKER]: new BodyType(BodyTypeName.WORKER, 10, 100, [MOVE, CARRY, WORK])
};
