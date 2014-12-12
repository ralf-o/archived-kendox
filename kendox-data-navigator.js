(function ($) {
    'use strict';

    var idCounter = 0,
        kendox = window.kendox,
        util = kendox.util,
        ui = kendox.ui;

    $.fn.kendoxDataNavigator = function (options) {
        var container = this,
            dataSource = options.dataSource,
            toolBar = createToolBar(options),
            filterBox = createFilterBox(options),
            table = createTable(options),
            pager = createPager(options),
            widget = $('<div class="kx-data-navigator" style="position: relative"/>'),
            locked = false,
            timeoutId = null;

        options = util.Objects.copy(options);
        
        if (dataSource instanceof Array) {
            dataSource = new kendo.data.DataSource({data: dataSource});
        }

        options.dataSource = dataSource;
        
        widget
            .append(toolBar)
            .append(filterBox)
            .append(table)
            .append(pager);
                       
        container
            .empty()
            .append(widget);
        
        dataSource.bind('requestStart', function () {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            
            //timeoutId = setTimeout(function () {
                timeoutId = null;
                
                if (!locked) {
                    //widget.children().slice(-2).hide();
                    widget.prepend($('<div class="k-loading-mask" style="background-color: black; opacity: 0.2; position: absolute; width: 100%; height: 100%; z-index: 32000;"/>'));
                    widget.append(
                        $('<div  class="k-window" style="padding: 20px; text-align: center; position: absolute; top: 180px; left: 600px; z-index: 32001;"/>')
                            .append('<div style="padding: 10px;">Loading data...</div>')
                            .append('<div class="k-widget k-progressbar k-progressbar-horizontal k-progressbar-indeterminate"/>')
                            .append('<div><button class="k-button k-button-icontext" style="margin-top: 9px"><span class="k-icon k-i-cancel"></span>Abort</button></div>')
                            .hide().fadeIn(500));
                    locked = true;
                }
           // }.bind(this), 300); 
        }.bind(this));
        
        dataSource.bind('requestEnd', function () {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            
            setTimeout(function () {
                var elems;
                timeoutId = null;
                
                if (locked) {
                    elems = $([widget.children().get(0), widget.children().get(-1)]);
                    
                    elems.fadeOut(300, function () {
                        elems.remove();
                        widget.children().fadeIn(300);
                    });
                    
                    locked =false;
                }
            }.bind(this), 2000);
        }.bind(this));
    };
 
    function createToolBar(options) {
        var toolBarOptions = {items: []},
            actions = options.actions || [],
            action,
            actionType,
            subactions,
            subaction,
            subbuttons,
            item,
            ret,
            i,
            j;
        
        
       if (typeof options.headline === 'string' && options.headline.length > 0) {
           toolBarOptions.items.push({
               template: '<label class="kx-data-navigator-headline">' + options.headline + '</label>' 
           });     
       } 
        
       toolBarOptions.items.push({
           template: '<div class="search-field-container"/>' 
       });

        var menuButtonIds = [];
        
        for (var i = 0; i < actions.length; ++i) {
            action = actions[i];
            actionType = action.type,
            subactions = action.subactions || null,
            subbuttons = [];
            
            if (subactions instanceof Array && subactions.length > 0) {
                for (j = 0; j < subactions.length; ++j) {
                    subaction = subactions[j];
                    
                    subbuttons.push({
                        text: subaction.title
                    });
                }
            }
            
            var id = (subbuttons.length > 0 && actionType == 'menu' ? 'menuButtonInToolBar' + (idCounter++) : null);
           
            if (id) {
                menuButtonIds.push(id);
            }
            
            
            switch (actionType) {
                case 'menu':
                    item = {
                        id: id,
                        type: 'splitButton',
                        text: action.title,
                        menuButtons: subbuttons
                    };
                    
                    break;
                    
                case 'group':
                    if (subbuttons.length > 1) {
                        item = {
                            type: 'buttonGroup',
                            buttons: subbuttons
                        };
                    } else {
                        item = {
                            type: 'button',
                            text: subbuttons[0].text
                        }
                    }
         
                    break;
            }
            
            
            toolBarOptions.items.push(item);
            
        }

        toolBarOptions.overflowOpen = function (x) {
            for (var i = 0; i < menuButtonIds.length; ++i) {
         
               $(document).find('#' + menuButtonIds[i] + '_overflow').children(0).first().remove();
            }    
        };

        ret = $('<div>')
            .append($('<div>').kendoToolBar(toolBarOptions));
  
        for (var i = 0; i < menuButtonIds.length; ++i) {
            ret.find('#' + menuButtonIds[i]).each(function (idx, elem) {
                var $button = $(elem),
                    $arrow = $button.next(),
                    $parent = $button.parent();
                 
                $button.removeClass('k-button').remove();
                $arrow.addClass('fake-menu-button').prepend($button);
             });
        }
        
        return ret;    
    };
    
    function createFilterBox(options) {
        var filterBoxOptions = {
                filters: options.filters,
                filterConstraints: options.filterConstraints,
                onSubmit: function () {
                    options.dataSource.fetch();
                }
            };
        
        return $('<div/>').kendoxFilterBox(filterBoxOptions);
    }

    function createPager(options) {
        var ret = $('<div>');
        
        ret.kendoPager({
            dataSource: options.dataSource,
            pageSizes: [10, 25, 50, 100, 250, 500],
            buttonCount: 6
        });
        
        return ret;
    }
    
    function createTable(options) {
        var ret = $('<div class="k-widget k-grid k-table-container-inner">'),
            tableOptions = {};
        
        tableOptions.columns = options.columns;
        tableOptions.dataSource = options.dataSource;
        tableOptions.rowSelection = options.rowSelection;
        tableOptions.showRowNumbers = !!options.showRowNumbers;
        
        ret.kendoxDataTable(tableOptions);
        
        return ret;
    }   
}(jQuery));