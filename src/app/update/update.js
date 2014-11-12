/*global angular */
angular.module('GeoTrouvetou.update', [
  'ui.router',
  'placeholders',
  'ui.bootstrap',
  'leaflet-directive',
  'GeoTrouvetouServices',
  'angularFileUpload',
  'angularMoment'
])

.config(['$stateProvider',
  function config($stateProvider) {
    $stateProvider.state('update', {
      url: '/update',
      views: {
        "main": {
          controller: 'updateCtrl',
          templateUrl: 'update/update.tpl.html'
        }
      },
      data: {
        pageTitle: 'Mise à niveau'
      }
    });
  }
])
  .controller('updateCtrl', ['$scope', '$stateParams', 'geoTrouvetou', '$q',
    '$http', '$upload', 'moment', '$timeout',
    function updateCtrl($scope, $stateParams, geoTrouvetou, $q, $http,
      $upload, moment, $timeout) {
      "use strict";
      var getModule = function (module_name) {
        return $http.get('/module/' + module_name);
      };
      $scope.modules = {};
      $scope.dependencies = {};

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

      var getRelease = function (url, version) {
        var deferred = $q.defer();
        $http.jsonp(url + '?callback=JSON_CALLBACK')
          .success(function (releases) {
            console.log('success');
            if (version) {
              angular.forEach(releases.data, function (release) {
                if (version === release.tag_name) {
                  deferred.resolve(release);
                }
              });
            } else {
              console.log(releases.data.sort(dynamicSort("timestamp"))[0]);
              deferred.resolve(
                releases.data.sort(dynamicSort("timestamp"))[0]
              );
            }
          })
          .error(function (e) {
            deferred.reject(e);
          });
        return deferred.promise;
      };

      var getNewModule = function (module, version) {
        var deferred = $q.defer();
        version = version || 'master';
        $http.jsonp(
          "https://api.github.com/repos/skiltz/" + module +
          "/contents/module.json?ref=" + version +
          '&callback=JSON_CALLBACK'
        )
          .success(function (data) {
            deferred.resolve(JSON.parse(atob(data.data.content)));
          });
        return deferred.promise;
      };
      var getNewModules = function (version) {
        var deferred = $q.defer();
        version = version || 'master';
        $http.jsonp(
          "https://api.github.com/repos/skiltz/GeoTrouvetou/contents/modules.json?ref=" +
          version +
          '&callback=JSON_CALLBACK'
        )
          .success(function (data) {
            deferred.resolve(JSON.parse(atob(data.data.content)));
          });
        return deferred.promise;
      };
      

      var updateModule = function (module, version) {
        getNewModule(module, version).then(function (module_json) {
          $scope.modules[module].nversion = module_json.version;
          $scope.modules[module].dependencies = module_json.dependencies;
          angular.forEach(module_json.dependencies, function (v, mod) {
            if ($scope.dependencies[mod] !== v) { // xxx Need this test???
              $scope.dependencies[mod] = v;
            }
          });
          getRelease($scope.modules[module].releases, $scope.modules[
            module].nversion).then(
            function (release) {
              console.log(release.zipball_url);
              
              //release.zipball_url
              /* 
              on récupère le lien du ZIP
              On l'enregistre dans home_dir/Upgrade
              
              On dezip -> CF GeoTrouvetou
              On remplace.
              */
            }
          );
        });
      };

      var checkAll = function () {
        // Get'in last revision of GeoTrouvetou
        $http.get('/modules').success(function (modules) {
          $scope.modules = modules;
          getRelease(modules.GeoTrouvetou.releases).then(
            function (release) {
              //https://api.github.com/repos/skiltz/GeoTrouvetou/contents/module.json?ref=0.0.7
              //console.log(release);
              getNewModules(release.tag_name).then(
                function (modules) {
                  console.log('modules');
                  console.log(modules);
                  angular.forEach(modules, function (v, k) {
                    $scope.modules[k] = v;
                  });
                  //update module GeoTrouvetou
                  updateModule('GeoTrouvetou');
                  
                });
            },
            function (e) {
              console.log(e);
            });
        });
      };

      checkAll();
    }
  ]);