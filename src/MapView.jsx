import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import EsriMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import clsx from 'clsx';
import ky from 'ky';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGraphicManager, useHash } from './hooks';
import LayerSelector from '@ugrc/layer-selector';
import '@ugrc/layer-selector/src/LayerSelector.css';

const parcels =
  'https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahStatewideParcels/FeatureServer/0/';

const ParcelMap = ({ ga, setMapView, toggleSidebar, fullScreen, setActiveParcel, initialView }) => {
  const mapDiv = useRef(null);
  const mapView = useRef(null);
  const FullScreen = useRef(null);
  const [selectorOptions, setSelectorOptions] = useState(null);
  const { setGraphic } = useGraphicManager(mapView.current);
  const [, setHash] = useHash();

  const clickHandler = useCallback(
    async (event) => {
      const results = await ky
        .get('query', {
          prefixUrl: parcels,
          searchParams: {
            geometry: JSON.stringify(event.mapPoint.toJSON()),
            geometryType: 'esriGeometryPoint',
            returnGeometry: true,
            outFields: [
              'CoParcel_URL',
              'PARCEL_ADD',
              'PARCEL_CITY',
              'PARCEL_ZIP',
              'PARCEL_ID',
              'ParcelsCur',
              'ParcelNotes',
              'OWN_TYPE',
              'County',
              'ACCOUNT_NUM',
            ].join(),
            f: 'json',
          },
        })
        .json();

      let feature = null;
      if (results.features.length > 0) {
        feature = results.features[0];
        feature.geometry.type = 'polygon';
        feature.geometry.spatialReference = mapView.current.spatialReference;
        feature.symbol = {
          type: 'simple-fill',
          style: 'solid',
          color: [170, 170, 170, 0.2],
          outline: {
            type: 'simple-line',
            style: 'solid',
            color: [127, 219, 255],
            width: 3,
          },
        };
      }
      setActiveParcel(feature);
      setGraphic(feature);

      if (feature !== null) {
        ga.logEvent(ga.analytics, 'parcel_identify', {
          id: feature.attributes.PARCEL_ID,
          address: `${feature.attributes.PARCEL_ADD}, ${feature.attributes.PARCEL_CITY} ${feature.attributes.PARCEL_ZIP}`,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setActiveParcel, setGraphic],
  );

  const updateHash = useCallback(() => {
    const { scale } = mapView.current.viewpoint;
    const { x, y } = mapView.current.center;
    setHash(`${initialView.name === 'Utah State' ? '' : initialView.name}/location/${x},${y},${scale}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView]);

  useEffect(() => {
    console.log('rerender::map initialization');
    if (!mapDiv.current || mapView.current) {
      return;
    }

    const statewideParcels = new FeatureLayer({
      url: parcels,
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
    });

    const map = new EsriMap();
    map.layers.add(statewideParcels);

    mapView.current = new MapView({
      container: mapDiv.current,
      map,
      ui: {
        components: ['zoom'],
      },
    });

    setMapView(mapView.current);

    mapView.current.ui.add(FullScreen.current, 'top-left');

    setSelectorOptions({
      view: mapView.current,
      quadWord: import.meta.env.VITE_DISCOVER_KEY,
      baseLayers: ['Lite', 'Hybrid', 'Terrain', 'Topo', 'Color IR'],
      position: 'top-right',
      ga: ga,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMapView]);

  const controller = useRef(null);
  useEffect(() => {
    controller.current = new AbortController();
    const { signal } = controller;

    if (mapView.current) {
      if (controller.current) {
        controller.current.abort();
      }

      const events = [];
      mapView.current.when(() => {
        mapView.current
          .goTo(initialView.target, { animate: false, signal })
          .then(() => events.push(mapView.current.watch('extent', debounce(updateHash, 100))))
          .catch(function () {});
      });

      mapView.current.when(() => events.push(mapView.current.on('click', clickHandler)));

      return () => {
        events.forEach((handle) => handle.remove());
        events.length = 0;
      };
    }
  }, [initialView, clickHandler, updateHash]);

  return (
    <section
      className={clsx(
        { 'mx-2': fullScreen, 'mr-2': !fullScreen },
        'relative mb-2 border border-gray-300 shadow cursor-pointer grid-area-map bg-gradient-to-br from-gray-50 to-gray-100',
      )}
    >
      <div className="w-full h-full" ref={mapDiv}>
        <div ref={FullScreen} className="mt-2 esri-component esri-widget">
          <div
            className="esri-widget--button esri-widget esri-interactive"
            role="button"
            tabIndex="0"
            title="Toggle full screen"
            onClick={toggleSidebar}
            onKeyPress={(event) => {
              if (event.key === 'Enter') toggleSidebar();
            }}
          >
            <span
              aria-hidden="true"
              role="presentation"
              className={clsx({
                'esri-icon-zoom-out-fixed': !fullScreen,
                'esri-icon-zoom-in-fixed': fullScreen,
              })}
            ></span>
            <span className="esri-icon-font-fallback-text">Toggle full screen</span>
          </div>
        </div>
        {selectorOptions ? <LayerSelector {...selectorOptions}></LayerSelector> : null}
      </div>
    </section>
  );
};

export default ParcelMap;
