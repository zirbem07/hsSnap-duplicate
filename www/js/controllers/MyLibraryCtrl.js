app.controller('MyLibraryCtrl', function ($rootScope, $scope, $state, $stateParams, $ionicNavBarDelegate, ionicMaterialMotion, $cordovaCapture, $ionicModal, $ionicLoading, $timeout, $ionicPopup, Session, Patient, libraryItems, Exercise, ionicToast, Analytics) {

    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.$parent.setHeaderFab('right');
    $scope.showDelete = false;
    $scope.editButtonText = "Edit";
    $scope.myLibrary = [].concat(libraryItems);

  $scope.status = $stateParams.status;
  $scope.data = {checked: window.localStorage.getItem("understood") || false}

  $scope.showConfirm = function() {
    if(!$scope.data.checked){
      var confirmPopup = $ionicPopup.show({
      title: 'Do Not Film Patients!',
      template: 'Due to HIPAA you are not allowed to film patients using this feature. The My Library feature is intended for you to build a exercise library filming yourself or co-workers. <ion-checkbox style="border: none" class="item-text-wrap" ng-model="data.checked">I understand, do not show this again.</ion-checkbox>',
      scope: $scope,
      buttons: [
        {text: 'Cancel'},
        {
          text: 'OK',
          type: 'button-calm',
          onTap: function(e){
            if($scope.data.checked) {
              //save to storage
              window.localStorage.setItem("understood", true)
              return true
            }
            return true;
          }
        }
      ]

    });

  
  } else {
      $scope.filmExercise();
  }
  
      confirmPopup.then(function(res) {
      if(res) {
        $scope.filmExercise();
      } else {

      }
    });
  };

  $scope.filmExercise = function() {

    //$scope.patientID = $stateParams.patientID;
    var options = { limit: 1, duration: 20, quality: 0};

    $cordovaCapture.captureVideo(options).then(function(videoData) {
      //create thumbnail
      $scope.img = "";
      $scope.videoData = videoData[0];
      console.log($scope.videoData)
      var text = "VIDEO";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      $scope.videoName = text;
      //upload to s3
      $scope.getSignedURL($scope.videoName, 'video')

      $ionicLoading.show({
        template: '<ion-spinner icon="lines" class="spinner-royal"></ion-spinner><p>Creating Thumbnail</p>'
      })
      createThumbnail(videoData[0]);
    }, function(err) {
    });
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
    console.log(file.fullPath);

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
      console.log("created thumbnail " + result)
      $scope.imgPath = result;
      $scope.img = "file://" + result;
      $scope.createExerciseModal();
      var text = "IMG";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      $scope.imgName = text;
      $scope.getSignedURL($scope.imgName, 'image')
      $ionicLoading.hide();


    }

    function createThumbnailError(err) {
      // result is the path to the jpeg image on the device
      $ionicLoading.hide();
      successToast("Error: Video must be at least 2 sec.");
      console.log(err);
    }
  }

  $scope.exerciseModal = function(item, index){
    $scope.selectedIndex = index;
    if($stateParams.status === "manage"){
      $scope.editLibraryExerciseModal(item);
    } else {
      $scope.assignExerciseModal(item);
    }
  }

  $scope.editLibraryExerciseModal = function(item) {
    $ionicModal.fromTemplateUrl('templates/editLibraryExerciseModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
      $scope.itemSelected = item;
      $scope.exercise = {};
      $scope.exercise.name = item.Name;
      $scope.exercise.description = item.Description;
      $scope.exercise.S3ImgURL = item.S3ImgURL;
      $scope.exercise.S3URL = item.S3URL;
      $scope.modal.show();
    });
  };

  $scope.assignExerciseModal = function(item) {
    $ionicModal.fromTemplateUrl('templates/assignLibraryExerciseModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
      $scope.videoToAssign = item;
      $scope.videoToAssign.name = item.Name;
      $scope.videoToAssign.days = "Every Day";
      $scope.videoToAssign.sets = 0;
      $scope.videoToAssign.reps = 0;
      $scope.videoToAssign.hold = '';
      $scope.videoToAssign.perDay = 0;
      $scope.videoToAssign.description = item.Description;
      $scope.title = "Assign Exercise";
      $scope.modal.show();
    });
  };

  $scope.closeModal = function() {
      $scope.modal.hide();
  }


  $scope.createExerciseModal = function() {
    $ionicModal.fromTemplateUrl('templates/createExerciseModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
      $scope.exercise = {};
      $scope.title = "Create Exercise";
      $scope.modal.show();
    });

  };

  $scope.getSignedURL = function(name, type){
    if(type == 'image'){
      var fileType = '.jpg'
    }
    else{
      if(ionic.Platform.isIOS()){
        var fileType = '.mov'
      }
      else {
        var fileType = '.mp4'
      }
    }
    Exercise.getSignedURL(name + fileType).then(
      function(signedURL){
        console.log(signedURL)
        $scope.upload(signedURL.data, type)
      },
      function(error){
        Session.sendError("failed to get signed URL library")
      }
    )
  };

  $scope.imgSaved = false;
  $scope.videoSaved = false;

  $scope.upload = function(signedURL, type){

    if(type == 'image'){
      var filePath = $scope.imgPath;
      var fileType = 'image/jpeg';
    }
    else{
      var filePath = $scope.videoData.fullPath;
      if(ionic.Platform.isIOS()){
        var fileType = 'video/mov';
      }
      else {
        var fileType = 'video/mp4';
      }
    }

    var options = new FileUploadOptions();
    options.chunkedMode = false;
    options.httpMethod = 'PUT';
    options.headers = {
      'Content-Type': fileType
    };

    var ft = new FileTransfer();
    ft.upload(filePath, signedURL, function (success) {
      console.log(success)
      if(type == 'image'){
        $scope.imgSaved = true;
        $scope.$broadcast('saved');
      }
      else{
        $scope.videoSaved = true;
        $scope.$broadcast('saved');
      }

    }, function (error) {
      console.log(error)
    }, options);
  }


  var successToast = function(message) {
    if(message){
      ionicToast.show(message, 'top', false, 3000);
    } else  {
      ionicToast.show('Success!', 'top', false, 3000);
    }
  }

  $scope.createExercise = function(){

    $ionicLoading.show({
      template: '<ion-spinner icon="lines" class="spinner-royal"></ion-spinner><p>Uploading Video</p>'
    })

    if(ionic.Platform.isIOS()){
      var videoType = '.mov'
    }
    else{
      var videoType = '.mp4'
    }

    $scope.snapInfo =
    {
      S3URL: 'https://s3.us-east-2.amazonaws.com/ptmylibrary/' + $scope.videoName + videoType,
      S3ImgURL: 'https://s3.us-east-2.amazonaws.com/ptmylibrary/' + $scope.imgName + '.jpg',
      Name: $scope.exercise.name,
      Description: $scope.exercise.description
    }

    Analytics.therapistUsage(Session.user.username, 'library');

    //save to hcDB
    Exercise.saveSnapLibrary($scope.snapInfo).then(
      function(success){
        $scope.snapInfo.SnapVideoID = success.id;
        $scope.snapInfo.TherapistID = Session.user.user_id;
        $scope.myLibrary.push($scope.snapInfo);
    },function(error){

      });

      $scope.formSubmitted = true;
      $scope.$broadcast('saved'); 

  }

  $scope.$on('saved', function(event, args) {
    if($scope.videoSaved && $scope.imgSaved && $scope.formSubmitted){
      $scope.imgSaved = false;
      $scope.videoSaved = false;
      $scope.formSubmitted = false;

      $ionicLoading.hide();
      $scope.modal.hide();
    }
  });

  $scope.assignLibraryExercise = function(){
    switch($scope.videoToAssign.days){
      case 'Everyday':
          $scope.videoToAssign.days = ['1','1','1','1','1','1','1']
          break;
      case 'Week Days':
          $scope.videoToAssign.days = ['0','1','1','1','1','1','0']
          break;
      case 'Every Other Day':
          $scope.videoToAssign.days = ['1','0','1','0','1','0','1']
          break;
      default:
          $scope.videoToAssign.days = ['1','1','1','1','1','1','1']
          break;

    }
    Exercise.assignLibraryExercise($scope.videoToAssign, $stateParams.patientID)
    
    Patient
      .updatePatientLog($stateParams.logID, $scope.videoToAssign.name, $scope.videoToAssign.days);

    ionicToast.show('Exercise Assigned', 'top', false, 3000);
    $scope.modal.hide();
  }

  $scope.updateExercise = function(){
    $scope.itemSelected.Description = $scope.exercise.description;
    $scope.itemSelected.Name = $scope.exercise.name;
    $scope.itemSelected.TherapistID = Session.user.user_id;
    Exercise.updateLibraryExercise($scope.itemSelected).then(function(){
      ionicToast.show('Exercise Updated', 'top', false, 3000);
      $scope.modal.hide();
    })
    
  }

  $scope.deleteExercise = function(){
    var confirmPopup = $ionicPopup.confirm({
      title: 'Delete Exercise',
      template: 'Are you sure you want to delete this exercise?'
    });

   confirmPopup.then(function(res) {
     if(res) {
       Exercise.deleteLibraryExercise($scope.itemSelected).then(function(){
         $scope.myLibrary.splice($scope.selectedIndex, 1);
         ionicToast.show('Exercise Deleted', 'top', false, 3000);
         $scope.modal.hide();
       })
        
     } else {
       console.log('You are not sure');
     }
   });
    

  }

});
