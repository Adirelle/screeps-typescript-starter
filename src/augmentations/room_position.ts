
RoomPosition.prototype.toString = function(this: RoomPosition): string {
  return `@(${this.roomName}:${this.x},${this.y})`;
};
