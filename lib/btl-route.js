var btlRoute = angular.module('btlRoute', []);

btlRoute.service('btlRoute', ['$rootScope', '$location', '$q', '$injector', function ($rootScope, $location, $q, $injector)
{
    function getTabH()
    {
        var _tabHierarchy = {};
        (function _getTabH(baseEl, tabHierarchyEl)
        {
            var paneChildren = baseEl.children('.tab-pane');
            paneChildren.each(function (index)
            {
                var newEl = {};
                tabHierarchyEl[paneChildren[index].id] = newEl;
                _getTabH($(paneChildren[index]).find('.tab-content:first'), newEl);
            });
        })($('.tab-content:first'), _tabHierarchy);
        return _tabHierarchy;
    }

    function findInTabH(tabToFind)
    {
        var foundArr = [];

        function _findInTabH(tabHierarchyEl, tabToFind, searchArr)
        {
            var paneChildren = tabHierarchyEl.children('.tab-pane');
            paneChildren.each(function (index)
            {
                var nSearchArr = angular.copy(searchArr);
                nSearchArr.push(paneChildren[index].id);
                if (paneChildren[index].id == tabToFind)
                    foundArr = nSearchArr;
                else
                    _findInTabH($(paneChildren[index]).find('.tab-content:first'), tabToFind, nSearchArr);
            });
        }

        _findInTabH($('.tab-content:first'), tabToFind, []);
        return foundArr;
    }

    function enableTabEvtHandler()
    {
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e)
        {
            var foundTab = findInTabH(e.target.dataset.target.replace(/^#/, ''));

            //Get the active sub-tabs
            $(e.target.dataset.target).find('.tab-pane.active').each(function (index)
            {
                foundTab.push($(e.target.dataset.target).find('.tab-pane.active')[index].id);
            });

            $location.path(foundTab.join("/"));

            if ($rootScope.$$phase !== '$apply' && $rootScope.$$phase !== '$digest')
                $rootScope.$apply();
        });
    }

    enableTabEvtHandler();

    $rootScope.$on('$includeContentLoaded', function (event)
    {
        enableTabEvtHandler();
        var tabIdArr = $location.path().replace(/^\//, '').split('/');

        for (var tabIdidx = 0; tabIdidx < tabIdArr.length; tabIdidx++)
        {
            $('a[data-target="#' + tabIdArr[tabIdidx] + '"]').tab('show');
        }
        $('a[data-target="#' + tabIdArr[tabIdidx - 1] + '"]').trigger("shown.bs.tab");

    });


    $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl, newState, oldState)
    {
        // console.log("$locationChangeStart", event, data);
        console.log("$locationChangeStart", $location.path());

        //Path is empty - initial load event
        if ($location.path() == '' || $location.path() == '/')
        {
            var dataTarget = $('.tab-pane.active')[0].id;
            if (dataTarget.length == 0)
            {
                dataTarget = $('.nav-tabs a[data-target]:first').attr("data-target").replace(/^#/, '');
            }
            $location.path('/' + dataTarget);
        }
        else
        {
            var tabHierarchy = getTabH();
            var locPathHierarchyList = $location.path().replace(/^\//, '').split('/');

            var pathExists = true;
            for (var locPathHierarchyListIdx = 0; locPathHierarchyListIdx < locPathHierarchyList.length; locPathHierarchyList++)
            {
                if (typeof tabHierarchy[locPathHierarchyList[locPathHierarchyListIdx]] !== 'undefined')
                    tabHierarchy = tabHierarchy[locPathHierarchyList[locPathHierarchyListIdx]];
                else
                {
                    pathExists = false;
                    break;
                }
            }

            if (!pathExists)
            {
                console.log("Path does not exist: " + $location.path());
                event.preventDefault();
            }
        }
    });

    $rootScope.$on('$locationChangeSuccess', function (event, newUrl, oldUrl, newState, oldState)
    {
        // console.log("$locationChangeSuccess", event, data);
        console.log("$locationChangeSuccess", $location.path());
        // var dataTargetArr = $('.nav-tabs a[data-target]').map(function(){return $(this).attr("data-target");}).get();
        var tabIdArr = $location.path().replace(/^\//, '').split('/');

        for (var tabIdidx = 0; tabIdidx < tabIdArr.length; tabIdidx++)
        {
            $('a[data-target="#' + tabIdArr[tabIdidx] + '"]').tab('show');
        }
        $('a[data-target="#' + tabIdArr[tabIdidx - 1] + '"]').trigger("shown.bs.tab");
    });

}]);
