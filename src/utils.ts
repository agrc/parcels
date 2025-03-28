import Point from '@arcgis/core/geometry/Point';
import Viewpoint from '@arcgis/core/Viewpoint';
import { utahMercatorExtent } from '@ugrc/utilities/hooks';
import extents from './extents';

export type AppState = {
  name: string;
  target: typeof utahMercatorExtent | Viewpoint;
};

const defaultAppState: AppState = {
  name: 'Utah State',
  target: utahMercatorExtent,
};

export function extractCountyAndView(hash: string) {
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
    const [xStr, yStr, scaleStr] = hash.substring(hash.lastIndexOf('/') + 1).split(',');

    // Convert string values to numbers
    const x = Number(xStr);
    const y = Number(yStr);
    const scale = Number(scaleStr);

    // if (countyName !== defaultAppState.name) {
    // logEvent('county_view', {
    //   county: countyName || defaultAppState.name,
    // });
    // }

    // logEvent('deep_link');

    return {
      name: countyName || defaultAppState.name,
      target: new Viewpoint({
        targetGeometry: new Point({
          x,
          y,
          spatialReference: { wkid: 3857 },
        }),
        scale,
      }),
    };
  }

  const county = extents.filter((item) => item.name === countyName);
  const state: AppState = county.length > 0 ? (county[0] ?? defaultAppState) : defaultAppState;

  // if (state.name !== defaultAppState.name) {
  //   logEvent(analytics, 'county_view', {
  //     county: state.name,
  //   });
  // }

  return state;
}
