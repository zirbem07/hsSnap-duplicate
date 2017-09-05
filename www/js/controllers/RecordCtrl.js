app.controller('RecordCtrl', function ($scope) {

    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();

    $scope.clearFabs = function() {
        var fabs = document.getElementById('fab-add-patient');
        if (fabs) {
            console.log("removed");
            fabs.remove();
        }
    }
                 
});