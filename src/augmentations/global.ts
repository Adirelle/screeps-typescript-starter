
function isEnergyContainer(x: {}): x is EnergyContainer {
  return typeof (x as any).energyCapacity === 'number';
}

global.isEnergyContainer = isEnergyContainer;
