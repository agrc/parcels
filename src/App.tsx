import Graphic from '@arcgis/core/Graphic';
import Viewpoint from '@arcgis/core/Viewpoint';
import { watch } from '@arcgis/core/core/reactiveUtils';
import Polygon from '@arcgis/core/geometry/Polygon';
import {
  Drawer,
  Footer,
  Geocode,
  Header,
  Sherlock,
  SocialMedia,
  ugrcApiProvider,
  UgrcLogo,
  useFirebaseAnalytics,
} from '@ugrc/utah-design-system';
import { useGraphicManager, useViewPointZooming, utahMercatorExtent } from '@ugrc/utilities/hooks';
import ky from 'ky';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useState } from 'react';
import { useOverlayTrigger } from 'react-aria';
import { ErrorBoundary } from 'react-error-boundary';
import { useOverlayTriggerState } from 'react-stately';
import { toast, ToastContainer } from 'react-toastify';
import { MapContainer } from './MapContainer';
import { Disclaimer, ParcelInformation, ParcelTypeAhead } from './PageElements';
import config from './config';
import { useHash } from './hooks/useHash';
import { useMap } from './hooks/useMap';
import { extractCountyAndView, type AppState } from './utils';

const ErrorFallback = ({ error }: { error: Error }) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  );
};
const pointSymbol = {
  type: 'web-style',
  name: 'esri-pin-2',
  styleName: 'Esri2DPointSymbolsStyle',
} as __esri.WebStyleSymbolProperties & { type: 'web-style' };

const defaultAppState = {
  name: 'Utah State',
  target: utahMercatorExtent,
};
const version = import.meta.env.PACKAGE_VERSION;
const links = [
  {
    key: 'SGID parcels product page',
    action: { url: 'https://gis.utah.gov/products/sgid/cadastre/parcels/' },
  },
  {
    key: 'UGRC homepage',
    action: { url: 'https://gis.utah.gov/' },
  },
  {
    key: 'GitHub repository',
    action: { url: 'https://github.com/agrc/parcels' },
  },
  {
    key: `Version ${version} changelog`,
    action: { url: `https://github.com/agrc/parcels/releases/v${version}` },
  },
];

