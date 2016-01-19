var windows = 'Windows 8.1';
var browsers = [{
    browserName: 'Safari',
    platform: 'OS X 10.11'
}, {
    browserName: 'Firefox',
    platform: windows
}, {
    browserName: 'Chrome',
    platform: windows
}, {
    browserName: 'Internet Explorer',
    platform: windows,
    version: '11.0'
}];
define({
    proxyPort: 9000,
    proxyUrl: 'http://localhost:9000/',
    environments: browsers,
    environmentRetries: 10,
    maxConcurrency: 5,
    tunnel: 'SauceLabsTunnel',
    loaderOptions: {
        packages: [{ name: 'agrc', location: 'src/agrc' },
        { name: 'app', location: 'src/app' },
        { name: 'dgauges', location: 'src/dgauges' },
        { name: 'dgrid', location: 'src/dgrid' },
        { name: 'dijit', location: 'src/dijit' },
        { name: 'dojo', location: 'src/dojo' },
        { name: 'dojox', location: 'src/dojox' },
        { name: 'esri', location: 'src/esri' },
        { name: 'ijit', location: 'src/ijit' },
        { name: 'layer-selector', location: 'src/layer-selector' },
        { name: 'put-selector', location: 'src/put-selector' },
        { name: 'xstyle', location: 'src/xstyle' },
        {
            name: 'bootstrap',
            location: 'src/bootstrap',
            main: 'dist/js/bootstrap'
        }, {
            name: 'jquery',
            location: 'src/jquery/dist',
            main: 'jquery'
        }, {
            name: 'ladda',
            location: 'src/ladda-bootstrap',
            main: 'dist/ladda'
        }, {
            name: 'mustache',
            location: 'src/mustache',
            main: 'mustache'
        }, {
            name: 'proj4',
            location: 'src/proj4',
            main: 'dist/proj4'
        }, {
            name: 'spin',
            location: 'src/spinjs',
            main: 'spin'
        }, {
            name: 'stubmodule',
            location: './stubmodule',
            main: 'src/stub-module'
        }]
    },
    suites: [
        'tests/unit/App',
        'tests/unit/Identify',
        'tests/unit/FindParcel'
    ],
    functionalSuites: [],
    excludeInstrumentation: /^(?!src\/app).*\//
});
