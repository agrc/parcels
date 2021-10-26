import ky from 'ky';
import sortBy from 'lodash.sortby';

class ProviderBase {
  getOutFields(outFields, searchField, contextField) {
    outFields = outFields || [];

    // don't mess with '*'
    if (outFields[0] === '*') {
      return outFields;
    }

    const addField = (fld) => {
      if (fld && outFields.indexOf(fld) === -1) {
        outFields.push(fld);
      }
    };

    addField(searchField);
    addField(contextField);

    return outFields;
  }

  getSearchClause(text) {
    return `UPPER(${this.searchField}) LIKE UPPER('%${text}%')`;
  }

  getFeatureClause(searchValue, contextValue) {
    let statement = `${this.searchField}='${searchValue}'`;

    if (this.contextField) {
      if (contextValue && contextValue.length > 0) {
        statement += ` AND ${this.contextField}='${contextValue}'`;
      } else {
        statement += ` AND ${this.contextField} IS NULL`;
      }
    }

    return statement;
  }
}

/*
  options: {wkid, outFields, contextField}
*/
class WebApiProvider extends ProviderBase {
  constructor(apiKey, searchLayer, searchField, options) {
    super();

    const defaultWkid = 3857;

    this.searchLayer = searchLayer;
    this.searchField = searchField;

    const outFields = options?.outFields ?? [];
    this.contextField = options?.contextField;
    this.wkid = options?.wkid ?? defaultWkid;

    this.outFields = this.getOutFields(outFields.concat(['xid']), this.searchField, this.contextField);

    this.webApi = new WebApi(apiKey);
  }

  async search(searchString, maxResults) {
    var items = await this.webApi.search(this.searchLayer, this.outFields, {
      predicate: this.getSearchClause(searchString),
      spatialReference: this.wkid,
    });

    return {
      items: sortBy(items.slice(0, maxResults), this.itemToString.bind(this)),
      limitExceeded: items.length > maxResults,
    };
  }

  async getFeature(selectedItem, contextValue) {
    const results = await this.webApi.search(this.searchLayer, this.outFields.concat('shape@'), {
      predicate: `xid=${selectedItem.attributes.xid}`,
      spatialReference: this.wkid,
    });

    if (results.length) {
      return results[0];
    }

    throw new Error(`No feature found for xid: ${selectedItem.attributes.xid}`);
  }

  itemToString(item) {
    if (item === null) {
      return '';
    }

    return item.attributes[this.searchField];
  }
}

class WebApi {
  constructor(apiKey) {
    this.baseUrl = 'https://api.mapserv.utah.gov/api/v1/';

    // defaultAttributeStyle: String
    this.defaultAttributeStyle = 'identical';

    // xhrProvider: dojo/request/* provider
    //      The current provider as determined by the search function
    this.xhrProvider = null;

    // Properties to be sent into constructor

    // apiKey: String
    //      web api key (http://developer.mapserv.utah.gov/AccountAccess)
    this.apiKey = apiKey;
  }

  async search(featureClass, returnValues, options) {
    // summary:
    //      search service wrapper (http://api.mapserv.utah.gov/#search)
    // featureClass: String
    //      Fully qualified feature class name eg: SGID10.Boundaries.Counties
    // returnValues: String[]
    //      A list of attributes to return eg: ['NAME', 'FIPS'].
    //      To include the geometry use the shape@ token or if you want the
    //      envelope use the shape@envelope token.
    // options.predicate: String
    //      Search criteria for finding specific features in featureClass.
    //      Any valid ArcObjects where clause will work. If omitted, a TSQL *
    //      will be used instead. eg: NAME LIKE 'K%'
    // options.geometry: String (not fully implemented)
    //      The point geometry used for spatial queries. Points are denoted as
    //      'point:[x,y]'.
    // options.spatialReference: Number
    //      The spatial reference of the input geographic coordinate pair.
    //      Choose any of the wkid's from the Geographic Coordinate System wkid reference
    //      or Projected Coordinate System wkid reference. 26912 is the default.
    // options.tolerance: Number (not implemented)
    // options.spatialRelation: String (default: 'intersect')
    // options.buffer: Number
    //      A distance in meters to buffer the input geometry.
    //      2000 meters is the maximum buffer.
    // options.pageSize: Number (not implemented)
    // options.skip: Number (not implemented)
    // options.attributeStyle: String (defaults to 'identical')
    //      Controls the casing of the attributes that are returned.
    //      Options:
    //
    //      'identical': as is in data.
    //      'upper': upper cases all attribute names.
    //      'lower': lower cases all attribute names.
    //      'camel': camel cases all attribute names
    //
    // returns: Promise
    var url = `${featureClass}/${returnValues.join(',')}`;

    if (!options) {
      options = {};
    }

    options.apiKey = this.apiKey;
    if (!options.attributeStyle) {
      options.attributeStyle = this.defaultAttributeStyle;
    }

    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    const response = await ky.get(url, {
      searchParams: options,
      signal: this.abortController.signal,
      prefixUrl: `${this.baseUrl}search/`,
    });

    if (!response.ok) {
      throw Error(response.message || response.statusText);
    }

    const result = await response.json();

    if (result.status !== 200) {
      throw Error(result.message);
    }

    return result.result;
  }
}

export { WebApiProvider };
