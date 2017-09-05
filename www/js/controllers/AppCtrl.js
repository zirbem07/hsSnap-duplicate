
app.controller('AppCtrl', function ($scope, $ionicModal, $ionicPopover, $timeout, Session, $ionicLoading, $ionicHistory, $state, Patient, ionicToast, api) {
    // Form data for the login modal
    $scope.isExpanded = false;
    $scope.hasHeaderFabLeft = false;
    $scope.hasHeaderFabRight = false;

    var navIcons = document.getElementsByClassName('ion-navicon');
    for (var i = 0; i < navIcons.length; i++) {
        navIcons.addEventListener('click', function () {
            this.classList.toggle('active');
        });
    }

    $scope.goBack = function() {
        $ionicHistory.nextViewOptions({
               historyRoot: true
             })
            $ionicHistory.goBack();
    }

    $scope.addPatient = function() {
        $scope.modal.show();
    }

    $scope.newPatient = {};

    $ionicModal.fromTemplateUrl('templates/addPatientModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });

    $scope.closeModal = function() {
        $scope.newPatient = {};
        $scope.modal.hide();
    }

    createCode = function() {
        var userCode = "";
        var possible = "0123456789";

        for( var i=0; i < 6; i++ )
            userCode += possible.charAt(Math.floor(Math.random() * possible.length));

        return userCode;
    }

    addPatientToGroup = function(patientID) {
        Patient
            .addPatientToGroup(patientID)
            .then(function(){
                createPatientLog(patientID)
            }, function(error){
                Session.sendError("Error adding patient to group " + error.data.error.code );
                $ionicLoading.hide();
                ionicToast.show('Failed to create patient. Health Snaps Team Notified', 'top', false, 4000);
            })        
    }

    createPatientLog = function(patientID){
        Patient
            .createPatientLog(patientID)
            .then(function(patientLog) {
                addPatientObject(patientID, patientLog);
            }, function(error){
                Session.sendError("Error creating patient log " + error.data.error.code);
                $ionicLoading.hide();
                ionicToast.show('Failed to create patient. Health Snaps Team Notified', 'top', false, 4000);
            })
    }

    addPatientObject = function(patientID, patientLog) {
        Patient
            .addPatient($scope.newPatient, patientID, patientLog.data.document_id)
            .then(function(patient){
               saveActivationCode(patientID, patientLog)
            }, function(error) {
                Session.sendError("Error creating patient object " + error.data.error.code);
                $ionicLoading.hide();
                ionicToast.show('Failed to create patient. Health Snaps Team Notified', 'top', false, 4000);
            })
    }

    saveActivationCode = function(patientID, patientLog){
         api.ActivationCode.save(
                {
                    Email: $scope.newPatient.email,
                    Code: $scope.userCode,
                    ClinicID: Session.user.attributes.ClinicID
                },
                function (emailCodeResponse) {
                    console.log(patientID);
                    sendActivationEmail(patientID, patientLog)
                },
                function (emailCodeError) {
                    console.log(emailCodeError)
                    Session.sendError("Error saving activation code " +  emailCodeError)
                    $ionicLoading.hide();
                    ionicToast.show('Failed to save activation code. Health Snaps team has been notified.', 'top', false, 4000);
                })
    }

    sendActivationEmail = function(patientID, patientLog) {
        Patient
            .emailPatient($scope.newPatient, $scope.userCode)
            .then(function() {
                $ionicLoading.hide();
                $scope.$broadcast('patient-added', {Patient: $scope.newPatient, ID: patientID, logID:patientLog.data.document_id });
                $scope.newPatient = {};
                $scope.modal.hide();
            }, function(error) {
                Session.sendError("Error sending activation email " + error);
                $ionicLoading.hide();
                ionicToast.show('Email failed to send. Health Snaps team has been notified.', 'top', false, 4000);
            })
    }



    $scope.createPatient = function() {

        $ionicLoading.show({
            template: '<ion-spinner icon="lines" class="spinner-royal"></ion-spinner><p>Creating Patient</p>'
        })

        $scope.userCode = createCode();

        Patient
            .createUser($scope.newPatient.email)
            .then(function(userObj){
                var patientID = userObj.data.user.user_id;
                addPatientToGroup(patientID);
            },function(error) {
                $ionicLoading.hide();
                if(error.data.error.code === 'USER.USERNAME_IN_USE') {
                    ionicToast.show('Error: Email already in use.', 'top', false, 3000);
                } else {
                    ionicToast.show('An error occured. Please try again later.', 'top', false, 3000);
                }
                Session.sendError("Error adding patient " + error.data.error.code );
            })
    }


    $scope.hideNavBar = function() {
        document.getElementsByTagName('ion-nav-bar')[0].style.display = 'none';
    };

    $scope.showNavBar = function() {
        document.getElementsByTagName('ion-nav-bar')[0].style.display = 'block';
    };

    $scope.noHeader = function() {
        var content = document.getElementsByTagName('ion-content');
        for (var i = 0; i < content.length; i++) {
            if (content[i].classList.contains('has-header')) {
                content[i].classList.toggle('has-header');
            }
        }
    };

    $scope.setExpanded = function(bool) {
        $scope.isExpanded = bool;
    };

    $scope.setHeaderFab = function(location) {
        var hasHeaderFabLeft = false;
        var hasHeaderFabRight = false;

        switch (location) {
            case 'left':
                hasHeaderFabLeft = true;
                break;
            case 'right':
                hasHeaderFabRight = true;
                break;
        }

        $scope.hasHeaderFabLeft = hasHeaderFabLeft;
        $scope.hasHeaderFabRight = hasHeaderFabRight;
    };

    $scope.hasHeader = function() {
        var content = document.getElementsByTagName('ion-content');
        for (var i = 0; i < content.length; i++) {
            if (!content[i].classList.contains('has-header')) {
                content[i].classList.toggle('has-header');
            }
        }

    };

    $scope.hideHeader = function() {
        $scope.hideNavBar();
        $scope.noHeader();
    };

    $scope.showHeader = function() {
        $scope.showNavBar();
        $scope.hasHeader();
    };

    $scope.clearFabs = function() {
        var fabs = document.getElementsByClassName('button-fab');
        if (fabs.length && fabs.length > 1) {
            fabs[0].remove();
        }
    };

    $scope.toPatientList = function() {
        $ionicHistory.nextViewOptions({
               historyRoot: true
        })
        $state.go('app.patientList');
    }

    $scope.toMyLibrary = function() {
        $state.go('app.myLibrary',{status: 'manage', patientID: "", logID: ""});
    }

    $scope.toPrivacyPolicy = function() {
        $state.go('app.privacyPolicy');
    }

    $scope.logout = function(){
      Session
      .logout()
      .then(function successCallback(response) {

        Session.user = {};
        $timeout(function () {
          $ionicLoading.hide();
          $ionicHistory.clearCache();
          $ionicHistory.clearHistory();
          $ionicHistory.nextViewOptions({ disableBack: true, historyRoot: true });
          $state.go('app.login');
        }, 30);

      }, function errorCallback(error) {

      });
    }
});
