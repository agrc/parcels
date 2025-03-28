import Graphic from '@arcgis/core/Graphic';
import MapView from '@arcgis/core/views/MapView';
import { useGraphicManager } from '@ugrc/utilities/hooks';
import { createContext, type ReactNode, useCallback, useState } from 'react';

type GraphicOptions = Graphic | Graphic[] | null;
export const MapContext = createContext<{
  addLayers: (layers: __esri.Layer[]) => void;
  mapView: MapView | null;
  setMapView: (mapView: MapView | null) => void;
  placeGraphic: (graphic: GraphicOptions) => void;
  zoom: (geometry: __esri.GoToTarget2D) => void;
} | null>(null);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [mapView, setMapView] = useState<MapView | null>(null);
  const { setGraphic } = useGraphicManager(mapView);

  const zoom = (geometry: __esri.GoToTarget2D): void => {
    if (!mapView) {
      console.warn('attempting to zoom before the mapView is set');

      return;
    }

    mapView.goTo(geometry);
  };

  const placeGraphic = (graphic: GraphicOptions): void => {
    setGraphic(graphic);
  };

  const addLayers = useCallback(
    (layers: __esri.Layer[]): void => {
      if (!mapView) {
        console.warn('attempting to add a layer before the mapView is set');

        return;
      }

      if (!mapView.map) {
        console.warn('mapView does not have a map property');

        return;
      }

      mapView.map.addMany(layers);
    },
    [mapView],
  );

  return (
    <MapContext.Provider
      value={{
        mapView,
        setMapView,
        placeGraphic,
        zoom,
        addLayers,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};
