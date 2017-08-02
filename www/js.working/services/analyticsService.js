/**
 * Created by sean on 11/28/16.
 */
angular.module('hcSnap')
.factory('Analytics', function($q, $http, $httpParamSerializerJQLike, Session, ID, api) {

    return {
      postUserLogin: function (userLogin) {

        console.log(userLogin)

        var date = new Date().toString('yyyy/M/d');

        var defer = $q.defer();

        api.UserLogin.save(
          {
            UserID: userLogin.UserID,
            Type: userLogin.Type,
            LoginDate: date,
            ClinicID: userLogin.ClinicID,
            Platform: userLogin.Platform,
            Source: userLogin.Source
          },
          function(success){
            console.log(success)
            defer.resolve();

          },
          function(error){
            console.log(error)
            defer.reject();

          });
        return defer.promise;
      },
      postAnalyticsItem: function (analyticsItem) {
        var defer = $q.defer();

        api.AnalyticsItem.save(
          {
            Type: analyticsItem.Type,
            ClinicID: analyticsItem.ClinicID,
            Platform: analyticsItem.Platform,
            Source: analyticsItem.Source
          },
          function(success){
            defer.resolve();

          },
          function(error){
            defer.reject();

          });
        return defer.promise;
      },
      postUnactivated: function (unactivated) {
        var defer = $q.defer();

        var date = new Date().toString('yyyy/M/d');

        api.Unactivated.save(
          {
            UserID: unactivated.UserID,
            DateAdded: date,
            ReminderSent: 0,
            LastReminded: date,
            ClinicID: unactivated.ClinicID,
            Source: unactivated.Source
          },
          function(success){
            defer.resolve();

          },
          function(error){
            defer.reject();

          });
        return defer.promise;
      },
      therapistUsage: function (email, type) {

        $http({
            method: 'POST',
            url: 'http://healthconnection.io/hsPHP/therapistUsage.php',
            data: { email: email, type: type }
        })
      }

    }
  });
