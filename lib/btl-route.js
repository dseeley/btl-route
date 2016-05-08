var btlRoute = angular.module('btlRoute', []);

btlRoute.provider('btlRoute', function ()
{
    var _printDebug = false;
    var _ignoreNested = true;

    /*
     * Print debug
     * */
    this.printDebug = function (flag)
    {
        if (angular.isDefined(flag))
        {
            _printDebug = flag;
            return this;
        } else
        {
            return _printDebug;
        }
    };

    /*
    * If user sets this to true, then when a tab name is found anywhere in the tab hierarchy, it will be loaded and the path rewritten.
    * e.g. http://localhost/#!/tab1_1_1, would be translated to the correct url: http://localhost/#!/tab1/tab1_1/tab1_1_1.  This works because tabs
    * must all be named differently because they use html id tags (which must be unique).
    * */
    this.ignoreNested = function (flag)
    {
        if (angular.isDefined(flag))
        {
            _ignoreNested = flag;
            return this;
        } else
        {
            return _ignoreNested;
        }
    };


    this.$get = ['$rootScope', '$location', '$q', '$injector',
        function ($rootScope, $location, $q, $injector)
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

                    //Get the active sub-tabs.  Need a special search, normally jquery 'find' will just find the first in the tree. We need to find hierarchically.
                    var subActive = $(e.target.dataset.target).closestDescendant('.tab-pane.active');
                    if (subActive.length)
                    {
                        do {
                            foundTab.push(subActive[0].id);
                            subActive = subActive.closestDescendant('.tab-pane.active')
                        } while (subActive.length>0);
                    }

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
                if (_printDebug)
                {
                    // console.log("$locationChangeStart", event, data);
                    console.log("$locationChangeStart", $location.path());
                }

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
                    if (_ignoreNested==true)
                    {
                        var tabHierarchy = getTabH();
                        var locPathHierarchyList = $location.path().replace(/^\//, '').split('/');

                        var pathExists = true;
                        for (var locPathHierarchyListIdx = 0; locPathHierarchyListIdx < locPathHierarchyList.length; locPathHierarchyListIdx++)
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
                }
            });

            $rootScope.$on('$locationChangeSuccess', function (event, newUrl, oldUrl, newState, oldState)
            {
                if (_printDebug)
                {
                    // console.log("$locationChangeSuccess", event, data);
                    console.log("$locationChangeSuccess", $location.path());
                }
                // var dataTargetArr = $('.nav-tabs a[data-target]').map(function(){return $(this).attr("data-target");}).get();
                var tabIdArr = $location.path().replace(/^\//, '').split('/');

                for (var tabIdidx = 0; tabIdidx < tabIdArr.length; tabIdidx++)
                {
                    $('a[data-target="#' + tabIdArr[tabIdidx] + '"]').tab('show');
                }
                $('a[data-target="#' + tabIdArr[tabIdidx - 1] + '"]').trigger("shown.bs.tab");
            });
        }];
});


/*!
 * .closestDescendant( selector [, findAll ] )
 * https://github.com/tlindig/jquery-closest-descendant
 *
 * v0.1.2 - 2014-02-17
 *
 * Copyright (c) 2014 Tobias Lindig
 * http://tlindig.de/
 *
 * License: MIT
 *
 * Author: Tobias Lindig <dev@tlindig.de>
 */
(function($) {

    /**
     * Get the first element(s) that matches the selector by traversing down
     * through descendants in the DOM tree level by level. It use a breadth
     * first search (BFS), that mean it will stop search and not going deeper in
     * the current subtree if the first matching descendant was found.
     *
     * @param  {selectors} selector -required- a jQuery selector
     * @param  {boolean} findAll -optional- default is false, if true, every
     *                           subtree will be visited until first match
     * @return {jQuery} matched element(s)
     */
    $.fn.closestDescendant = function(selector, findAll) {

        if (!selector || selector === '') {
            return $();
        }

        findAll = findAll ? true : false;

        var resultSet = $();

        this.each(function() {

            var $this = $(this);

            // breadth first search for every matched node,
            // go deeper, until a child was found in the current subtree or the leave was reached.
            var queue = [];
            queue.push($this);
            while (queue.length > 0) {
                var node = queue.shift();
                var children = node.children();
                for (var i = 0; i < children.length; ++i) {
                    var $child = $(children[i]);
                    if ($child.is(selector)) {
                        resultSet.push($child[0]); //well, we found one
                        if (!findAll) {
                            return false; //stop processing
                        }
                    } else {
                        queue.push($child); //go deeper
                    }
                }
            }
        });

        return resultSet;
    };
})(jQuery);
