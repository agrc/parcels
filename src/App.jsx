import esriConfig from "@arcgis/core/config";
import { useEffect, useState } from "react";
import Viewpoint from "@arcgis/core/Viewpoint";
import Polygon from "@arcgis/core/geometry/Polygon";
import { ErrorBoundary } from "react-error-boundary";
import { utahMercatorExtent } from "@ugrc/utilities/hooks";
import { toast } from "react-toastify";
import { MapContainer } from "./MapContainer";
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useOverlayTrigger } from "react-aria";
import { useOverlayTriggerState } from "react-stately";
import { extractCountyAndView } from "./utils";
import { useMap } from "./hooks/useMap";
import { ParcelTypeAhead } from "./PageElements";
import { useHash, useMapZooming, useGraphicManager } from "./hooks";
import {
  Drawer,
  Footer,
  Geocode,
  Header,
  Sherlock,
  SocialMedia,
  ugrcApiProvider,
  UgrcLogo,
} from "@ugrc/utah-design-system";

const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const ErrorFallback = ({ error }) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
};
const pointSymbol = {
  type: "web-style",
  name: "esri-pin-2",
  styleName: "Esri2DPointSymbolsStyle",
};

const defaultAppState = {
  name: "Utah State",
  target: utahMercatorExtent,
};
const version = import.meta.env.PACKAGE_VERSION;
esriConfig.assetsPath = "./assets";
const links = [
  {
    key: "SGID parcels product page",
    action: { url: "https://gis.utah.gov/products/sgid/cadastre/parcels" },
  },
  {
    key: "UGRC homepage",
    action: { url: "https://gis.utah.gov" },
  },
  {
    key: "GitHub repository",
    action: { url: "https://github.com/agrc/parcels" },
  },
  {
    key: `Version ${version} changelog`,
    action: { url: `https://github.com/agrc/parcels/releases/v${version}` },
  },
];

export function App() {
  const { mapView } = useMap();
  const { setGraphic } = useGraphicManager(mapView);
  const { setGeometry } = useMapZooming(mapView);
  const [hash] = useHash();
  const [appConfig, setAppConfig] = useState(defaultAppState);
  useEffect(() => {
    setAppConfig(extractCountyAndView(hash));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sideBarState = useOverlayTriggerState({
    defaultOpen: window.innerWidth >= 768,
  });
  const sideBarTriggerProps = useOverlayTrigger(
    {
      type: "dialog",
    },
    sideBarState,
  );
  const trayState = useOverlayTriggerState({ defaultOpen: false });
  const trayTriggerProps = useOverlayTrigger(
    {
      type: "dialog",
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
                    county={
                      appConfig.name === defaultAppState.name
                        ? ""
                        : appConfig.name
                    }
                    onSuccess={(result) => {
                      const polygon = new Polygon(result.geometry);

                      if (polygon.extent === null) {
                        logEvent(analytics, "parcel_search_no_geometry", {
                          parcel: result?.attributes?.parcel_id,
                          county:
                            appConfig.name === defaultAppState.name
                              ? ""
                              : appConfig.name,
                        });

                        toast.error(
                          "There was no location found for this parcel",
                        );
                        return;
                      }

                      logEvent(analytics, "parcel_search", {
                        parcel: result?.attributes?.parcel_id,
                        county:
                          appConfig.name === defaultAppState.name
                            ? ""
                            : appConfig.name,
                      });

                      setGeometry(polygon.extent.expand(3));
                      setGraphic({
                        geometry: result.geometry,
                        attributes: {},
                        symbol: {
                          type: "simple-fill",
                          style: "solid",
                          color: [170, 170, 170, 0.2],
                          outline: {
                            color: [255, 255, 0],
                            style: "dash-dot",
                            width: 1.5,
                          },
                        },
                      });
                    }}
                  />
                </ErrorBoundary>
              </div>
              <div className="flex flex-col gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Geocode
                    className="mb-4"
                    pointSymbol={pointSymbol}
                    events={{
                      success: (result) => {
                        logEvent(analytics, "geocode", {
                          address: result?.attributes.InputAddress,
                          score: result?.attributes.Score,
                        });
                        setGeometry(
                          new Viewpoint({
                            targetGeometry: result.geometry,
                            scale: 1000,
                          }),
                        );
                        setGraphic(result);
                      },
                      error: () => toast.error("No results found"),
                    }}
                    apiKey={import.meta.env.VITE_API_KEY}
                    format="esrijson"
                  >
                    <div className="text-lg font-semibold">Find an address</div>
                  </Geocode>
                </ErrorBoundary>
              </div>
              <div className="flex flex-col gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Sherlock
                    onSherlockMatch={(result) => {
                      logEvent(analytics, "gnis_search", {
                        gnis: result?.attributes?.name,
                      });
                      setGeometry(
                        new Viewpoint({
                          targetGeometry: result.geometry,
                          scale: 25000,
                        }),
                      );
                      setGraphic({
                        geometry: result.geometry,
                        attributes: {},
                        symbol: pointSymbol,
                      });
                    }}
                    label="Find a GNIS place name"
                    provider={ugrcApiProvider(
                      import.meta.env.VITE_API_KEY,
                      "location.gnis_place_names",
                      "name",
                    )}
                  />
                </ErrorBoundary>
              </div>
              <div className="flex flex-col gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Sherlock
                    onSherlockMatch={(result) => {
                      logEvent(analytics, "city_search", {
                        city: result?.attributes?.name,
                      });
                      const polygon = new Polygon(result.geometry);

                      setGeometry(polygon.extent.expand(1));
                      setGraphic({
                        geometry: result.geometry,
                        attributes: {},
                        symbol: {
                          type: "simple-fill",
                          style: "solid",
                          color: [170, 170, 170, 0.2],
                          outline: {
                            color: [255, 255, 0],
                            style: "dash-dot",
                            width: 1.5,
                          },
                        },
                      });
                    }}
                    label="Find a city"
                    provider={ugrcApiProvider(
                      import.meta.env.VITE_API_KEY,
                      "boundaries.municipal_boundaries",
                      "name",
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
