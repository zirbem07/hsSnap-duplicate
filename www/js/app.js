// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
var app = angular.module('hcSnap', ['ionic', 'ionic.cloud', 'starter.controllers', 'starter.services', 'ionic-material', 'ionic-toast',  'ngCordova', 'ngResource'])

app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    
  });
})

app.config(function($stateProvider, $urlRouterProvider, $sceDelegateProvider, $ionicCloudProvider) {

    $ionicCloudProvider.init({
        "core": {
          "app_id": "837bbe79"
        },
        "push": {
          "sender_id": "225122598147",
          "pluginConfig": {
            "ios": {
              "badge": true,
              "sound": true
            },
            "android": {
              "iconColor": "#343434"
            }
          }
        }
      });

  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    'self',
    // Allow loading from our assets domain.  Notice the difference between * and **.

    'http://hchep.com**',

    'http://healthconnection.io**',

    'https://s3.us-east-2.amazonaws.com/ptmylibrary/**'

  ]);

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
    })

    .state('app.login', {
        url: '/login',
        views: {
            'menuContent': {
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            },
            'fabContent': {
                template: '',
            }
        },

    })

    .state('app.privacyPolicy', {
        url: '/privacyPolicy',
        cache: false,
        views: {
            'menuContent': {
                templateUrl: 'templates/privacyPolicy.html',
                controller: 'RecordCtrl'
            },
            'fabContent': {
                template: '',
            }
        },
    })

    .state('app.currentHEP', {
        url: '/currentHEP/:patientID',
        cache: false,
        views: {
            'menuContent': {
                templateUrl: 'templates/currentHEP.html',
                controller: 'CurrentHEPCtrl'
            },
            'fabContent': {
                template: '',
            }
        },
        resolve: {
            currentHEP: ['Exercise', '$stateParams', function(Exercise, $stateParams){
                return Exercise.getCurrent($stateParams.patientID);
            }]
        }
    })

    .state('app.patientList', {
        url: '/patientList',
        cache: true,
        views: {
            'menuContent': {
                templateUrl: 'templates/patientList.html',
                controller: 'PatientListsCtrl'
            },
            'fabContent': {
                template: '<button id="fab-add-patient" class="button button-fab button-fab-top-right expanded spin" style="background-color:#FFC107; color: white" ng-click="addPatient()" ><i class="icon ion-person-add"></i></button>',
                controller: function ($timeout) {
                    $timeout(function () {
                        document.getElementById('fab-add-patient').classList.toggle('on');
                    }, 900);
                }
            }
        },
        resolve: {
            patientList: ['Patient', function(Patient){
                return Patient.getAll();
            }]
        }
    })
    .state('app.myLibrary', {
        url: '/myLibrary/:status/:patientID/:logID',
        views: {
             'menuContent': {
                templateUrl: 'templates/myLibrary.html',
                controller: 'MyLibraryCtrl'
            },
            'fabContent': {
                template: '',
            }
        },
        resolve: {
            libraryItems: ['Exercise', function(Exercise){
              return Exercise.getSnapLibrary();
            }]
        }
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/login');

});
