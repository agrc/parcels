import { describe, expect, it, vi } from 'vitest';

const vectorTileLayer = vi.fn(function MockVectorTileLayer(
  this: { properties: unknown },
  properties: unknown,
) {
  this.properties = properties;
});

vi.mock('@arcgis/core/layers/VectorTileLayer', () => ({
  default: vectorTileLayer,
}));

describe('overlayLayers', () => {
  it('includes the PLSS vector tile overlay with the configured service url', async () => {
    const { overlayLayers } = await import('./overlayLayers');
    const { default: config } = await import('./config');

    expect(overlayLayers).toHaveLength(2);
    expect(overlayLayers[0]).toBe('Land Ownership');

    const plssOverlay = overlayLayers[1]!;

    expect(plssOverlay).toMatchObject({
      label: 'PLSS',
    });

    if (typeof plssOverlay === 'string') {
      throw new Error('expected PLSS overlay config');
    }

    expect(plssOverlay.function()).toEqual({
      properties: {
        url: config.plssVectorTileService,
      },
    });
    expect(vectorTileLayer).toHaveBeenCalledWith({
      url: config.plssVectorTileService,
    });
  });
});
