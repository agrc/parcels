define({
    loaders: {
        'host-node': 'dojo/dojo',
        'host-browser': 'node_modules/dojo/dojo.js'
    },
    loaderOptions: {
        packages: [
            'agrc',
            'app',
            'dgauges',
            'dgrid',
            'dijit',
            'dojo',
            'dojox',
            'esri',
            'ijit',
            'layer-selector',
            'put-selector',
            'xstyle',
            {
                name: 'bootstrap',
                location: './bootstrap',
                main: 'dist/js/bootstrap'
            }, {
                name: 'jquery',
                location: './jquery/dist',
                main: 'jquery'
            }, {
                name: 'ladda',
                location: './ladda-bootstrap',
                main: 'dist/ladda'
            }, {
                name: 'mustache',
                location: './mustache',
                main: 'mustache'
            }, {
                name: 'proj4',
                location: './proj4',
                main: 'dist/proj4'
            }, {
                name: 'spin',
                location: './spinjs',
                main: 'spin'
            }, {
                name: 'stubmodule',
                location: './stubmodule',
                main: 'src/stub-module'
            }
        ]
    },
    suites: ['SpecApp'],
    functionalSuites: [],
    excludeInstrumentation: /^tests|js\/lib\/*|node_modules\//
});