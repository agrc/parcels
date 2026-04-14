import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import type { LayerSelectorProps } from '@ugrc/utah-design-system';
import config from './config';

export const overlayLayers: NonNullable<LayerSelectorProps['options']['operationalLayers']> = [
  'Land Ownership',
  {
    label: 'PLSS',
    function: () =>
      new VectorTileLayer({
        url: config.plssVectorTileService,
      }),
  },
];
