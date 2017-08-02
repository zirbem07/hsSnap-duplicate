app.controller('LoginCtrl', function ($scope, $state, $ionicHistory, $ionicModal, ionicMaterialMotion, ionicToast, Session, Analytics, $ionicLoading, api) {

      $scope.loginData = {
        username: window.localStorage.getItem("username") || "",
        password: '',
        rememberMe: window.localStorage.getItem("rem") === "true" || false
      };

      $scope.logoImg = window.localStorage.getItem("logo") || './img/icon.png';

      $scope.login = function(){
          $ionicLoading.show({
                template: '<ion-spinner icon="lines" class="spinner-royal"></ion-spinner><p>Logging In</p>'
          });
         Session.login($scope.loginData.username, $scope.loginData.password)
        .then(function(response){
           if($scope.loginData.rememberMe === "true" || $scope.loginData.rememberMe){
              window.localStorage.setItem ("username",$scope.loginData.username);
              window.localStorage.setItem ("rem",true);
            } else {
              // window.localStorage.setItem ("username","");
              window.localStorage.setItem ("rem",false);
            }
            Session.user = response.data.user;
            Session.getUserData(response.data.user.id)
            .then(function successCallback(userData) {
              if(userData.data.user.attributes) {
                Session.user.attributes = JSON.parse(atob(userData.data.user.attributes))
              }
              Analytics.therapistUsage(Session.user.username, 'login');
             $ionicHistory.nextViewOptions({
               historyRoot: true
             })
             $ionicLoading.hide();
            $state.go('app.patientList');
          }, function errorCallback(response) {
            
            $scope.showLoginError();
          });

        },
        function(error) {
            showLoginError();
        })
      };

      $ionicModal.fromTemplateUrl('templates/forgotPasswordModal.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.modals = modal;
        });

      $scope.forgotPassword = function(){
        $scope.openModal();
      }

      $scope.doForgotPassword = function(email){
        
        //create slug
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 10; i++ )
          text += possible.charAt(Math.floor(Math.random() * possible.length));


        //add slug and email to DB
        api.EmailCode.save(
          {
            Email: email,
            Code: text
          },
        function (data) {
          console.log(data)
          //Send email
          Session.sendForgotPassword(email, text)
          .then(function successCallback() {  
            $scope.closeModal();
            ionicToast.show('Reset password email sent.', 'top', false, 5000);
          }, function errorCallback(response) {
            Session.sendError("Error failed to send forgot password email");
          });

        },
        function (error) {
          Session.sendError("Error failed to save pw reset code ");
        })
      }

      $scope.openModal = function() {
          $scope.modals.show();
        };
        $scope.closeModal = function() {
          $scope.modals.hide();
        };
        // Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
          $scope.modals.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal.hidden', function() {
          // Execute action
        });
        // Execute action on remove modal
        $scope.$on('modal.removed', function() {
          // Execute action
        });

      var showLoginError = function(error) {
        $ionicLoading.hide();
        ionicToast.show('Invalid Username or Password.', 'top', false, 3000);
      };
});
