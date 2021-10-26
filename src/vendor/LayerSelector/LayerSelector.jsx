import { useState, useEffect, useRef } from 'react';
import Basemap from '@arcgis/core/Basemap';
import LOD from '@arcgis/core/layers/support/LOD';
import TileInfo from '@arcgis/core/layers/support/TileInfo';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import WebTileLayer from '@arcgis/core/layers/WebTileLayer';
import classNames from 'clsx';
import PropTypes from 'prop-types';
import { createDefaultTileInfo } from './TileInfo';
import { setTileInfosForApplianceLayers } from './Discover';
import './LayerSelector.css';
import icon from './layers.svg';

const ExpandableContainer = (props) => {
  const [expanded, setExpanded] = useState(props.expanded);

  const imageClasses = classNames('layer-selector__toggle', { 'layer-selector--hidden': expanded });

  const fromClasses = classNames({ 'layer-selector--hidden': !expanded });

  return (
    <div
      className="layer-selector"
      onMouseOver={() => setExpanded(true)}
      onFocus={() => setExpanded(true)}
      onMouseOut={() => setExpanded(false)}
      onBlur={() => setExpanded(false)}
      area-haspopup="true"
    >
      <input type="image" className={imageClasses} src={icon} alt="layers" />
      <form className={fromClasses}>{props.children}</form>
    </div>
  );
};

const LayerSelectorItem = (props) => {
  const inputOptions = {
    type: props.layerType === 'baselayer' ? 'radio' : 'checkbox',
    name: props.layerType,
    value: props.id,
  };

  return (
    <div className="layer-selector-item radio checkbox">
      <label className="layer-selector--item">
        <input
          className="layer-selector-item-input"
          {...inputOptions}
          checked={props.selected}
          onChange={(event) => props.onChange(event, props)}
        />
        {inputOptions.value}
      </label>
    </div>
  );
};

const imageryAttributionJsonUrl = 'https://mapserv.utah.gov/cdn/attribution/imagery.json';

/**
 * Takes layer tokens from `applianceLayers` keys and resolves them to `layerFactory` objects with
 * `esri/layer/WebTiledLayer` factories.
 * @private
 * @param {string} layerType - the type of layer `overlay` or `baselayer`.
 * @param {string[]|layerFactory[]} layerFactories - An array of layer tokens or layer factories.
 * @returns {layerFactory[]} an array of resolved layer Factory objects.
 */
const createLayerFactories = (layerType, layerFactories, WebTiledLayer, quadWord, applianceLayers) => {
  const resolvedInfos = [];
  layerFactories.forEach((li) => {
    if (
      typeof li === 'string' ||
      li instanceof String ||
      li.token ||
      typeof li.token === 'string' ||
      li.token instanceof String
    ) {
      const id = li.token || li;

      if (!quadWord) {
        console.warn(
          'layer-selector::You chose to use a layer token `' +
            id +
            '` without setting ' +
            'your `quadWord` from Discover. The requests for tiles will fail to ' +
            ' authenticate. Pass `quadWord` into the constructor of this widget.'
        );

        return false;
      }

      var layer = applianceLayers[id];

      if (!layer) {
        console.warn(
          'layer-selector::The layer token `' +
            id +
            '` was not found. Please use one of ' +
            'the supported tokens (' +
            Object.keys(applianceLayers).join(', ') +
            ') or pass in the information on how to create your custom layer ' +
            '(`{Factory, url, id}`).'
        );

        return false;
      }

      const linked = [layer.linked, li.linked].reduce((acc, value, index) => {
        if (value) {
          acc = acc.concat(value);
        }

        if (index === 1 && acc.length === 0) {
          return null;
        }

        return acc;
      }, []);

      resolvedInfos.push({
        Factory: WebTiledLayer,
        urlTemplate: layer.urlPattern,
        linked,
        id,
        selected: !!li.selected,
        copyright: layer.copyright,
        layerType,
        // TODO: not supported in 4.x WebTileLayer copyright
        // hasAttributionData: layer.hasAttributionData,
        // attributionDataUrl: layer.attributionDataUrl
      });
    } else {
      if (!Object.prototype.hasOwnProperty.call(li, 'layerType')) {
        li.layerType = layerType;
      }

      if (!li.selected) {
        li.selected = false;
      }

      resolvedInfos.push(li);
    }
  });

  return resolvedInfos;
};

