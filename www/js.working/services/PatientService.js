app.factory('Patient', function($http, $httpParamSerializerJQLike, $q, Session, ID) {

  return {
    patients: [],

    getAll: function () {

      var self = this;
      self.patients = [];
      var queryParams = JSON.stringify({
        "filter": {
          "TherapistID": {
            "type": "eq",
            "value": Session.user.user_id
          },
          "Deleted": {
            "type": "eq",
            "value": false
          }
        },
        "filter_type": 'and',
        "full_document": true,
        "per_page": 500, 
        "schema_id": ID[Session.user.attributes.AccountType].PatientSchema
      });

      var defer = $q.defer();
      $http({
        method: 'POST',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientVault + '/search',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
        },
        data: $httpParamSerializerJQLike({
          search_option: btoa(queryParams)
        })
      }).then(function successCallback(response) {
        angular.forEach(response.data.data.documents, function (val) {
          self.patients.push({document: JSON.parse(atob(val.document)), documentID: val.document_id});
        });
        defer.resolve(self.patients);
      }, function errorCallback(error) {
        defer.reject(error);
      });
      return defer.promise;
    },

    createUser: function (email) {

      var accountData = JSON.stringify(
        {
          TherapistID: Session.user.user_id,
          AccountType: Session.user.attributes.AccountType
        });
      return $http({
        method: 'POST',
        url: 'https://api.truevault.com/v1/users',
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          username: email,
          password: 'firstPassword',
          attributes: btoa(accountData)
        })
      })
    },

    addPatient: function (patient, patientID, patientLogID) {

      var theData = {
        PatientID: patientID,
        FirstName: patient.firstName,
        LastName: patient.lastName,
        Email: patient.email,
        BodyPart: "body",
        ClinicID: Session.user.attributes.ClinicID,
        TherapistID: Session.user.user_id,
        GoalsSet: false,
        Discharged: false,
        Deleted: false,
        LastActive: Date.today().toString("yyyy-MM-dd"),
        Activated: false,
        PatientLogID: patientLogID
      }
      if(patient.tel){theData.PhoneNumber = patient.tel}
      var newData = JSON.stringify(theData);

      return $http({
        method: 'POST',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientVault + '/documents',
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          document: btoa(newData),
          schema_id: ID[Session.user.attributes.AccountType].PatientSchema
        })
      })
    },

    createPatientLog: function (patientID) {
      var date = Date.today().toString("yyyy-MM-dd");
      var theData = {
        currentScore: 0,
        totalAssigned: 0,
        totalCompleted: 0,
        lastDate: date,
        PatientID: patientID
      }
      var newData = JSON.stringify(theData);

      return $http({
        method: 'POST',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientLogVault + '/documents',
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          document: btoa(newData)
        })
      })
    },

    emailPatient: function (patient, code) {
      var req = {
        method: 'POST',
        url: 'https://healthconnection.io/app/php/sendPatientEmail.php',
        data: {
          'email': patient.email, 
          'template': 'patient-welcome-email-2-code',
          'ptName': Session.user.attributes.FirstName,
          'patientName': patient.firstName,
          'organization': Session.user.attributes.Organization,
          'code': code,
          'phoneNumber': patient.tel
        }
      }

      return $http(req)
    },

    addPatientToGroup: function (patientID) {
      return $http({
        method: 'POST',
        url: 'https://healthconnection.io/hcPassword/php/addToGroupFromApp.php',
        data: {
          userID: patientID
        }
      })
    },

    dischargePatient: function (patientIndex) {
      var patient = this.patients[patientIndex];
      patient.document.Discharged = true;
      var newData = JSON.stringify(patient.document);
      $http({
        method: 'PUT',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientVault + '/documents/' + patient.documentID,
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          document: btoa(newData)
        })
      }).then(function successCallback(response) {
        console.log(response)
      }, function errorCallback(response) {
        console.log(response)
      });
      return null;
    },

    deletePatient: function (patientIndex) {
      var patient = this.patients[patientIndex];
      patient.document.Deleted = true;
      var newData = JSON.stringify(patient.document);
      $http({
        method: 'PUT',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientVault + '/documents/' + patient.documentID,
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          document: btoa(newData)
        })
      }).then(function successCallback(response) {
        console.log(response)
      }, function errorCallback(response) {
        console.log(response)
      });
    },
    removeFromPatientLog: function (patientLogID, exerciseName) {
      $http({
        method: 'GET',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientLogVault + '/documents/' + patientLogID,
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(function successCallback(response) {
        var patientLog = {document: JSON.parse(atob(response.data)), documentID: patientLogID};
        var today = Date.today();
        while (patientLog.document[today.toString('M-dd-yyyy')]) {
          angular.forEach(patientLog.document[today.toString('M-dd-yyyy')].exercises, function (val, index) {
            if (val.exerciseName === exerciseName) {
              patientLog.document[today.toString('M-dd-yyyy')].exercises.splice(index, 1);
              patientLog.document[today.toString('M-dd-yyyy')].assigned--;
            }
          })
          today.addDays(1);
        }
        var newData = JSON.stringify(patientLog.document);
        $http({
          method: 'PUT',
          url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientLogVault + '/documents/' + patientLogID,
          headers: {
            'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: $httpParamSerializerJQLike({
            document: btoa(newData)
          })
        }).then(
          function successCallback(response) {
            console.log(response);
          }, function errorCallback(response) {
            console.log(response)
          }
        );
      }, function errorCallback(response) {
        console.log(response)
      });
    },

    updatePatient: function(documentID, patientInfo) {
      var defer = $q.defer();
      var newData = JSON.stringify(patientInfo);
      $http({
        method: 'PUT',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientVault + '/documents/' + documentID,
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          document: btoa(newData)
        })
      }).then(function successCallback(response) {
        defer.resolve(response)
      }, function errorCallback(response) {
        defer.reject(response)
      });

      return defer.promise
    },
    updatePatientLog: function (patientLogID, exerciseName, exerciseDays) {

      $http({
        method: 'GET',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientLogVault + '/documents/' + patientLogID,
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(function successCallback(response) {
        var patientLog = {document: JSON.parse(atob(response.data)), documentID: patientLogID};
        var dateIndex = 0;
        for (var i = 0; i <= 200; i++) {

          var theDate = Date.today().addDays(i).toString('M-dd-yyyy');
          if (!patientLog.document[theDate]) {
            //create a new log entry
            patientLog.document[theDate] = {"completed": 0, "assigned": 0, exercises: []};
          }
        }

        for (var i = 0; i <= 90; i++) {

          var theDate = Date.today().addDays(dateIndex).toString('M-dd-yyyy');
          switch (exerciseDays) {
            case 'Everyday':
              dateIndex++;
              break;
            case 'Every Other Day':
              if(Date.today().addDays(dateIndex).is().saturday()) {
                dateIndex++;
              } else {
                dateIndex += 2;
              }
              break;
            case 'Week Days':
              if (Date.today().addDays(dateIndex + 1).is().weekday()) {
                dateIndex++;
              } else {
                dateIndex += 3;
              }
              break;
            default:
              dateIndex++;
              break;
          }

          patientLog.document[theDate].assigned += 1;
          patientLog.document[theDate].exercises.push({"exerciseName": exerciseName, "completed": false})
        }

        var newData = JSON.stringify(patientLog.document);
        $http({
          method: 'PUT',
          url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientLogVault + '/documents/' + patientLogID,
          headers: {
            'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: $httpParamSerializerJQLike({
            document: btoa(newData)
          })
        }).then(
          function successCallback(response) {
            console.log(response);
          }, function errorCallback(response) {
            console.log(response)
          }
        );
      }, function errorCallback(response) {
        console.log(response)
      });
    },
    getPatientRequests: function () {
      var queryParams = JSON.stringify({
        "filter": {
          "SharedTo": {
            "type": "eq",
            "value": Session.user.attributes.Email
          },
          "Deleted": {
            "type": "eq",
            "value": false
          }
        },
        "filter_type": 'and',
        "full_document": true,
        "schema_id": ID[Session.user.attributes.AccountType].SharePatientSchema
      });

      var defer = $q.defer();
      $http({
        method: 'POST',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].ShareVault + '/search',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
        },
        data: $httpParamSerializerJQLike({
          search_option: btoa(queryParams)
        })
      }).then(function successCallback(response) {
        var requests = [];
        var patientDocuments = response.data.data.documents;
        patientDocuments.forEach(function(patientDocumentData){
          var patientData = JSON.parse(atob(patientDocumentData.document))
          requests.push(
            {
              document: patientData,
              DocumentID: patientDocumentData.document_id
            }
          )
        })
        console.log(requests)
        //PatientList.mirrorPatientObject(patientData, Session.user.user_id)
        defer.resolve(requests);
      }, function errorCallback(error) {
        defer.reject();
      });
      return defer.promise;
    },
    //For Edit Patient
    //Update Patient Log with new patient ID
    editPatientLog: function(logID, patientID) {
       $http({
        method: 'GET',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientLogVault + '/documents/' + logID,
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(function successCallback(response) {
        var patientLog = {document: JSON.parse(atob(response.data)), documentID: logID};
        patientLog.document.PatientID = patientID;

        var newData = JSON.stringify(patientLog.document);
        $http({
          method: 'PUT',
          url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientLogVault + '/documents/' + logID,
          headers: {
            'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: $httpParamSerializerJQLike({
            document: btoa(newData)
          })
        }).then(
          function successCallback(response) {
            console.log(response);
          }, function errorCallback(response) {
            console.log(response)
          }
        );
      }, function errorCallback(response) {
        console.log(response)
      });
    },
    shareAccount: function(patient, shareEmail) {
      console.log(this.user);

      var theData = {
        PatientID: patient.document.PatientID,
        FirstName: patient.document.FirstName,
        LastName: patient.document.LastName,
        Email: patient.document.Email,
        BodyPart: patient.document.BodyPart,
        ClinicID: patient.document.ClinicID,
        TherapistID: patient.document.TherapistID,
        DOB: patient.document.DOB,
        Age: patient.document.Age,
        GoalsSet: patient.document.GoalsSet,
        Discharged: false,
        Deleted: false,
        LastActive: patient.document.LastActive,
        Activated: true,
        PatientLogID: patient.document.PatientLogID,
        PatientChatID: patient.document.PatientChatID,
        DeviceToken: patient.document.DeviceToken,
        SharedTo: shareEmail
      }

      var patientShareInfo = JSON.stringify(theData);

      var defer = $q.defer();
      $http({
        method: 'POST',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].ShareVault + '/documents',
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          document: btoa(patientShareInfo),
          schema_id: ID[Session.user.attributes.AccountType].SharePatientSchema
        })
      }).then(function successCallback(response) {
        defer.resolve();
      }, function errorCallback(response) {
        defer.reject();
        console.log(response)
      });
      return defer.promise;
    },
    addSharedAccount: function(patient) {
      var theData = {
        PatientID: patient.document.PatientID,
        FirstName: patient.document.FirstName,
        LastName: patient.document.LastName,
        Email: patient.document.Email,
        BodyPart: patient.document.BodyPart,
        ClinicID: Session.user.attributes.ClinicID,
        TherapistID: Session.user.user_id,
        GoalsSet: patient.document.GoalsSet,
        Discharged: false,
        Deleted: false,
        LastActive: Date.today().toString("yyyy-MM-dd"),
        Activated: patient.document.Activated,
        PatientLogID: patient.document.PatientLogID
      }
      var newData = JSON.stringify(theData);

      return $http({
        method: 'POST',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].PatientVault + '/documents',
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          document: btoa(newData),
          schema_id: ID[Session.user.attributes.AccountType].PatientSchema
        })
      })
    },
    deleteShare: function(patient) {
      patient.document.Deleted = true;
      var newData = JSON.stringify(patient.document);
      $http({
        method: 'PUT',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].ShareVault + '/documents/' + patient.DocumentID,
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          document: btoa(newData)
        })
      }).then(function successCallback(response) {
        console.log(response)
      }, function errorCallback(response) {
        console.log(response)
      });
    },

    getFeedback: function(){
      var queryParams = JSON.stringify({
        "filter": {
          "ClinicID": {
            "type": "eq",
            "value": Session.user.attributes.ClinicID
          }
        },
        "filter_type": 'and',
        "per_page": 500,
        "full_document": true,
        "schema_id": ID[Session.user.attributes.AccountType].FeedbackSchema
      });

      var defer = $q.defer();
      $http({
        method: 'POST',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].FeedbackVault + '/search',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
        },
        data: $httpParamSerializerJQLike({
          search_option: btoa(queryParams)
        })
      }).then(function successCallback(response) {
        var patientFeedback = response.data.data.documents;
        var feedback = {};
        patientFeedback.forEach(function(patientFeedbackData){
          var patientFeedback = JSON.parse(atob(patientFeedbackData.document))
          if(!feedback[patientFeedback.PatientID]){
            feedback[patientFeedback.PatientID] = {'Unseen': 0, array: []};
          }
          feedback[patientFeedback.PatientID].array.push({'documentID': patientFeedbackData.document_id, 'document': patientFeedback});
          if(patientFeedback.Seen == false){
            feedback[patientFeedback.PatientID].Unseen++;
          }
        })
        defer.resolve(feedback);
      }, function errorCallback(error) {
        defer.reject();
      });
      return defer.promise;
    },
    
    markFeedback: function(feedback){
      var newData = JSON.stringify(feedback.document);
      $http({
        method: 'PUT',
        url: 'https://api.truevault.com/v1/vaults/' + ID[Session.user.attributes.AccountType].FeedbackVault + '/documents/' + feedback.documentID,
        headers: {
          'Authorization': 'Basic ' + btoa(Session.user.access_token + ':'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: $httpParamSerializerJQLike({
          document: btoa(newData)
        })
      }).then(function successCallback(response) {
        console.log(response)
      }, function errorCallback(response) {
        console.log(response)
      });
    },

    sendDischargeSurvey: function(survey, index) {
      var patient = this.patients[index];  
      console.log(patient);
       var req = {
        method: 'POST',
        url: 'https://healthsnaps.com/app/php/sendDischargeEmail.php',
        data: {
          'email': patient.document.Email, 
          'template': 'discharge-survey',
          'organization': Session.user.attributes.Organization,
          'url': survey,
        }
      }

      return $http(req)


    }
  }
});
