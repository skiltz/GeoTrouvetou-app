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
    function majCtrl($scope, $stateParams, geoTrouvetou, $q, $http, $upload,
      moment, $timeout) {
      "use strict";
      var getModule = function (module_name) {
        return $http.get('/module/' + module_name);
      };

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
        $http.jsonp(url + '?callback=JSON_CALLBACK').success(function (
          releases) {
          if (version) {
            angular.forEach(releases.data, function (release) {
              if (version === release.tag_name) {
                deferred.resolve(release);
              }
            });
          } else {
            deferred.resolve(releases.data.sort(dynamicSort("timestamp"))[
              0]);
          }
        });
        return deferred.promise();
      };

      var checkAll = function () {
        // Get'in last revision of GeoTrouvetou
        $http.get('/modules').success(function (modules) {
          getRelease(modules.GeoTrouvetou.releases).then(function (
            release) {
            console.log(release);
          });
        });
      };
      checkAll();
    }
  ]);