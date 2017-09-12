app.controller('CurrentHEPCtrl', function ($rootScope, $scope, $state, $stateParams, $ionicNavBarDelegate, $cordovaCapture, $timeout,
        currentHEP, ionicMaterialMotion, ionicToast, Session, Exercise, $ionicModal, $ionicLoading, $ionicScrollDelegate, Patient, Analytics, $ionicPush) {

    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.$parent.setHeaderFab('right');
    $scope.showDelete = false;
    $scope.currentPatient = Session.currentPatient;
    $scope.editButtonText = "Edit";
    $scope.formSubmitted = false;

    $scope.getDeviceToken = function(){
        $ionicPush.register().then(function(t) {
            return $ionicPush.saveToken(t, 'ignore_user');
        }).then(function(t) {
            if(t.token){
                console.log('Token saved:', t.token);
                $scope.currentPatient.TherapistDeviceToken = t.token;
                Patient.updatePatient($scope.currentPatient.document_id, $scope.currentPatient)
                .then(function(response){
                    
                })
            }
        });
    }();

    console.log($scope.currentPatient)

    //Load img from blob where nessisary
    angular.forEach(currentHEP, function(val){
        if(val.ImgBlobID){
            Exercise
                .getThumbnail(val.ImgBlobID)
                .then(function(imgBlob) {
                    val.Img = imgBlob.data;
                })
        }
    })
    $scope.currentHEP = [].concat(currentHEP);

    //Update Exerices Modal

    $scope.exercise = {};
    $scope.updateExercise = function(exercise) {
        Exercise.currentExercise = exercise;
        $scope.title = 'Update Exercise'
        $scope.img = exercise.Img;
        $scope.exercise = {
            'name': exercise.Name,
            'perDay': exercise.Frequency.toString().split('-')[0],
            'upperPerDay': exercise.Frequency.toString().split('-')[1],
            'reps': exercise.Reps.toString().split('-')[0],
            'upperReps': exercise.Reps.toString().split('-')[1],
            'sets': exercise.Sets.toString().split('-')[0],
            'upperSets': exercise.Sets.toString().split('-')[1],
            'hold': exercise.Hold,
            'days': "Every Day",
            'description': exercise.Description,
            'feedback': exercise.feedback
        }
        $scope.modal.show();
    }

    $ionicModal.fromTemplateUrl('templates/assignExerciseModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });

    $scope.closeModal = function() {
        $scope.exercise = {};
        $scope.modal.hide();
        //successToast("Exercise Updated Successfully");
    }
    // Cleanup the modal when we're done with it
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

    var successToast = function(message) {
        if(message){
            ionicToast.show(message, 'top', false, 3000);
        } else  {
            ionicToast.show('Success!', 'top', false, 3000);
        }
    }

    //Delete HEP stuff
    $scope.toggleDelete = function(){
        if($scope.showDelete) {
            $scope.editButtonText = "Edit";
        } else {
            $scope.editButtonText = "Done";
        }
        $scope.showDelete = !$scope.showDelete;
    }

    $scope.deleteExercise = function(hep, index) {
        Exercise
            .deleteExercise(hep)
            .then( function(success) {
                console.log(success);
                Patient
                .removeFromPatientLog($scope.currentPatient.PatientLogID, hep.Name);
            }, function(error) {
                console.log(error);
            })
        $scope.currentHEP.splice(index, 1);
    }

    $scope.assignFromLibrary = function(){
      $state.go('app.myLibrary', {status: 'add', patientID: $stateParams.patientID, logID: $scope.currentPatient.PatientLogID});
    }

     $scope.filmExercise = function() {

        $scope.patientID = $stateParams.patientID;
        var options = { limit: 1, duration: 20, quality: 0};

        $cordovaCapture.captureVideo(options).then(function(videoData) {
            $scope.img = "";
            $scope.videoData = videoData[0];
            $ionicLoading.show({
                template: '<ion-spinner icon="lines" class="spinner-royal"></ion-spinner><p>Creating Thumbnail</p>'
            })
             createThumbnail(videoData[0]);
        }, function(err) {
            Session.sendError("Error on cordova capture " + err);
        });
    }

    $ionicModal.fromTemplateUrl('templates/assignExerciseModal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
        $scope.exercise = {
            'days': 'Every Day',
            'perDay': '1',
            'sets': '0',
            'reps': '0'
        };
    });

    $scope.assignExerciseModal = function() {
        $ionicLoading.hide();
        $scope.title = "Assign Exercise";
        $scope.exercise = {
            'days': 'Every Day',
            'perDay': '1',
            'sets': '0',
            'reps': '0'
        };
        $scope.modal.show();
    };

    $scope.exercise = {
        'days': 'Every Day',
        'perDay': '1',
        'sets': '0',
        'reps': '0'
    };

    $scope.assignExercise = function() {
        if($scope.title == "Update Exercise") {
            Exercise.updateExercise($scope.exercise)
            .then(function(success) {
                console.log(success);
                $scope.closeModal();
                successToast("Exercise Updated Successfully");

            }, function(error){
                $scope.closeModal();
                successToast("An Error Occured.");
            })
        } else if($scope.title == "Assign Exercise"){
             $ionicLoading.show({
                template: '<ion-spinner icon="lines" class="spinner-royal"></ion-spinner><p>Uploading Exercise</p>'
            });
            //exercise days to Array
            $scope.exerciseDays = $scope.exercise.days;
            convertDaysToArray($scope.exercise.days);
            $scope.formSubmitted = true;
            $scope.$broadcast('blob-saved');
        }
    }

    $scope.closeModal = function(message) {
        $scope.exercise = {};
        $scope.modal.hide();
    }
    // Cleanup the modal when we're done with it
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

    var convertDaysToArray = function(days){
        switch(days) {
            case 'Everyday':
                $scope.exercise.days = ['1','1','1','1','1','1','1']
                break;
            case 'Week Days':
                $scope.exercise.days = ['0','1','1','1','1','1','0']
                break;
            case 'Every Other Day':
                $scope.exercise.days = ['1','0','1','0','1','0','1']
                break;
            default:
                $scope.exercise.days = ['1','1','1','1','1','1','1']
                break;

        }
    }

    var deleteFile = function(filePath){
      if($scope.fullPath){
        var fullFilePath = "file://" + filePath;
        $scope.fullPath = false;
      }
      else{
        var fullFilePath = filePath;

      }
        $timeout(function() {
          window.resolveLocalFileSystemURL(fullFilePath, function (file) {
            file.remove(function () {
            }, function(error){console.log(error)});
          }, function(error){console.log(error)});
        }, 3000);
    }


    var makeName = function()
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    var createThumbnail = function(file) {

        var imgFileName = makeName();
        $timeout(function(){
            VideoEditor.createThumbnail(
                createThumbnailSuccess,
                createThumbnailError,
                {
                    fileUri: file.fullPath,
                    outputFileName: imgFileName,
                    atTime: 2,
                    width: 320,
                    height: 480,
                    quality: 100
                }
            );
        }, 3000)

        function createThumbnailSuccess(result) {
            // result is the path to the jpeg image on the device
            $scope.imgPath = result;
            $scope.img = "file://" + result;
           
            //Just added this here. Still fires on broadcast - video saved
            //Save Video Blob
            if(ionic.Platform.isIOS()){
                transcodeVideo($scope.videoData);
            } else {
                fileToBlob($scope.videoData, "video")
            }
            //Save Img blob
            fileToBlob($scope.img, "img")
            //End block

            $scope.assignExerciseModal();

        }

        function createThumbnailError(err) {
            $ionicLoading.hide();
            successToast("Error: Video must be at least 2 sec.");
            console.log(err);
        }
    }

    var transcodeVideo = function(file) {
        $timeout(function(){

            var videoFileName = makeName();;

            VideoEditor.transcodeVideo(
                videoTranscodeSuccess,
                videoTranscodeError,
                {
                    fileUri: file.fullPath,
                    outputFileName: videoFileName,
                    outputFileType: VideoEditorOptions.OutputFileType.MPEG4,
                    optimizeForNetworkUse: VideoEditorOptions.OptimizeForNetworkUse.YES,
                    saveToLibrary: false,
                    maintainAspectRatio: true,
                    width: 640,
                    height: 640,
                    videoBitrate: 1000000, // 1 megabit
                    audioChannels: 2,
                    audioSampleRate: 44100,
                    audioBitrate: 128000, // 128 kilobits
                    progress: function(info) {}
                }
            );
        },3000)

        function videoTranscodeSuccess(result) {
            // result is the path to the transcoded video on the device
            $scope.videoPath = result;
            fileToBlob("file://" + result, "video");
        }

        function videoTranscodeError(err) {
            console.log('videoTranscodeError, err: ' + err);
        }
    }

    var fileToBlob = function(file, type){
      if(typeof file == 'string'){
        var filePath = file;
      }
      else{
        var filePath = file.fullPath;
      }
      if(!$scope.videoPath){
        $scope.videoPath = filePath;
        $scope.fullPath = true;
      }
        window.resolveLocalFileSystemURL(filePath, function(entry) {
                entry.file(
                function(file){

                    create_blob(file, function(blob_string) {
                        var b64data = blob_string.split(',')[1];
                        if(type === "video") {
                            var blob = new Blob([blob_string], {type: "video/mp4"});
                        } else if(type === "img"){
                            $scope.imgBlobString = blob_string;
                            var blob = new Blob([blob_string], {type: "image/jpg"});
                        }
                        sendToTrueVault(blob, type);
                    });

                    function create_blob(file, callback) {
                        var reader = new FileReader();
                        reader.onload = function() {
                            callback(reader.result)
                        };
                        reader.readAsDataURL(file);
                    }
                },
                function(fail) {
                    alert("Unable to find video file. Please try again.")
                })

            }, function(error){
                console.log(error);
            });
    }

    var sendToTrueVault = function(file, type){
        Exercise
            .saveFile(file, type, $scope.exercise.name)
            .then(function successCallback(response) {
                 console.log(response);
                 if(type == 'video') {
                     $scope.videoBlobID = response.data.blob_id;
                   $scope.videoSaved = true;
                 }else if(type == 'img'){
                     $scope.imgBlobID = response.data.blob_id;
                   $scope.imgSaved = true;
                 }
                 //use broadcast to avoid callback hell
                 $scope.$broadcast('blob-saved');
            }, function errorCallback(response) {
                console.log(response)
                Session.sendError("Error failed on save video to truevault ")
            });
    }

    $scope.$on('blob-saved', function(event, args) {
        if($scope.videoSaved && $scope.imgSaved && $scope.formSubmitted){
            Patient
                .updatePatientLog($scope.currentPatient.PatientLogID, $scope.exercise.name, $scope.exerciseDays);

            Exercise
                .assignExercise($scope.exercise, $scope.patientID, $scope.videoBlobID, $scope.imgBlobID)
                .then(function(result){
                    deleteFile($scope.imgPath);
                    deleteFile($scope.videoPath);
                    $scope.videoSaved = false;
                    $scope.imgSaved = false;
                    $scope.formSubmitted = false;
                    $ionicLoading.hide();
                    $scope.modal.hide();
                    $scope.exercise.document_id = result.data.document_id;
                    successToast("Success!");
                    addToCurrent($scope.exercise, $scope.imgBlobString);

                },
                function(error){
                    $ionicLoading.hide();
                    Session.sendError("Failed to assign Exercises to patient after blob save")
                    alert("failed to assign Exercise");
                })
          Analytics.therapistUsage(Session.user.username, 'snap');
        }
    });

    var addToCurrent = function(exercise, img) {
        if(exercise.upperSets){
            exercise.sets += "-" + exercise.upperSets
        }
        if(exercise.upperReps){
            exercise.reps += "-" + exercise.upperReps
        }
        if(exercise.upperPerDay){
            exercise.perDay += "-" + exercise.upperPerDay
        }
        
        $scope.currentHEP.push({
            Name: exercise.name,
            Sets: exercise.sets,
            Reps: exercise.reps,
            Description: exercise.description,
            Hold: exercise.hold,
            Frequency: exercise.perDay,
            Img: img,
            ID: exercise.document_id
        })
    }


    var reset = function() {
        var inClass = document.querySelectorAll('.in');
        for (var i = 0; i < inClass.length; i++) {
            inClass[i].classList.remove('in');
            inClass[i].removeAttribute('style');
        }
        var done = document.querySelectorAll('.done');
        for (var i = 0; i < done.length; i++) {
            done[i].classList.remove('done');
            done[i].removeAttribute('style');
        }
        var ionList = document.getElementsByTagName('ion-list');
        for (var i = 0; i < ionList.length; i++) {
            var toRemove = ionList[i].className;
            if (/animate-/.test(toRemove)) {
                ionList[i].className = ionList[i].className.replace(/(?:^|\s)animate-\S*(?:$|\s)/, '');
            }
        }
    };

    $scope.showFeedback = function(){
        $ionicModal.fromTemplateUrl('templates/feedbackModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.feedbackModal = modal;
            $scope.feedbackModal.show();
            
            var messageCount;
            if($scope.currentPatient.MessagesForPatient){
                messageCount = MessagesForPatient + 1;
            }
            else{
                messageCount = 0;
            }
            $scope.updateSeenMessages(0, messageCount);
            $timeout(function() {
                $ionicScrollDelegate.scrollBottom(true);
            }, 300);
        });
    }

    $scope.closeFeedbackModal = function() {
        $scope.feedbackModal.hide();
        $scope.pushSent = false;
    }

    $scope.blinds = function() {
        reset();
        document.getElementsByTagName('ion-list')[0].className += 'animate-blinds';
        setTimeout(function() {
            console.log(ionicMaterialMotion);
            ionicMaterialMotion.blinds();
        }, 500);
    };

    $scope.blinds();

//messaging stuff


$scope.hideTime = true;

$scope.pushSent = false;

isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();

  $scope.sendMessage = function() {
    $scope.data.message = $scope.data.message.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/, "");    
    
    if($scope.data.message && $scope.data.message != ""){


        $scope.messages.push({
        PatientID: $scope.currentPatient.PatientID,
            Timestamp: new Date().toString('MMM dd hh:mm tt'),
            Title: "",
            Message: $scope.data.message,
            From: 'therapist',
            ClinicID: Session.user.attributes.ClinicID
        });

        Patient
            .sendMessage($scope.currentPatient.PatientID, $scope.data.message)
            .then( function(success) {
                console.log(success)
                if($scope.pushSent == false){
                    Patient.sendPush($scope.currentPatient.deviceToken)
                    $scope.pushSent = true;
                }
            }, function(error) {
                console.log(error);
            })
        

        var messageCount;
        if($scope.currentPatient.MessagesForPatient){
            messageCount = $scope.currentPatient.MessagesForPatient + 1;
        }
        else{
            messageCount = 1;
        }
        $scope.updateSeenMessages(0, messageCount);

        delete $scope.data.message;
        $ionicScrollDelegate.scrollBottom(true);
    }
  };


  $scope.inputUp = function() {
    if (isIOS){
        $scope.data.keyboardHeight = 216;
    }
    $timeout(function() {
      $ionicScrollDelegate.scrollBottom(true);
    }, 300);

  };

  $scope.inputDown = function() {
    if (isIOS) $scope.data.keyboardHeight = 0;
    $ionicScrollDelegate.resize();
  };

  $scope.closeKeyboard = function() {
    // cordova.plugins.Keyboard.close();
  };

    Patient
        .getMessages($scope.currentPatient.PatientID)
        .then( function(success) {
            $scope.messages = success;
        }, function(error) {
            console.log(error);
        })

    $scope.updateSeenMessages = function(messagesForTherapst, messagesForPatient){
        $scope.currentPatient.MessagesForTherapist = messagesForTherapst;
        $scope.currentPatient.MessagesForPatient = messagesForPatient;

        Patient.updatePatient($scope.currentPatient.document_id, $scope.currentPatient)
            .then(function(response){
                
            })
    }

  $scope.data = {};

});
