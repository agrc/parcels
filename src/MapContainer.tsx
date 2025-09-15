import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import EsriMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import { LayerSelector, type LayerSelectorProps } from '@ugrc/utah-design-system';
import { useMapReady, utahMercatorExtent } from '@ugrc/utilities/hooks';
import { useEffect, useRef, useState } from 'react';
import config from './config';
import { useMap } from './hooks/useMap';

export const MapContainer = ({ onClick }: { onClick?: __esri.ViewClickEventHandler }) => {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapComponent = useRef<EsriMap | null>(null);
  const mapView = useRef<MapView>(null);
  const isReady = useMapReady(mapView.current);
  const clickHandler = useRef<IHandle>(null);
  const [selectorOptions, setSelectorOptions] = useState<LayerSelectorProps | null>(null);
  const { setMapView, addLayers } = useMap();

  // setup the Map
  useEffect(() => {
    if (!mapNode.current || !setMapView) {
      return;
    }

    mapComponent.current = new EsriMap();

    mapView.current = new MapView({
      container: mapNode.current,
      map: mapComponent.current,
      extent: utahMercatorExtent,
      ui: {
        components: ['zoom'],
      },
      padding: {
        bottom: 200,
      },
    });

    setMapView(mapView.current);

    const selectorOptions: LayerSelectorProps = {
      options: {
        view: mapView.current,
        quadWord: import.meta.env.VITE_DISCOVER,
        basemaps: ['Hybrid', 'Lite', 'Terrain', 'Topo', 'Color IR'],
        operationalLayers: ['Land Ownership'],
      },
    };

    setSelectorOptions(selectorOptions);

    return () => {
      mapView.current?.destroy();
      mapComponent.current?.destroy();
    };
  }, [setMapView]);

  // add the map layers
  useEffect(() => {
    if (isReady) {
      addLayers([
        new FeatureLayer({
          url: config.parcelService,
          minScale: 10000,
          renderer: {
            type: 'simple',
            symbol: {
              type: 'simple-fill',
              style: 'solid',
              color: [0, 0, 0, 0],
              outline: {
                type: 'simple-line',
                style: 'solid',
                color: [255, 255, 255, 255],
                width: 1,
              },
            },
          },
          labelingInfo: [
            {
              labelPlacement: 'always-horizontal',
              labelExpression: '[PARCEL_ID]',
              symbol: {
                type: 'text',
                color: [0, 0, 0, 255],
                verticalAlignment: 'bottom',
                horizontalAlignment: 'center',
                haloColor: [255, 255, 255, 253],
                haloSize: 5,
                font: {
                  family: 'Arial',
                  size: 8,
                  style: 'normal',
                  weight: 'bold',
                  decoration: 'none',
                },
              },
              minScale: 5000,
              maxScale: 0,
            },
          ],
        }),
      ]);
    }
  }, [isReady, addLayers]);

  // add click event handlers
  useEffect(() => {
    if (onClick) {
      clickHandler.current = mapView.current!.on('click', onClick);
    }

    return () => {
      clickHandler.current?.remove();
    };
  }, [onClick, mapView]);

  return (
    <div ref={mapNode} className="size-full">
      {selectorOptions && <LayerSelector {...selectorOptions}></LayerSelector>}
    </div>
  );
};
