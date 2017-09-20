export const enum BodyTypeName {
  WORKER = 'worker',
  MULE = 'mule'
}

export class BodyType {
  public readonly bodyCost: number;

  constructor(
    public readonly type: BodyTypeName,
    public readonly num: number,
    public readonly priority: number,
    public readonly body: BodyPartType[]
  ) {
    this.bodyCost = _.sum(_.map(body, (part) => BODYPART_COST[part]));
  }

  public toString() {
    return `${this.type}(${this.body})`;
  }

  public sizedBody(size: number): BodyPartType[] {
    const body = [];
    for (const part of this.body) {
      for (let i = 0; i < size; i++) {
        body.push(part);
      }
    }
    return body;
  }
}

export const BODY_TYPES: { readonly [type: string]: BodyType } = {
  // [BodyTypeName.MULE]: new BodyType(BodyTypeName.MULE, 2, 90, [MOVE, CARRY]),
  [BodyTypeName.WORKER]: new BodyType(BodyTypeName.WORKER, 10, 100, [MOVE, MOVE, CARRY, WORK])
};
