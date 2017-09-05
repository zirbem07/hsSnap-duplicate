/**
 * Created by sean on 1/30/16.
 */
angular.module('hcSnap')
  .factory("api", function($resource) {

    var api = {
      UserLogin: function() {
        return $resource("https://healthconnection.io/testAPI/web/index.php/api/v1/userLogin/:id",null,
          {
            'update': { method:'PUT', params:{id:'@id'} }
          });
      }(),
      //
      //Unactivated: function() {
      //  return $resource("https://healthconnection.io/testAPI/web/index.php/api/v1/unactivated/:id",null,
      //    {
      //      'update': { method:'PUT', params:{id:'@id'} }
      //    });
      //}(),

      AnalyticsItem: function() {
        return $resource("https://healthconnection.io/testAPI/web/index.php/api/v1/analyticsItem/:id",null,
          {
            'update': { method:'PUT', params:{id:'@id'} }
          });
      }(),

      SnapVideo: function() {
        return $resource("https://healthconnection.io/testAPI/web/index.php/api/v1/snapVideo/:id",null,
          {
            'update': { method:'PUT', params:{id:'@id'} }
          });
      }(),

      EmailCode: function () {
        return $resource("https://healthconnection.io/hcAPI/web/index.php/api/v1/passwordReset/:id", null,
          {
            'update': {method: 'PUT', params: {id: '@id'}}
          });
      }(),

      ActivationCode: function() {
        return $resource("https://healthconnection.io/hcAPI/web/index.php/api/v1/activateAccount/:id", null,
          {
            'update': {method: 'PUT', params: {id: '@id'}}
          });
      }(),

      Branding: function() {
        return $resource("https://healthconnection.io/hcAPI/web/index.php/api/v1/branding/:id", null,
          {
            'update': {method: 'PUT', params: {id: '@id'}},
            'select': {method: 'GET', isArray: true, params: {id: '@id'}}
          });
      }()

    }
    return api;
  });