const ConditionalWrapper = ({ condition, wrapper, children }) => (condition ? wrapper(children) : children);
const LayerSelector = (props) => {
  const [layers, setLayers] = useState({
    baseLayers: [],
    overlays: [],
  });
  const [linkedLayers, setLinkedLayers] = useState([]);
  const [managedLayers, setManagedLayers] = useState({});
  const selectorNode = useRef();

  useEffect(() => {
    const managedLayersDraft = { ...managedLayers };
    const layerItems = layers.baseLayers.concat(layers.overlays);

    layerItems.forEach((layerItem) => {
      let layerList = null;
      switch (layerItem.layerType) {
        case 'baselayer':
          if (!props.view.map.basemap?.baseLayers) {
            props.view.map.basemap = {
              baseLayers: [],
              id: 'layer-selector',
              title: 'layer-selector',
            };
          }

          layerList = props.view.map.basemap.baseLayers;
          break;
        case 'overlay':
          layerList = props.view.map.layers;
          break;
        default:
          break;
      }

      if (layerItem.selected === false) {
        var managedLayer = managedLayersDraft[layerItem.id] || {};
        if (!managedLayer.layer) {
          managedLayer.layer = layerList.getItemAt(layerList.indexOf(layerItem.layer));
        }

        if (managedLayer.layer) {
          layerList.remove(managedLayer.layer);
        }

        return;
      }

      if (Object.keys(managedLayersDraft).indexOf(layerItem.id) < 0) {
        managedLayersDraft[layerItem.id] = {
          layerType: layerItem.layerType,
        };
      }

      if (!managedLayersDraft[layerItem.id].layer) {
        if (typeof layerItem.Factory === 'string') {
          console.log(layerItem.Factory);
          switch (layerItem.Factory) {
            case 'esri/layers/WebTiledLayer':
              layerItem.Factory = WebTileLayer;
              break;
            case 'esri/layers/MapImageLayer':
              layerItem.Factory = FeatureLayer;
              break;
          }
        }
        managedLayersDraft[layerItem.id].layer = new layerItem.Factory(layerItem);
      }

      if (layerItem.selected === true) {
        if (!layerList.includes(managedLayersDraft[layerItem.id].layer)) {
          layerList.add(managedLayersDraft[layerItem.id].layer);
        }
      } else {
        layerList.remove(managedLayersDraft[layerItem.id].layer);
      }

      // When you set the zoom on a map view without a cached layer, it has no effect on the scale of the map.
      // This is a hack to re-apply the zoom after adding the first cached layer. This works because the
      // map view is an observable
      managedLayersDraft[layerItem.id].layer.when('loaded', () => {
        const currentScale = managedLayersDraft[layerItem.id].layer.tileInfo.lods[props.view.zoom].scale;
        if (props.view.zoom > -1 && props.view.scale !== currentScale) {
          // eslint-disable-next-line no-self-assign
          props.view.zoom = props.view.zoom;
        }
      });

      setManagedLayers(managedLayersDraft);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  useEffect(() => {
    if (!props.baseLayers || props.baseLayers.length < 1) {
      console.warn(
        'layer-selector::`baseLayers` is null or empty. Make sure you have spelled it correctly ' +
          'and are passing it into the constructor of this widget.'
      );

      return;
    }
  }, [props.baseLayers]);

  useEffect(() => {
    const applianceLayerTemplates = {
      Imagery: {
        urlPattern: `https://discover.agrc.utah.gov/login/path/${props.quadWord}/tiles/utah/{level}/{col}/{row}`,
        hasAttributionData: true,
        copyright: 'Hexagon',
        attributionDataUrl: imageryAttributionJsonUrl,
      },
      Topo: {
        urlPattern: `https://discover.agrc.utah.gov/login/path/${props.quadWord}/tiles/topo_basemap/{level}/{col}/{row}`,
        copyright: 'UGRC',
      },
      Terrain: {
        urlPattern: `https://discover.agrc.utah.gov/login/path/${props.quadWord}/tiles/terrain_basemap/{level}/{col}/{row}`,
        copyright: 'UGRC',
      },
      Lite: {
        urlPattern: `https://discover.agrc.utah.gov/login/path/${props.quadWord}/tiles/lite_basemap/{level}/{col}/{row}`,
        copyright: 'UGRC',
      },
      'Color IR': {
        urlPattern: `https://discover.agrc.utah.gov/login/path/${props.quadWord}/tiles/naip_2018_nrg/{level}/{col}/{row}`,
        copyright: 'UGRC',
      },
      Hybrid: {
        urlPattern: `https://discover.agrc.utah.gov/login/path/${props.quadWord}/tiles/utah/{level}/{col}/{row}`,
        linked: ['Overlay'],
        copyright: 'Hexagon, UGRC',
        hasAttributionData: true,
        attributionDataUrl: imageryAttributionJsonUrl,
      },
      Overlay: {
        urlPattern: `https://discover.agrc.utah.gov/login/path/${props.quadWord}/tiles/overlay_basemap/{level}/{col}/{row}`,
        // no attribution for overlay layers since it just duplicates the base map attribution
      },
      'Address Points': {
        urlPattern: `https://discover.agrc.utah.gov/login/path/${props.quadWord}/tiles/address_points_basemap/{level}/{col}/{row}`,
      },
    };

    props.view.map.basemap = new Basemap();

    const defaultTileInfo = createDefaultTileInfo(LOD);
    const applianceLayers = setTileInfosForApplianceLayers(applianceLayerTemplates, defaultTileInfo, TileInfo);

    const baseLayers =
      createLayerFactories('baselayer', props.baseLayers, WebTileLayer, props.quadWord, applianceLayers) || [];
    let overlays = props.overlays || [];

    let hasDefaultSelection = false;
    let defaultSelection = null;
    let hasHybrid = false;
    let linkedLayersBuilder = [];

    baseLayers.forEach((layer) => {
      if (layer.selected === true) {
        hasDefaultSelection = true;
        defaultSelection = layer;
      }

      if ((layer.id || layer.token) === 'Hybrid') {
        hasHybrid = true;
      }

      if (layer.linked) {
        linkedLayersBuilder = linkedLayersBuilder.concat(layer.linked);
      }
    });
    setLinkedLayers(linkedLayersBuilder);

    // set default basemap to index 0 if not specified by the user
    if (!hasDefaultSelection && baseLayers.length > 0) {
      baseLayers[0].selected = true;
      defaultSelection = baseLayers[0];
    }

    // insert overlay to first spot because hybrid
    if (hasHybrid) {
      overlays.splice(0, 0, 'Overlay');
    }

    overlays = createLayerFactories('overlay', overlays, WebTileLayer, props.quadWord, applianceLayers) || [];

    // set visibility of linked layers to match
    if (defaultSelection.linked && defaultSelection.linked.length > 0) {
      overlays.forEach((layer) => {
        if (defaultSelection.linked.includes(layer.id)) {
          layer.selected = true;
        }
      });
    }

    setLayers({
      baseLayers,
      overlays,
    });

    props.view.ui.add(selectorNode.current, props.position);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onItemChanged = (event, props) => {
    const overlays = layers.overlays;
    const baseLayers = layers.baseLayers;

    if (props.layerType === 'baselayer') {
      baseLayers.forEach((item) => {
        item.selected = item.id === props.id ? event.target.checked : false;
      });

      const selectedItem = baseLayers.filter((layer) => layer.selected)[0];

      overlays.forEach((item) => {
        if (linkedLayers.includes(item.id)) {
          item.selected = false;
        }
      });

      if (selectedItem.linked && selectedItem.linked.length > 0) {
        overlays.forEach((item) => {
          if (selectedItem.linked.includes(item.id)) {
            item.selected = true;
          }

          return item;
        });
      }
    } else if (props.layerType === 'overlay') {
      overlays.forEach((item) => {
        if (item.id === props.id) {
          item.selected = event.target.checked;
        }
      });
    }

    setLayers({
      overlays,
      baseLayers,
    });
  };

  return (
    <div ref={selectorNode}>
      <ConditionalWrapper
        condition={props.makeExpandable}
        wrapper={(children) => <ExpandableContainer>{children}</ExpandableContainer>}
      >
        <div className="layer-selector--layers">
          {layers.baseLayers.map((item, index) => (
            <LayerSelectorItem
              id={item.name || item.id || 'unknown'}
              layerType="baselayer"
              selected={item.selected}
              onChange={onItemChanged}
              key={index}
            />
          ))}
          <hr className="layer-selector-separator" />
          {layers.overlays.map((item) => (
            <LayerSelectorItem
              id={item.name || item.id || 'unknown'}
              layerType="overlay"
              selected={item.selected}
              onChange={onItemChanged}
              key={item.id || item}
            />
          ))}
        </div>
      </ConditionalWrapper>
    </div>
  );
};

LayerSelector.propTypes = {
  view: PropTypes.object.isRequired,
  quadWord: PropTypes.string,
  baseLayers: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.oneOf(['Hybrid', 'Lite', 'Terrain', 'Topo', 'Color IR', 'Address Points', 'Overlay', 'Imagery']),
      PropTypes.shape({
        Factory: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
        urlTemplate: PropTypes.string,
        url: PropTypes.string,
        id: PropTypes.string.isRequired,
        tileInfo: PropTypes.object,
        linked: PropTypes.arrayOf(PropTypes.string),
      }),
      PropTypes.shape({
        token: PropTypes.oneOf(['Hybrid', 'Lite', 'Terrain', 'Topo', 'Color IR', 'Address Points', 'Overlay'])
          .isRequired,
        selected: PropTypes.bool,
        linked: PropTypes.arrayOf(PropTypes.string),
      }),
    ])
  ).isRequired,
  overlays: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.oneOf(['Address Points', 'Overlay']),
      PropTypes.shape({
        Factory: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
        urlTemplate: PropTypes.string,
        url: PropTypes.string,
        id: PropTypes.string.isRequired,
        tileInfo: PropTypes.object,
        linked: PropTypes.arrayOf(PropTypes.string),
      }),
    ])
  ),
  position: PropTypes.oneOf([
    'bottom-leading',
    'bottom-left',
    'bottom-right',
    'bottom-trailing',
    'top-leading',
    'top-left',
    'top-right',
    'top-trailing',
  ]),
  makeExpandable: PropTypes.bool,
};

LayerSelector.defaultProps = {
  makeExpandable: true,
  position: 'top-right',
};

LayerSelectorItem.propTypes = {
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  layerType: PropTypes.oneOf(['baselayer', 'overlay']).isRequired,
  id: PropTypes.string.isRequired,
};

export { ExpandableContainer, LayerSelectorItem };
export default LayerSelector;
