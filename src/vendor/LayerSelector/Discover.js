/** Sets the TileInfo for each of Discover layers since they all use different levels.
 * @private
 * @param {applianceLayer} layers - The appliance layers object `{ 'id': { urlPattern: ''}}`
 * @returns {applianceLayer} - returns Discover layers object with a new `tileInfo` property.
 */
const setTileInfosForApplianceLayers = (layers, defaultTileInfo, TileInfo) => {
  const lods = defaultTileInfo.lods;
  const fiveToNineteen = lods.slice(0, 20); // eslint-disable-line no-magic-numbers
  const fiveToSeventeen = lods.slice(0, 18); // eslint-disable-line no-magic-numbers
  const zeroToEighteen = lods.slice(0, 19); // eslint-disable-line no-magic-numbers

  layers.Imagery.tileInfo = new TileInfo(defaultTileInfo);
  layers.Hybrid.tileInfo = new TileInfo(defaultTileInfo);

  let tileInfo = Object.assign({}, defaultTileInfo);
  tileInfo.lods = zeroToEighteen;

  layers['Color IR'].tileInfo = new TileInfo(tileInfo);

  tileInfo = Object.assign({}, defaultTileInfo);
  tileInfo.lods = fiveToSeventeen;

  layers.Topo.tileInfo = new TileInfo(tileInfo);

  tileInfo = Object.assign({}, defaultTileInfo);
  tileInfo.lods = fiveToNineteen;

  layers.Lite.tileInfo = new TileInfo(tileInfo);
  layers.Overlay.tileInfo = new TileInfo(tileInfo);

  return layers;
};

export { setTileInfosForApplianceLayers };
