'use strict';

var app = angular.module('app', [
    'btlRoute'
]);

app.config(['btlRouteProvider', '$locationProvider', function (btlRouteProvider, $locationProvider)
{
    btlRouteProvider.printDebug(true);
    // btlRouteProvider.ignoreNested(false);

    // $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
}]);

app.run(['$rootScope', '$location', function ($rootScope, $location)
{
    $rootScope.location = $location;
}]);

app.controller('appController', ['$scope', '$window', 'btlRoute', 'timerService', function ($scope, $window, btlRoute, timerService)
{
    timerService.instrument($scope);
}]);

app.service("timerService", ['$interval', function ($interval)
{
    return {
        instrument: function instrument($scope)
        {
            var scopeCreated = Date.now();
            var computeAge = function ()
            {
                var delta = Date.now() - scopeCreated;
                $scope.ageMs = delta;
                $scope.age = Math.floor(delta / 1000);
            };
            computeAge();
            var intervalPromise = $interval(computeAge, 1000);
            $scope.$on("$destroy", function ()
            {
                $interval.cancel(intervalPromise);
            })
        }
    }
}]);
