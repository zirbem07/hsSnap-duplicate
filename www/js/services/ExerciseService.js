app.factory('Exercise', function($http, $httpParamSerializerJQLike, $q, Session, api, ID) {

    return {
        currentExercise: {},
        saveFile: function(file, type, fileName) {

            var vaultID = ""
            if(type  == 'video') {
                vaultID = ID[Session.user.attributes.AccountType].PatientVideo;
                fileName += '.mp4';
            } else if(type == 'img') {
                vaultID = ID[Session.user.attributes.AccountType].PatientImg;
                fileName += '.jpg';
            } else {
                return false;
            }

            formData = new FormData()
            formData.append("file", file, fileName);
            return $http({
                method: 'POST',
                url: 'https://api.truevault.com/v1/vaults/'+ vaultID +'/blobs',
                data: formData,
                transformRequest: angular.identity,
                headers: {
                    'Authorization': 'Basic ' + btoa('eaa1d6fc-14b0-4005-8bcb-991fa16fab22:'),
                    'Content-Type': undefined
                }
            })
         },
         updateExercise: function(exerciseData){

            var exercise = this.currentExercise;
            exercise.Name = exerciseData.name;
            exercise.Description = exerciseData.description;
            exercise.Hold = exerciseData.hold;
            exercise.Frequency = exerciseData.perDay;
            exercise.Reps = exerciseData.reps;
            exercise.Sets = exerciseData.sets;
            if(exercise.VideoBlobID) {
                if (exercise.VideoBlobID != "") {
                    exercise.Video = "";
                }
            }
            if(exercise.ImgBlobID) {
                if (exercise.ImgBlobID != "") {
                    exercise.Img = "";
                }
            }

            var newData = JSON.stringify(exercise);
            return $http({
                method: 'PUT',
                url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].AssignedExerciseVault + '/documents/' + exercise.ID,
                headers: {
                    'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: $httpParamSerializerJQLike({
                    document: btoa(newData)
                })
            })
         },

         assignExercise: function(exerciseData, patientID, video, img){

            var date =  Date.today().toString("yyyy-MM-dd");
            var exercise = {};
            exercise.Name = exerciseData.name;
            exercise.BodyPart = "custom";
            exercise.Days = exerciseData.days.toString();
            exercise.Strength = 'custom';
            exercise.Hold = parseInt(exerciseData.hold) || 0;
            exercise.Equipment = 'custom';
            exercise.Deleted = false;
            exercise.Video = "";
            exercise.Img = "";
            exercise.TimeStamp = date;
            exercise.AssignedExerciseID = "";
            exercise.PatientID = patientID;
            exercise.Frequency = parseInt(exerciseData.perDay)|| 0;
            if(exerciseData.upperPerDay){
                exercise.Frequency += "-"+exerciseData.upperPerDay
            }
            exercise.Reps = parseInt(exerciseData.reps) || 0;
            if(exerciseData.upperReps){
                exercise.Reps += "-"+exerciseData.upperReps
            }
            exercise.Sets = parseInt(exerciseData.sets) || 0;
            if(exerciseData.upperSets ) {
                exercise.Sets += "-"+exerciseData.upperSets
            }
            exercise.VideoBlobID = video;
            exercise.ImgBlobID = img;
            exercise.Description = exerciseData.description
            var newData = JSON.stringify(exercise);

            return $http({
                method: 'POST',
                url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].AssignedExerciseVault + '/documents',
                headers: {
                    'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: $httpParamSerializerJQLike({
                    document: btoa(newData),
                    schema_id: ID[Session.user.attributes.AccountType].AssignedExerciseSchema
                })
            })
         },

         getCurrent: function(patientID) {
            var queryParams = JSON.stringify({
                "filter": {
                    "PatientID": {
                        "type": "eq",
                        "value": patientID
                    },
                    "Deleted": {
                        "type": "eq",
                        "value": false
                    }
                },
                "filter_type": 'and',
                "full_document": true,
                "schema_id": ID[Session.user.attributes.AccountType].AssignedExerciseSchema
            });

            var defer = $q.defer();
            $http({
                method: 'POST',
                url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].AssignedExerciseVault + '/search',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
                },
                data: $httpParamSerializerJQLike({
                    search_option: btoa(queryParams)
                })
            })
            .then( function(result) {
                var currentHEP = [];
                angular.forEach(result.data.data.documents, function(val) {
                    var cur = JSON.parse(atob(val.document))
                    cur.ID = val.document_id;
                    currentHEP.push(cur);
                })
                defer.resolve(currentHEP);
            })

            return defer.promise;
        },
        deleteExercise: function(exercise) {

            exercise.Deleted = true;
            if(exercise.ImgBlobID != ""){
                exercise.Img = "";
            }
            if(exercise.VideoBlobID != ""){
                exercise.Video = "";
            }
            var newData = JSON.stringify(exercise);
            return $http({
                method: 'PUT',
                url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].AssignedExerciseVault + '/documents/' + exercise.ID,
                headers: {
                    'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: $httpParamSerializerJQLike({
                    document: btoa(newData)
                })
            })
        },
        getThumbnail: function(blobID) {

            return $http({
                  method: 'GET',
                  url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientImg + '/blobs/' + blobID,
                  headers: {
                    'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                  },
                })
        },
        saveSnapLibrary: function(item) {

          var defer = $q.defer();

          api.SnapVideo.save(
            {
              S3URL: item.S3URL,
              S3ImgURL: item.S3ImgURL,
              Name: item.Name,
              Description: item.Description || "",
              TherapistID: Session.user.user_id
            },
            function(success){
              defer.resolve(success);

            },
            function(error){
              defer.reject(error);

            });
          return defer.promise;
        },
        getSnapLibrary: function() {

          var defer = $q.defer();

          api.SnapVideo.query({id: Session.user.user_id},
            function(success){
              defer.resolve(success);
            },
            function(error){
              defer.reject();

            });
          return defer.promise;
        },
        updateLibraryExercise: function(item) {
          console.log(item)
          var defer = $q.defer();

          api.SnapVideo.update({id: item.SnapVideoID}, item,
            function(success){
              defer.resolve(success);
            },
            function(error){
              defer.reject();

            });
          return defer.promise;
        },
        deleteLibraryExercise: function(item) {
          console.log(item)
          var defer = $q.defer();

          api.SnapVideo.delete({id: item.SnapVideoID},
            function(success){
              defer.resolve(success);
            },
            function(error){
              defer.reject();

            });
          return defer.promise;
        },
        getSignedURL: function(name) {

          var defer = $q.defer();
          $http({
            method: 'POST',
            url: 'http://healthconnection.io/s3PHP/getSignedURL.php',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: $httpParamSerializerJQLike({'fileName': name})
          }).then(function successCallback(response) {
            defer.resolve(response);

          }, function errorCallback(response) {
            defer.reject();

          });

          return defer.promise;
        },
        assignLibraryExercise: function(exerciseData, patientID){
 
          var date =  Date.today().toString("yyyy-MM-dd");
          var exercise = {};
          exercise.Name = exerciseData.name;
          exercise.BodyPart = "custom";
          exercise.Days = exerciseData.days.toString(); //updates needed
          exercise.Strength = 'custom';
          exercise.Hold = parseInt(exerciseData.hold)|| 0;
          exercise.Equipment = 'custom';
          exercise.Deleted = false;
          exercise.Video = exerciseData.S3URL;
          exercise.Img = exerciseData.S3ImgURL;
          exercise.TimeStamp = date;
          exercise.AssignedExerciseID = "";
          exercise.PatientID = patientID;
          exercise.Frequency = parseInt(exerciseData.perDay)|| 0;
          if(exerciseData.upperPerDay){
              exercise.Frequency += "-"+exerciseData.upperPerDay;
          }
          exercise.Reps = parseInt(exerciseData.reps) || 0;
          if(exerciseData.upperReps){
              exercise.Reps += "-"+exerciseData.upperReps;
          }
          exercise.Sets = parseInt(exerciseData.sets) || 0;
          if(exerciseData.upperSets){
              exercise.Sets += "-"+exerciseData.upperSets;
          }
          exercise.Description = exerciseData.description || "";
          var newData = JSON.stringify(exercise);

          return $http({
            method: 'POST',
            url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].AssignedExerciseVault + '/documents',
            headers: {
              'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: $httpParamSerializerJQLike({
              document: btoa(newData),
              schema_id: ID[Session.user.attributes.AccountType].AssignedExerciseSchema
            })
          })
        }
    }
});
