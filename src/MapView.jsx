import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import EsriMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import { ArrowsExpandIcon } from '@heroicons/react/outline';
import clsx from 'clsx';
import ky from 'ky';
import debounce from 'lodash.debounce';
import { useEffect, useRef, useState } from 'react';
import { useGraphicManager, useHash } from './hooks';
import LayerSelector from './vendor/LayerSelector/LayerSelector';

const parcels =
  'https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahStatewideParcels/FeatureServer/0/';

const ParcelMap = ({ setMapView, toggleSidebar, fullScreen, setActiveParcel, initialView }) => {
  const mapDiv = useRef(null);
  const mapView = useRef(null);
  const events = useRef([]);
  const [selectorOptions, setSelectorOptions] = useState(null);
  const { setGraphic } = useGraphicManager(mapView.current);
  const [_, setHash] = useHash();

  console.log('initialView', initialView);
  const clickHandler = async (event) => {
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
  };

  const updateHash = () => {
    const { scale } = mapView.current.viewpoint;
    const { x, y } = mapView.current.center;
    setHash(`${initialView.name}/location/${x},${y},${scale}`);
  };

  useEffect(() => {
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

    setSelectorOptions({
      view: mapView.current,
      quadWord: import.meta.env.VITE_DISCOVER_KEY,
      baseLayers: ['Lite', 'Hybrid', 'Terrain', 'Topo', 'Color IR'],
      position: 'top-right',
    });
  }, []);

  const controller = useRef(null);
  useEffect(() => {
    controller.current = new AbortController();
    const { signal } = controller;

    if (mapView.current) {
      if (controller.current) {
        controller.current.abort();
      }

      mapView.current.when(() => {
        mapView.current
          .goTo(initialView.target, { animate: false, signal })
          .then(() => events.current.push(mapView.current.watch('extent', debounce(updateHash, 100))))
          .catch(function () {});
      });

      mapView.current.when(() => events.current.push(mapView.current.on('click', clickHandler)));

      return () => {
        events.current.forEach((handle) => handle.remove());
        events.current.length = 0;
      };
    }
  }, [initialView]);

  return (
    <section
      className={clsx(
        { 'mx-2': fullScreen, 'mr-2': !fullScreen },
        'relative mb-2 border border-gray-300 shadow cursor-pointer grid-area-map bg-gradient-to-br from-gray-50 to-gray-100'
      )}
    >
      <div className="absolute bottom-0 right-0 z-10 flex items-center justify-center text-white transition-colors bg-green-800 rounded-tl shadow cursor-pointer w-7 h-7 hover:bg-green-600">
        <ArrowsExpandIcon className="w-6 h-6" onClick={toggleSidebar} />
      </div>
      <div className="w-full h-full" ref={mapDiv}>
        {selectorOptions ? <LayerSelector {...selectorOptions}></LayerSelector> : null}
      </div>
    </section>
  );
};

export default ParcelMap;
