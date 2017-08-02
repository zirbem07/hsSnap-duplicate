app.controller('PatientListsCtrl', function ($scope, $state, $http, $stateParams, $cordovaCapture, $ionicModal, $ionicLoading, Session, ionicToast, Patient, $ionicPopup, api,
                                    $timeout, $cordovaFile, ionicMaterialMotion, patientList, Exercise, $ionicHistory, $ionicNavBarDelegate, $ionicActionSheet, Analytics) {

    $scope.PatientList = [].concat(patientList);
    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.$parent.setHeaderFab('right');
    $scope.search = {term: ""}

    Patient.getPatientRequests()
      .then(function(success){
        $scope.PatientRequests = success;
      },
      function(error){

      })

    Patient.getFeedback()
        .then(function(success){
            console.log(success)
            $scope.PatientList.forEach(function(patient) {
                if(success[patient.document.PatientID]){
                    patient.document.feedback = success[patient.document.PatientID];
                }
                
            }, this);
        },
        function(error){

        })

    $scope.doRefresh = function() {

    }

    // if(window.localStorage.getItem("logo")){
        var logo = api.Branding.select({id: Session.user.attributes.ClinicID}, function() {
            console.log(logo[0])
            window.localStorage.setItem("logo", logo[0].LogoLink);
        })
    // }

     $scope.$on('patient-added', function(event, args) {
         Analytics.therapistUsage(Session.user.username, 'patient');
         args.Patient.PatientLogID = args.logID;
         args.Patient.FirstName = args.Patient.firstName;
         args.Patient.LastName = args.Patient.lastName;
         args.Patient.Email = args.Patient.email;
         args.Patient.Activated = false;
         args.Patient.PatientID = args.ID;
         $scope.PatientList.unshift({documentID: args.ID, document: args.Patient })
         $scope.toCurrentHEP( args.Patient, args.ID);
    })

    $scope.toCurrentHEP = function(patient, patientID) {
        $scope.clearSearch();
        if(!$scope.actionSheet){
            Session.currentPatient = patient;
            $state.go('app.currentHEP', {patientID: patientID});
        }
    }

    $scope.clearSearch = function(){
        $scope.search = {term: ""};
    }


     $timeout(function() {
        $scope.isExpanded = true;
        $scope.$parent.setExpanded(true);
    }, 300);


    $scope.daysAgo = function(day) {
         day = Date.parse(day.substring(0, day.length -14)) || Date.parse(day);
         return Math.round(Math.abs((Date.today().getTime() - day.getTime())/(24*60*60*1000)))
    }

    $scope.actionSheet = false;

    $ionicModal.fromTemplateUrl('templates/sharePatientModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });

     $scope.showActionSheet = function(first, last, patientIndex) {
         $scope.actionSheet = true;
        // Show the action sheet
        var hideSheet = $ionicActionSheet.show({
            buttons: [
                { text: 'Edit Patient'},
                { text: 'Discharge Patient' },
                { text: 'Share Patient' }
            ],
            destructiveText: 'Delete Patient',
            titleText: first + ' ' + last,
            cancelText: 'Cancel',
            cssClass: 'actionSheet',
            cancel: function() {
                $scope.actionSheet = false;
                $scope.searchTerm = "";
                hideSheet();
             },
             destructiveButtonClicked: function(){
                 $scope.actionSheet = false;
                 $scope.showConfirm(patientIndex)
                 return true;
             },
             buttonClicked: function(index) {
                $scope.actionSheet = false;
                if(index == 0){
                    this.cancel()
                    $scope.editPatientModal.show();
                } else if(index == 1){
                    Patient
                        .dischargePatient(patientIndex);
                    if(Session.user.attributes.DischargeSurvey){
                        Patient.sendDischargeSurvey(Session.user.attributes.DischargeSurvey, patientIndex);
                        ionicToast.show('Discharge Survey Sent!', 'top', false, 4000);
                    } 
                    return true;
                } else if(index == 2) {
                    $scope.patientToShare = $scope.PatientList[patientIndex]
                    $scope.modal.show();
                    return true;
                } else {
                    return true;
                }
            }
        });

        $scope.editPatient = {};

        $ionicModal.fromTemplateUrl('templates/editPatientModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.editPatientModal = modal;
            $scope.editPatient = $scope.PatientList[patientIndex].document;
            $scope.editPatientEmail  = $scope.PatientList[patientIndex].document.Email + "";
        });

        $scope.updatePatient = function() {
            $ionicLoading.show({
                template: '<ion-spinner icon="lines" class="spinner-royal"></ion-spinner><p>Updating Patient</p>'
            })
            if($scope.editPatient.Email !== $scope.editPatientEmail){
                //New activation code
                var userCode = "";
                var possible = "0123456789";
                var newEmail = $scope.editPatient.Email;
                var newName = $scope.editPatient.FirstName;

                for( var i=0; i < 6; i++ )
                    userCode += possible.charAt(Math.floor(Math.random() * possible.length));

                Patient
                    .createUser($scope.editPatient.Email)
                    .then(function(userObj){
                        var patientID = userObj.data.user.user_id;
                        $scope.editPatient.PatientID = userObj.data.user.user_id;
                        Patient
                            .addPatientToGroup(patientID);
                        Patient.updatePatient($scope.PatientList[patientIndex].documentID, $scope.editPatient)
                            .then(function(response){
                                Patient.editPatientLog($scope.editPatient.PatientLogID, $scope.editPatient.PatientID)
                                api.ActivationCode.save(
                                {
                                    Email: $scope.editPatient.Email,
                                    Code: userCode
                                },
                                function (emailCodeResponse) {
                                    console.log($scope.editPatient);
                                    Patient
                                    .emailPatient({email: newEmail, firstName: newName}, userCode)
                                },
                                function (emailCodeError) {
                                    console.log(emailCodeError)
                                })
                                
                                $ionicLoading.hide();
                                $scope.closeEditModal();
                            })
                    });
            } else {
                Patient.updatePatient($scope.PatientList[patientIndex].documentID, $scope.editPatient)
                .then(function(response){
                    $ionicLoading.hide();
                    $scope.closeEditModal();
                })
            } 

            

        }

        $scope.closeEditModal = function() {
            $scope.editPatient = {};
            $scope.editPatientModal.hide();
        }

        $scope.sharePatient = function(email){
            Patient.shareAccount($scope.patientToShare, email)
            $scope.modal.hide();
        }

        $scope.closeModal = function(message) {
            $scope.modal.hide();
        }
        // Cleanup the modal when we're done with it
        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });

         $scope.showConfirm = function(patientIndex) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Delete Patient',
                okType: 'button-assertive',
                template: 'Are you sure you want to delete this patient? All records will be removed from Health Snaps app and dashboard.'
            });

            confirmPopup.then(function(res) {
                if(res) {
                    Patient
                        .deletePatient(patientIndex);
                    $scope.PatientList.splice(patientIndex, 1);
                } else {
                    console.log('You are not sure');
                }
            });
        };

    };

     $scope.showShareActionSheet = function(patient, patientRequestIndex) {
         $scope.actionSheet = true;
        // Show the action sheet
        var hideSheet = $ionicActionSheet.show({
            buttons: [
                { text: 'Accept Share' }
            ],
            destructiveText: 'Reject Share',
            titleText: patient.document.FirstName + ' ' + patient.document.FirstName,
            cancelText: 'Cancel',
            cssClass: 'actionSheet',
            cancel: function() {
                $scope.actionSheet = false;
                hideSheet();
             },
             destructiveButtonClicked: function(){
                 Patient.deleteShare(patient)
                 $scope.PatientRequests.splice(patientRequestIndex, 1)
                 return true;
             },
             buttonClicked: function(index) {
                $scope.actionSheet = false;
                if(index == 0){
                    Patient
                        .addSharedAccount(patient)
                    Patient.deleteShare(patient)
                    $scope.PatientRequests.splice(patientRequestIndex, 1)
                    $scope.PatientList.push(patient)
                    return true;
                } else {
                    return true;
                }
            }
        });
    };

});
