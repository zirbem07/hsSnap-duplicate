angular.module('starter.services', [])
  .directive('file', function() {
    return {
      restrict: 'AE',
      scope: {
        file: '@'
      },
      link: function(scope, el, attrs){
        el.bind('change', function(event){
          var files = event.target.files;
          var file = files[0];
          scope.file = file;
          scope.$parent.file = file;
          scope.$apply();
        });
      }
    };
  })
  .filter('reverse', function() {
    return function(items) {
      return items.slice().reverse();
    };
  });
