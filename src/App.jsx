import { useEffect, useState } from 'react';
import clsx from 'clsx';
import Viewpoint from '@arcgis/core/Viewpoint';
import Polygon from '@arcgis/core/geometry/Polygon';
import Extent from '@arcgis/core/geometry/Extent';
import { ToastContainer, toast } from 'react-toastify';
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { Disclaimer, Header, Sidebar, Section, ParcelInformation, ParcelTypeAhead, TypeAhead } from './PageElements';
import ParcelMap from './MapView';
import { TailwindDartboard } from './vendor/Dartboard/Dartboard';
import { useHash, useOpenClosed, useMapZooming, useGraphicManager } from './hooks';
import extents from './extents';

const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const pointSymbol = {
  type: 'web-style',
  name: 'esri-pin-1',
  styleName: 'Esri2DPointSymbolsStyle',
};

const defaultAppState = {
  name: 'Utah State',
  target: new Extent({
    xmax: -12010849.397533866,
    xmin: -12898741.918094235,
    ymax: 5224652.298632992,
    ymin: 4422369.249751998,
    spatialReference: {
      wkid: 3857,
    },
  }),
};

export function extractCountyAndView(hash) {
  if (hash === '' || hash === '#') {
    return defaultAppState;
  }

  const symbolLength = 1;
  const section = hash.indexOf('/');

  let countyName = '';
  if (section === -1) {
    countyName = hash.substring(symbolLength).replace(/\+|%20/g, ' ');
  } else {
    countyName = hash.substring(symbolLength, section).replace(/\+|%20/g, ' ');
  }

  if (hash.includes('/location/')) {
    const [x, y, scale] = hash.substring(hash.lastIndexOf('/') + 1).split(',');

    logEvent(analytics, 'county_view', {
      county: countyName || defaultAppState.name,
    });

    logEvent(analytics, 'deep_link');

    return {
      name: countyName || defaultAppState.name,
      target: new Viewpoint({
        targetGeometry: {
          type: 'point',
          x,
          y,
          spatialReference: { wkid: 3857 },
        },
        scale,
      }),
    };
  }

  const county = extents.filter((item) => item.name === countyName);
  const state = county.length > 0 ? county[0] : defaultAppState;

  logEvent(analytics, 'county_view', {
    county: state.name,
  });

  return state;
}

export function App() {
  const [isOpen, { toggle }] = useOpenClosed(window.innerWidth >= 768);
  const [mapView, setMapView] = useState();
  const { setGraphic } = useGraphicManager(mapView);
  const { setGeometry } = useMapZooming(mapView);
  const [activeParcel, setActiveParcel] = useState(undefined);
  const [hash] = useHash();
  const [appConfig, setAppConfig] = useState(defaultAppState);

  useEffect(() => {
    setAppConfig(extractCountyAndView(hash));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className={clsx('grid w-screen h-screen gap-2 overflow-hidden bg-gray-100 grid-template', {
        'grid-template--sidebar-closed': !isOpen,
      })}
    >
      <Disclaimer />
      <ParcelInformation feature={activeParcel} />
      <Header county={appConfig.name} />
      <Sidebar isOpen={isOpen}>
        <Section>
          <ParcelTypeAhead
            county={appConfig.name === defaultAppState.name ? '' : appConfig.name}
            onSuccess={(result) => {
              const polygon = new Polygon(result.geometry);

              logEvent(analytics, 'parcel_search', {
                parcel: result?.attributes?.parcel_id,
                county: appConfig.name === defaultAppState.name ? '' : appConfig.name,
              });

              setGeometry(polygon.extent.expand(3));
              setGraphic({
                geometry: result.geometry,
                attributes: {},
                symbol: {
                  type: 'simple-fill',
                  style: 'solid',
                  color: [170, 170, 170, 0.2],
                  outline: {
                    color: [255, 255, 0],
                    style: 'dash-dot',
                    width: 1.5,
                  },
                },
              });
            }}
          />
        </Section>
        <Section>
          <TailwindDartboard
            className="mb-4"
            pointSymbol={pointSymbol}
            events={{
              success: (result) => {
                logEvent(analytics, 'geocode', {
                  address: result?.attributes.InputAddress,
                  score: result?.attributes.Score,
                });
                setGeometry(new Viewpoint({ targetGeometry: result.geometry, scale: 1000 }));
                setGraphic(result);
              },
              error: () => toast.error('No results found'),
            }}
            apiKey={import.meta.env.VITE_API_KEY}
            format="esrijson"
          >
            <div className="text-lg font-semibold">Find an address</div>
          </TailwindDartboard>
        </Section>
        <Section>
          <TypeAhead
            onSuccess={(result) => {
              logEvent(analytics, 'gnis_search', { gnis: result?.attributes?.name });
              setGeometry(new Viewpoint({ targetGeometry: result.geometry, scale: 25000 }));
              setGraphic({
                geometry: result.geometry,
                attributes: {},
                symbol: pointSymbol,
              });
            }}
            label="Find a GNIS place name"
            layer="location.gnis_place_names"
            field="name"
          />
        </Section>
        <Section>
          <TypeAhead
            onSuccess={(result) => {
              logEvent(analytics, 'city_search', { city: result?.attributes?.name });
              const polygon = new Polygon(result.geometry);

              setGeometry(polygon.extent.expand(1));
              setGraphic({
                geometry: result.geometry,
                attributes: {},
                symbol: {
                  type: 'simple-fill',
                  style: 'solid',
                  color: [170, 170, 170, 0.2],
                  outline: {
                    color: [255, 255, 0],
                    style: 'dash-dot',
                    width: 1.5,
                  },
                },
              });
            }}
            label="Find a city"
            layer="boundaries.municipal_boundaries"
            field="name"
          />
        </Section>
      </Sidebar>
      <ParcelMap
        ga={{ analytics, logEvent }}
        initialView={appConfig}
        setMapView={setMapView}
        fullScreen={!isOpen}
        toggleSidebar={toggle}
        setActiveParcel={setActiveParcel}
      />
      <ToastContainer />
    </main>
  );
}
