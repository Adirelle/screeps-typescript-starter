
Game.getObjectByIdOrDie = getObjectByIdOrDie;

function getObjectByIdOrDie<T>(id: string): T {
  const object = Game.getObjectById<T>(id);
  if (object === null) {
    throw new Error(`Could not found game object #${id}`);
  }
  return object;
}
