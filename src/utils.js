import { utahMercatorExtent } from "@ugrc/utilities/hooks";
import Viewpoint from "@arcgis/core/Viewpoint";
import extents from "./extents";

const defaultAppState = {
  name: "Utah State",
  target: utahMercatorExtent,
};

const analytics = {};
const logEvent = () => { };

export function extractCountyAndView(hash) {
  if (hash === "" || hash === "#") {
    return defaultAppState;
  }

  const symbolLength = 1;
  const section = hash.indexOf("/");

  let countyName = "";
  if (section === -1) {
    countyName = hash.substring(symbolLength).replace(/\+|%20/g, " ");
  } else {
    countyName = hash.substring(symbolLength, section).replace(/\+|%20/g, " ");
  }

  if (hash.includes("/location/")) {
    const [x, y, scale] = hash.substring(hash.lastIndexOf("/") + 1).split(",");

    if (countyName !== defaultAppState.name) {
      logEvent(analytics, "county_view", {
        county: countyName || defaultAppState.name,
      });
    }

    logEvent(analytics, "deep_link");

    return {
      name: countyName || defaultAppState.name,
      target: Viewpoint({
        targetGeometry: {
          type: "point",
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

  if (state.name !== defaultAppState.name) {
    logEvent(analytics, "county_view", {
      county: state.name,
    });
  }

  return state;
}
