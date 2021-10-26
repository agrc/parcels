/**
 * Creates the default TileInfo constructor object for appliance layers.
 * @private
 * @returns {object} The least common denominator constructor object for appliance layers.
 */
const createDefaultTileInfo = (LOD) => {
  const tileSize = 256;
  const earthCircumference = 40075016.685568;
  const inchesPerMeter = 39.37;
  const initialResolution = earthCircumference / tileSize;

  const dpi = 96;
  const maxLevel = 20;
  const squared = 2;
  const lods = [];

  for (let level = 0; level <= maxLevel; level++) {
    const resolution = initialResolution / Math.pow(squared, level);
    const scale = resolution * dpi * inchesPerMeter;

    lods.push(new LOD({
      level: level,
      scale: scale,
      resolution: resolution
    }));
  }

  return {
    dpi: dpi,
    size: tileSize,
    origin: {
      x: -20037508.342787,
      y: 20037508.342787
    },
    spatialReference: {
      wkid: 3857
    },
    lods: lods
  };
};

export { createDefaultTileInfo };