export function App() {
  const [appConfig, setAppConfig] = useState<AppState>(defaultAppState);
  const [activeParcel, setActiveParcel] = useState<__esri.Graphic | nullish>(null);

  const { mapView } = useMap();
  const logEvent = useFirebaseAnalytics();
  const { setGraphic } = useGraphicManager(mapView);
  const { setViewPoint } = useViewPointZooming(mapView!);
  const { hash, updateHash: setHash } = useHash();

  // get county name and set initial view
  useEffect(() => {
    setAppConfig(extractCountyAndView(hash));
    // only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sideBarState = useOverlayTriggerState({
    defaultOpen: window.innerWidth >= 768,
  });
  const sideBarTriggerProps = useOverlayTrigger(
    {
      type: 'dialog',
    },
    sideBarState,
  );
  const trayState = useOverlayTriggerState({ defaultOpen: false });
  const trayTriggerProps = useOverlayTrigger(
    {
      type: 'dialog',
    },
    trayState,
  );

  const updateHash = useCallback(() => {
    if (!mapView) {
      return;
    }

    const scale = mapView?.viewpoint?.scale ?? 0;
    const x = mapView?.center?.x ?? 0;
    const y = mapView?.center?.y ?? 0;

    if (scale === 0 || x === 0 || y === 0) {
      return;
    }

    setHash(`${appConfig.name === 'Utah State' ? '' : appConfig.name}/location/${x},${y},${scale}`);
    // skip mapView and setHash so this stays stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appConfig]);

  // update the hash when the map view changes
  useEffect(() => {
    if (mapView) {
      const events = [] as IHandle[];
      mapView.when(() => {
        mapView
          .goTo(appConfig.target, { animate: false })
          .then(() => events.push(watch(() => mapView.extent, debounce(updateHash, 100))));
      });

      return () => {
        events.forEach((handle) => handle.remove());
        events.length = 0;
      };
    }
    // skip mapView so this only runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appConfig]);

  // parcel identify click handler
  const clickHandler = useCallback(
    async (event: __esri.ViewClickEvent) => {
      const results: __esri.FeatureSet = await ky
        .get('query', {
          prefixUrl: config.parcelService,
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
        if (feature == null) {
          return;
        }

        if (!feature.geometry) {
          return;
        }

        feature.geometry = new Polygon({
          ...feature.geometry,
          spatialReference: mapView?.spatialReference,
        });

        feature.symbol = {
          type: 'simple-fill',
          color: [72, 44, 82, 0.25],
          style: 'diagonal-cross',
          outline: {
            style: 'solid',
            cap: 'square',
            join: 'round',
            color: [240, 18, 190],
            width: 4,
          },
        };
      }

      setActiveParcel(feature);
      setGraphic(new Graphic({ ...feature }));

      let scale = mapView?.scale ?? Infinity;
      if (scale > 35_000) {
        scale = 10_000;
      }

      mapView?.goTo({
        center: feature?.geometry,
        scale,
      });

      if (feature !== null) {
        logEvent('parcel_identify', {
          id: feature.attributes.PARCEL_ID,
          address: `${feature.attributes.PARCEL_ADD}, ${feature.attributes.PARCEL_CITY} ${feature.attributes.PARCEL_ZIP}`,
        });
      }
    },
    [setGraphic, logEvent, mapView],
  );

  // open the tray when a parcel is selected
  useEffect(() => {
    if (activeParcel !== null) {
      trayState.open();
    }

    // trayState cannot be closed if it is tracked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParcel]);

  return (
    <>
      <div className="relative z-10 mx-auto max-w-screen-md bg-white/50 dark:bg-zinc-900/50">
        <Disclaimer />
      </div>
      <main className="flex h-screen flex-col md:gap-2">
        <Header links={links}>
          <div className="flex h-full grow items-center gap-3">
            <UgrcLogo />
            <h2 className="font-heading text-3xl font-black text-zinc-600 sm:text-5xl dark:text-zinc-100">
              {appConfig.name} Parcels
            </h2>
          </div>
        </Header>
        <section className="relative flex min-h-0 flex-1 overflow-x-hidden md:mr-2">
          <Drawer main state={sideBarState} {...sideBarTriggerProps}>
            <div className="mx-2 mb-2 grid grid-cols-1 gap-2">
              <h2 className="text-xl font-bold">Map controls</h2>
              <div className="flex flex-col gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <ParcelTypeAhead
                    county={appConfig.name === defaultAppState.name ? '' : appConfig.name}
                    onSuccess={(result) => {
                      if (result.length === 0) {
                        toast.error('There was no location found for this parcel');

                        return;
                      }

                      const first = result[0];
                      if (first === undefined || first.geometry === null) {
                        toast.error('There was no location found for this parcel');

                        return;
                      }

                      const polygon = new Polygon(first.geometry);

                      if (polygon.extent === null) {
                        logEvent('parcel_search_no_geometry', {
                          parcel: first?.attributes?.parcel_id,
                          county: appConfig.name === defaultAppState.name ? '' : appConfig.name,
                        });

                        toast.error('There was no location found for this parcel');

                        return;
                      }

                      logEvent('parcel_search', {
                        parcel: first?.attributes?.parcel_id,
                        county: appConfig.name === defaultAppState.name ? '' : appConfig.name,
                      });

                      // Convert to ensure numeric values
                      const extent = polygon.extent!;
                      const expandScale = Number(3);

                      setViewPoint(
                        new Viewpoint({
                          targetGeometry: extent.expand(expandScale),
                        }),
                      );

                      setGraphic(
                        new Graphic({
                          geometry: first.geometry,
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
                        }),
                      );
                    }}
                  />
                </ErrorBoundary>
              </div>
              <div className="flex flex-col gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Geocode
                    pointSymbol={pointSymbol}
                    events={{
                      success: (result) => {
                        logEvent('geocode', {
                          address: result?.attributes.InputAddress,
                          score: result?.attributes.Score,
                        });
                        setViewPoint(
                          new Viewpoint({
                            targetGeometry: result.geometry,
                            scale: 1000,
                          }),
                        );
                        setGraphic(new Graphic(result));
                      },
                      error: () => toast.error('No results found'),
                    }}
                    apiKey={import.meta.env.VITE_UGRC_API}
                    format="esrijson"
                  />
                </ErrorBoundary>
              </div>
              <div className="flex flex-col gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Sherlock
                    onSherlockMatch={(result) => {
                      const first = result[0];
                      if (first === undefined) {
                        return;
                      }

                      logEvent('gnis_search', {
                        gnis: first?.attributes?.name,
                      });
                      setViewPoint(
                        new Viewpoint({
                          targetGeometry: first.geometry,
                          scale: 25000,
                        }),
                      );
                      setGraphic(
                        new Graphic({
                          geometry: first.geometry,
                          attributes: {},
                          symbol: pointSymbol,
                        }),
                      );
                    }}
                    label="Find a GNIS place name"
                    provider={ugrcApiProvider(
                      import.meta.env.VITE_UGRC_API,
                      'location.gnis_place_names',
                      'name',
                      'county',
                    )}
                  />
                </ErrorBoundary>
              </div>
              <div className="flex flex-col gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Sherlock
                    onSherlockMatch={(result) => {
                      const first = result[0];
                      if (first === undefined) {
                        return;
                      }

                      logEvent('city_search', {
                        city: first?.attributes?.name,
                      });

                      if (first.geometry === null) {
                        return;
                      }

                      const polygon = new Polygon(first.geometry);

                      setViewPoint(
                        new Viewpoint({
                          targetGeometry: polygon.extent!.expand(1),
                        }),
                      );
                      setGraphic(
                        new Graphic({
                          geometry: first.geometry,
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
                        }),
                      );
                    }}
                    label="Find a city"
                    provider={ugrcApiProvider(import.meta.env.VITE_UGRC_API, 'boundaries.municipal_boundaries', 'name')}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </Drawer>
          <div className="relative flex flex-1 flex-col rounded border border-b-0 border-zinc-200 dark:border-0 dark:border-zinc-700">
            <div className="relative flex-1 overflow-hidden dark:rounded">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <MapContainer onClick={clickHandler} />
              </ErrorBoundary>
              <Drawer
                type="tray"
                className="shadow-inner dark:shadow-white/20"
                allowFullScreen
                state={trayState}
                {...trayTriggerProps}
              >
                <section className="grid gap-2 px-7 pt-2">
                  <ParcelInformation feature={activeParcel} />
                </section>
              </Drawer>
            </div>
            <SocialMedia />
          </div>
        </section>
      </main>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Footer />
    </>
  );
}
