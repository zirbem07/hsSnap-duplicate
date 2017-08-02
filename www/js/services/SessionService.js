app.factory('Session', function($http, $httpParamSerializerJQLike) {
    // Might use a resource here that returns a JSON array

    return  {
        user: {},
        currentPatient: {},
        
        login: function(username, password){

            return $http({
                method: 'POST',
                url: 'https://api.truevault.com/v1/auth/login',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: $httpParamSerializerJQLike({'username': username, 'password': password, 'account_id': '686fb6aa-f671-4532-94ac-29d69d0d1e5a'})
            })
        },

        getUserData: function(userID) {

            var self = this;
            return $http({
                method: 'GET',
                url: 'https://api.truevault.com/v1/users/' + userID + '?full=true',
                headers: {
                    'Authorization': 'Basic ' + btoa(self.user.access_token + ':'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: {full: true}
          })
        },

        logout: function() {
            var self = this;
            return $http({
                method: 'POST',
                url: 'https://api.truevault.com/v1/auth/logout',
                headers: {
                'Authorization': 'Basic ' + btoa(self.user.access_token + ':') 
                }
            })
        },

        sendForgotPassword : function(email, text) {
          return $http({
            method: 'POST',
            url: 'https://healthconnection.io/hcMailgun/sendPasswordResetEmail.php',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: $httpParamSerializerJQLike({email: email, link: 'https://healthconnection.io/hcPassword/index.html#/resetPasswordCode/' + text})
          }).then(function successCallback(response) {
            
          }, function errorCallback(response) {

          });
        },

        sendError : function(msg) {
            var self = this;
            msg = msg +  ". " + this.user.attributes.Email
            return $http({
            method: 'GET',
            url: 'https://healthsnaps.com/hcMailgun/sendErrors.php?message=' + msg,
          }).then(function successCallback(response) {
            console.log(response)
          }, function errorCallback(response) {
            console.log(response);
          });
        }
    };

});