import { useCallback, useEffect, useRef, useState } from 'react';
import Graphic from '@arcgis/core/Graphic';

export function useGraphicManager(mapView) {
  const [graphic, setGraphic] = useState();
  const previousGraphic = useRef();

  const removeGraphics = useCallback(
    (graphics) => {
      if (!graphics) {
        return;
      }

      if (Array.isArray(graphics)) {
        graphics.forEach((x) => mapView.graphics.remove(x));
      } else {
        mapView.graphics.remove(graphics);
      }
    },
    [mapView],
  );

  useEffect(() => {
    if (!mapView) return;

    removeGraphics(previousGraphic.current);

    let myGraphic = graphic;
    if (myGraphic?.declaredClass !== 'esri.Graphic') {
      if (Array.isArray(myGraphic)) {
        myGraphic = myGraphic.map((x) => new Graphic(x));
      } else {
        myGraphic = new Graphic(myGraphic);
      }
    }

    previousGraphic.current = myGraphic;

    if (Array.isArray(myGraphic)) {
      return mapView.when(() => mapView.graphics.addMany(myGraphic));
    }

    mapView.when(() => mapView.graphics.add(myGraphic));
  }, [mapView, graphic, removeGraphics]);

  return { graphic, setGraphic };
}

export function useMapZooming(mapView) {
  const [geometry, setGeometry] = useState(null);

  useEffect(() => {
    if (geometry) {
      mapView.when(() => mapView.goTo(geometry).catch());
    }
  }, [geometry, mapView]);

  return { geometry, setGeometry };
}

export function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);

  const hashChangeHandler = useCallback(() => {
    setHash(window.location.hash);
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', hashChangeHandler);
    return () => {
      window.removeEventListener('hashchange', hashChangeHandler);
    };
  }, [hashChangeHandler]);

  const updateHash = useCallback(
    (newHash) => {
      if (newHash !== hash) {
        window.location.hash = newHash;
      }
    },
    [hash],
  );

  return [hash, updateHash];
}
