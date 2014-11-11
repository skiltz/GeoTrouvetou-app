/*global angular */
angular.module('GeoTrouvetou', [
  'templates-app',
  'templates-common',
  'GeoTrouvetou.acceuil',
  'GeoTrouvetou.aide',
  'GeoTrouvetou.communes',
  'GeoTrouvetou.departements',
  'GeoTrouvetou.detail',
  'GeoTrouvetou.recherche',
  'GeoTrouvetou.voies',
  'GeoTrouvetou.edit',
  'GeoTrouvetou.recherche_bano',
  'GeoTrouvetou.detail_bano',
  'GeoTrouvetou.admin',
  'GeoTrouvetou.maj',
  'GeoTrouvetou.update',
  'GeoTrouvetou.stats',
  'ui.router',
  'ui.bootstrap',
  'ngCookies',
  'ES',
  'GeoTrouvetou.modals_update'
])

.config(['$urlRouterProvider',
  function myAppConfig($urlRouterProvider) {
    "use strict";
    $urlRouterProvider.otherwise('/acceuil');
  }
])
  .config(['$tooltipProvider',
    function ($tooltipProvider) {
      $tooltipProvider.setTriggers({
        'mouseenter': 'mouseleave',
        'click': 'click',
        'focus': 'blur',
        'never': 'mouseleave',
        'show': 'hide'
      });
    }
  ])
  .controller('SearchCtrl', ['$scope', 'es', '$location', '$timeout',
    function ($scope, es, $location, $timeout) {
      "use strict";
      $scope.submit = function (e) {
        if (e.keyCode == 13) {
          $location.path('/voies/' + $scope.asyncSelected.payload.id);
        }
      };
      $scope.getLocation = function (text) {
        return es.suggest(text, 'commune').then(function (data, status) {
          var communes = [];
          //        console.log(data);
          angular.forEach(data.suggest[0].options, function (item) {
            communes.push(item);
          });
          //        console.log(data);
          return communes;
        });
      };
    }
  ])

.controller('AppCtrl', ['$scope', '$location', '$modal', '$http', 'es',
  '$timeout', '$q', '$interval',
  function AppCtrl($scope, $location, $modal, $http, es, $timeout, $q,
    $interval) {
    "use strict";
    //$scope.status = 'text-danger';
    $scope.$on('$stateChangeSuccess', function (event, toState, toParams,
      fromState, fromParams) {
      if (angular.isDefined(toState.data.pageTitle)) {
        $scope.pageTitle = toState.data.pageTitle + ' | GéoTrouvetou';
      }
    });
    $scope.nversion = {};

    function dynamicSort(property) {
      var sortOrder = 1;
      if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
      }
      return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[
          property]) ? 1 : 0;
        return result * sortOrder;
      };
    }

    var openModalUpdate = function (size) {
      var modalInstance = $modal.open({
        templateUrl: 'modals_update/modals_update.tpl.html',
        controller: 'modal_updateCtrl',
        resolve: {
          nversion: function () {
            return $scope.nversion;
          }
        }
      });

      modalInstance.result.then(function () {

      }, function () {});
    };

    // controle de mise à jour
    /*
      On check sur l'url les derniers tags.
      Puis, si la version diffère, on fait la maj: on télécharge la mise à jour dans un dossier update
      Si la version correspond, on vérifie les dependances.
      chaque "module" à un fichier module.json
      {
        name:"",
        version:"",
        dependencies:{
          "module" : "version"
        }
      }
      Pour chaque dependances, le logiciel doit comparer.
      Cela permetra d'avoir des packages séparés.

      Liste des modules pour le moment :
        app -> GeoTrouvetou-app
        nodejs -> GeoTrouvetou-nodejs
        nodejs_server -> GeoTrouvetou-server
        ES -> GeoTrouvetou-es
        chromium -> GeoTrouvetou-chromium
        josm -> GeoTrouvetou-josm
        jre -> GeoTrouvetou-jre
        batchs -> GeoTrouvetou

      on demande à l'utilisateur de relancer le serveur.
      puis au lancement de l'application "serveur" ou "data", on lance un script dans update : update.bat
      qui suprimmera le dossier a updater, copiera les données dans le bon dossier et se suprrimera.
    */

    $http.get('/module/GeoTrouvetou').success(function (GeoTrouvetou_module) {
      var my_version = GeoTrouvetou_module.version;
      $http.get('/modules').success(function (
        GeoTrouvetou_modules) {
        $http.jsonp(GeoTrouvetou_modules.GeoTrouvetou.releases +
          '?callback=JSON_CALLBACK').success(
          function (releases) {
            releases = releases.data.sort(dynamicSort("timestamp"));
            var last_release = releases[0];
            if (last_release.tag_name === my_version) {
              console.log('Version à jour');
            } else {
              console.log('Nouvelle version: ' + last_release.tag_name);

            }
          });
      });
    });
    /*
    var modules_file = "modules.json"; //"module.json";
    var module_file = "module.json"; //"module.json";
    $http.jsonp(
      "https://api.github.com/repos/skiltz/geotrouvetou/contents/" +
      modules_file + "?callback=JSON_CALLBACK").success(
      function (data) {
        var modules = atob(data.data.content);
        var my_modules = [];
        angular.forEach(modules, function (v, k) {
          my_modules.push(k); // xxx refactorisable!!!

        });

      });


    /*$http.jsonp("https://bitbucket.org/api/1.0/repositories/skiltz/geotrouvetou/tags?callback=JSON_CALLBACK").success(
      function(data) {
        var versions = [];
        angular.forEach(data, function(v, k) {
            v.version = k;
            versions.push(v);
        });
        versions.sort(dynamicSort("timestamp")).reverse();
        $scope.nversion.version = versions[0].version;
        $scope.nversion.url = 'https://bitbucket.org/skiltz/geotrouvetou/get/' + $scope.nversion.version + '.zip';
        $scope.nversion.version_jre = $scope.nversion.version + ' avec Java intégré';
        $scope.nversion.url_jre = 'https://bitbucket.org/skiltz/geotrouvetou/get/' + $scope.nversion.version + '_jre.zip';

        if ($scope.nversion.version == $scope.version) {
          console.log('version a jour :)');
        }
        else {
          console.log('merci de faire une maj!\nVersion installée : ' +
            $scope.version + '\nVersion en cours: ' +
            $scope.nversion.version);
          openModalUpdate();
          // changer la valeur de $scope.nversion qui affichera un menu de téléchargement :)
          // https://bitbucket.org/skiltz/geotrouvetou/get/v0.0.20140901.zip or https://bitbucket.org/skiltz/geotrouvetou/get/v0.0.20140901_jre.zip
        }
      });*/
    $scope.status = '';
    $scope.databasePopMessage = '';
    $scope.databaseIsOn = false;
    var databaseIsOK;
    databaseIsOK = function () {
      return es.isOk().then(function (status, message) {
        $scope.status = "bg-" + status;
        $scope.databaseIsOn = true;
        $scope.databasePopMessage = message;
        $timeout(databaseIsOK, 3000);
      }, function (status, message) {
        $scope.databaseIsOn = false;
        $scope.databasePopMessage = message;
        $scope.status = "bg-" + status;
        $timeout(databaseIsOK, 250);
      });
    };
    databaseIsOK();
    $scope.fav_dept = '01';
    if (window.localStorage) {
      $scope.fav_dept = window.localStorage.getItem('fav_dept') || '01';
    }
  }
])

;