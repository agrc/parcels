import Graphic from '@arcgis/core/Graphic';
import Viewpoint from '@arcgis/core/Viewpoint';
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
import { useEffect, useState } from 'react';
import { useOverlayTrigger } from 'react-aria';
import { ErrorBoundary } from 'react-error-boundary';
import { useOverlayTriggerState } from 'react-stately';
import { toast } from 'react-toastify';
import { MapContainer } from './MapContainer';
import { ParcelTypeAhead } from './PageElements';
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
} as __esri.WebStyleSymbolProperties;

const defaultAppState = {
  name: 'Utah State',
  target: utahMercatorExtent,
};
const version = import.meta.env.PACKAGE_VERSION;
const links = [
  {
    key: 'SGID parcels product page',
    action: { url: 'https://gis.utah.gov/products/sgid/cadastre/parcels' },
  },
  {
    key: 'UGRC homepage',
    action: { url: 'https://gis.utah.gov' },
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
  const { mapView } = useMap();
  const logEvent = useFirebaseAnalytics();
  const { setGraphic } = useGraphicManager(mapView);
  const { setViewPoint } = useViewPointZooming(mapView!);
  const { hash } = useHash();
  const [appConfig, setAppConfig] = useState<AppState>(defaultAppState);

  useEffect(() => {
    setAppConfig(extractCountyAndView(hash));
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

  return (
    <>
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
                    onSuccess={(result: any) => {
                      const polygon = new Polygon(result.geometry);

                      if (polygon.extent === null) {
                        logEvent('parcel_search_no_geometry', {
                          parcel: result?.attributes?.parcel_id,
                          county: appConfig.name === defaultAppState.name ? '' : appConfig.name,
                        });

                        toast.error('There was no location found for this parcel');

                        return;
                      }

                      logEvent('parcel_search', {
                        parcel: result?.attributes?.parcel_id,
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
                      console.log('result', result);
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
                    provider={ugrcApiProvider(
                      import.meta.env.VITE_UGRC_API,
                      'boundaries.municipal_boundaries',
                      'name',
                      'countynbr',
                    )}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </Drawer>
          <div className="relative flex flex-1 flex-col rounded border border-b-0 border-zinc-200 dark:border-0 dark:border-zinc-700">
            <div className="relative flex-1 overflow-hidden dark:rounded">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <MapContainer />
              </ErrorBoundary>
              <Drawer
                type="tray"
                className="shadow-inner dark:shadow-white/20"
                allowFullScreen
                state={trayState}
                {...trayTriggerProps}
              >
                <section className="grid gap-2 px-7 pt-2">
                  <h2 className="text-center">What&#39;s here?</h2>
                  {/* <IdentifyInformation apiKey={apiKey} location={initialIdentifyLocation} /> */}
                </section>
              </Drawer>
            </div>
            <SocialMedia />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
