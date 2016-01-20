module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('intern');

    var otherFiles = [
        'src/app/**/*.html',
        'src/app/**/*.css',
        'src/index.html',
        'src/ChangeLog.html',
        'tests/**/*.js'
    ];
    var jsFiles = [
        'src/app/**/*.js',
        'profiles/*.js',
        'GruntFile.js'
    ];
    var bumpFiles = [
        'package.json',
        'bower.json',
        'src/app/package.json',
        'src/app/config.js'
    ];
    var deployFiles = [
        '**',
        '!**/*.uncompressed.js',
        '!**/*consoleStripped.js',
        '!**/bootstrap/less/**',
        '!**/bootstrap/test-infra/**',
        '!**/tests/**',
        '!build-report.txt',
        '!components-jasmine/**',
        '!favico.js/**',
        '!jasmine-favicon-reporter/**',
        '!jasmine-jsreporter/**',
        '!stubmodule/**',
        '!util/**'
    ];
    var deployDir = 'Parcels';
    var secrets;
    var sauceConfig = {};
    try {
        secrets = grunt.file.readJSON('secrets.json');
        sauceConfig.username = secrets.sauce_name;
        sauceConfig.key = secrets.sauce_key;
    } catch (e) {
        // swallow for build server
        secrets = {
            stage: {
                host: '',
                username: '',
                password: ''
            },
            prod: {
                host: '',
                username: '',
                password: ''
            }
        };
    }

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bump: {
            options: {
                files: bumpFiles,
                commitFiles: bumpFiles.concat('src/ChangeLog.html'),
                push: false
            }
        },
        clean: {
            build: ['dist'],
            deploy: ['deploy']
        },
        compress: {
            main: {
                options: {
                    archive: 'deploy/deploy.zip'
                },
                files: [{
                    src: deployFiles,
                    dest: './',
                    cwd: 'dist/',
                    expand: true
                }]
            }
        },
        connect: {
            intern: {
                options: {
                    livereload: true,
                    port: 8000,
                    base: '.'
                }
            }
        },
        copy: {
            main: {
                files: [{expand: true, cwd: 'src/', src: ['*.html'], dest: 'dist/'}]
            }
        },
        dojo: {
            prod: {
                options: {
                    // You can also specify options to be used in all your tasks
                    profiles: ['profiles/prod.build.profile.js', 'profiles/build.profile.js'] // Profile for build
                }
            },
            stage: {
                options: {
                    // You can also specify options to be used in all your tasks
                    profiles: ['profiles/stage.build.profile.js', 'profiles/build.profile.js'] // Profile for build
                }
            },
            options: {
                // You can also specify options to be used in all your tasks
                dojo: 'src/dojo/dojo.js', // Path to dojo.js file in dojo source
                load: 'build', // Optional: Utility to bootstrap (Default: 'build')
                releaseDir: '../dist',
                requires: ['src/app/packages.js', 'src/app/run.js'], // Optional: Module to require for the build (Default: nothing)
                basePath: './src'
            }
        },
        eslint: {
            options: {
                configFile: '.eslintrc'
            },
            main: {
                src: jsFiles
            }
        },
        imagemin: {
            main: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    // exclude tests because some images in dojox throw errors
                    src: ['**/*.{png,jpg,gif}', '!**/tests/**/*.*'],
                    dest: 'src/'
                }]
            }
        },
        intern: {
            main: {
                options: {
                    runType: 'runner',
                    config: 'tests/intern',
                    reporters: ['Runner'],
                    suites: [
                        'tests/all'
                    ],
                    sauceUsername: sauceConfig.username,
                    sauceAccessKey: sauceConfig.key
                }
            }
        },
        open: {
            tests: {
                path: 'http://localhost:8000/node_modules/intern/client.html?config=tests/intern'
            }
        },
        processhtml: {
            options: {},
            main: {
                files: {
                    'dist/index.html': ['src/index.html'],
                    'dist/user_admin.html': ['src/user_admin.html']
                }
            }
        },
        secrets: secrets,
        sftp: {
            options: {
                path: './wwwroot/' + deployDir + '/',
                srcBasePath: 'deploy/',
                showProgress: true,
                readyTimeout: 3000
            },
            stage: {
                files: {
                    './': 'deploy/deploy.zip'
                },
                options: {
                    host: '<%= secrets.stage.host %>',
                    username: '<%= secrets.stage.username %>',
                    password: '<%= secrets.stage.password %>'
                }
            },
            prod: {
                files: {
                    './': 'deploy/deploy.zip'
                },
                options: {
                    host: '<%= secrets.prod.host %>',
                    username: '<%= secrets.prod.username %>',
                    password: '<%= secrets.prod.password %>'
                }
            }
        },
        sshexec: {
            options: {
                readyTimeout: 3000
            },
            stage: {
                command: ['cd wwwroot/' + deployDir, 'unzip -oq deploy.zip', 'rm deploy.zip'].join(';'),
                options: {
                    host: '<%= secrets.stage.host %>',
                    username: '<%= secrets.stage.username %>',
                    password: '<%= secrets.stage.password %>'
                }
            },
            prod: {
                command: ['cd wwwroot/' + deployDir, 'unzip -oq deploy.zip', 'rm deploy.zip'].join(';'),
                options: {
                    host: '<%= secrets.prod.host %>',
                    username: '<%= secrets.prod.username %>',
                    password: '<%= secrets.prod.password %>'
                }
            }
        },
        stylus: {
            main: {
                options: {
                    compress: false,
                    'resolve url': true
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['app/**/*.styl'],
                    dest: 'src/',
                    ext: '.css'
                }]
            }
        },
        watch: {
            options: {
                livereload: true
            },
            eslint: {
                files: jsFiles,
                tasks: ['newer:eslint:main']
            },
            src: {
                files: jsFiles.concat(otherFiles),
                options: {
                    livereload: true
                }
            },
            stylus: {
                files: 'src/app/**/*.styl',
                tasks: ['stylus']
            }
        }
    });

    grunt.registerTask('default', [
        'eslint:main',
        'stylus',
        'connect:intern',
        'watch'
    ]);
    grunt.registerTask('launch', [
        'eslint:main',
        'stylus',
        'connect:intern',
        'open:tests',
        'watch'
    ]);
    grunt.registerTask('build-prod', [
        'eslint:main',
        'clean:build',
        'newer:imagemin:main',
        'stylus',
        'dojo:prod',
        'copy:main',
        'processhtml:main'
    ]);
    grunt.registerTask('deploy-prod', [
        'clean:deploy',
        'compress:main',
        'sftp:prod',
        'sshexec:prod'
    ]);
    grunt.registerTask('build-stage', [
        'eslint:main',
        'clean:build',
        'newer:imagemin:main',
        'stylus',
        'dojo:stage',
        'copy:main',
        'processhtml:main'
    ]);
    grunt.registerTask('deploy-stage', [
        'clean:deploy',
        'compress:main',
        'sftp:stage',
        'sshexec:stage'
    ]);
    grunt.registerTask('travis', [
        'eslint:main',
        'intern:main',
        'build-prod'
    ]);
};
