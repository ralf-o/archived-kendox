(function () {
   'use strict';
    
    var $ = window.jQuery,
        kx = window.kx,
        util = kx.util,
        ui = kx.ui,
        idCounter = 0,
        filterTypeRegistry,
        createFilterBox,
        createFilterOperatorButton,
        getInvolvedFilters,
        setFilterTooltip;

    
    $.fn.kxFilterBox = function (options) {
        var container = this.first();
        
        if (container.length > 0) {
            return container.empty().append(createFilterBox(util.Objects.asObject(options)));
        }
    };
    
    
    $.fn.kxFilterBox.registerFilterType = function (filterType) {
        var type = new FilterType(filterType);
        filterTypeRegistry.register(type);
    };
    
    $.fn.kxFilterBox.registerFilterTypes = function (filterTypes) {
        util.Arrays.forEach(filterTypes, function (filterType) {
            $.fn.kxFilterBox.registerFilterType(filterType); 
        });
    };
    
    createFilterBox = function (options) {
        var ret = $('<div class="k-widget kx-filter-box"/>'),
            outerTable = $('<table cellspacing="0" cellpadding="0"/>').appendTo(ret),
            outerTableBody = $('<tbody/>').appendTo(outerTable),
            outerTableRow = $('<tr/>').appendTo(outerTableBody),
            controller = new Controller(options),
            filters = getInvolvedFilters(options),
            filterCount = filters.length,
            innerTableBody;

        util.Arrays.forEach(filters, function (filterOptions, idx) {
            var innerTable,
                innerTableRow,
                innerTableCell;
            
            controller.setFilterValue(util.Objects.asString(filterOptions.name), filterOptions.value);

            if (idx === 0 || idx === Math.ceil(filterCount / 3) || idx === Math.ceil(2 * filterCount / 3)) {
                innerTable = $('<table cellpadding="0" cellspacing="0"/>');
                innerTableBody = $('<tbody/>').appendTo(innerTable);
                outerTableRow.append($('<td valign="top"/>').append(innerTable));
            }

            innerTableRow = $('<tr/>').appendTo(innerTableBody);
            innerTableRow.append(
                    $('<td class="kx-filter-box-column"/>').append(createFilterLabel(filterOptions)).append('<div style="font-size: 0.9; color: #aaa; font-style: italic">'
                    + filterTypeRegistry.getFilterTypeByName(filterOptions.type).getDefaultOperator().getCaption()
                    + '...</div>'));
        
          innerTableRow.append($('<td></td>').append(createFilterOperatorButton(filterOptions)));
            
            
          
            
            
            innerTableCell = $('<td class="kx-filter-box-filter-cell"/>')
                    .append(createFilter(filterOptions, controller))
                    .appendTo(innerTableRow);
            
            setFilterTooltip(innerTableCell, filterOptions.hint);     
        });

        if (filters.length > 0) {        
            $('<td valign="middle"/>')
                .append(createSearchButton(options, controller))
                .appendTo(outerTableRow);
        }
        
        return ret;
    }
    
    createFilterOperatorButton = function (filterOptions, controller) {
        var ret = $('<button class="k-button" style="border: none; background: none; xbackground-color: #f0f0f0; border-radius: 12px; padding: 0 2px 1px 2px;"><span class="k-icon k-si-arrow-s"/></button>'),
            filterType = filterTypeRegistry.getFilterTypeByName(filterOptions.type),
            filterOperators = filterType.getOperators(),
            menu = $('<ul/>');
        
        util.Arrays.forEach(filterOperators, function (operator) {
           menu.append($('<li style="white-space: nowrap"/>').text(operator.getCaption()));
        });
    
         
        
    console.debug(filterType.getOperators());        
        
        menu.kendoContextMenu({
            target: ret,
            showOn: "click",
            alignToAnchor: true
        });
        
        return ret;
    }

    function createSearchButton(options, controller) {
        var ret = $('<button class="kx-filter-box-search-button"/>')
                .text('Search')
                .kendoButton({
                   spriteCssClass: 'k-icon k-i-search',
                   click: controller.submit.bind(controller)
               });  
        
        return ret;
    }
    
    function createFilterLabel(filterOptions) {
        return $('<label class="k-label kx-filter-box-filter-label"/>')
                .text($.trim(filterOptions.label));

        return ret;
    }
    
    function createFilter(filterOptions, controller) {
        var ret,
            filter,
            filterType,
            filterOperator,
            filterViewName,
            filterView;
        
        filterOptions = util.Objects.asObject(filterOptions);

        if (filterOptions
                && typeof filterOptions.type === 'string') {

            filterType = filterTypeRegistry.getFilterTypeByName(filterOptions.type);
            filterOperator = filterType.getDefaultOperator();
            filterViewName = filterOperator.getViewName();
            filterView = filterType.getFilterViewByOperator(filterOperator);
          console.debug(filterOperator.getViewName())  
            filter = filterView(filterOptions, controller);
        }
        
        ret = $('<div>');
        ret.append(filter);
        
        return ret;
    }
    
    function createTextFilter(filterOptions, controller) {
        var filterName = util.Objects.asString(filterOptions.name),
            value = util.Objects.asString(filterOptions.value),
            input = $('<input class="k-input k-textbox kx-filter-box-filter"/>'),
            maxLength = util.Objects.asIntegerOrNull(filterOptions.maxLength),
            disabled = filterOptions.disabled,
            ret = $('<span/>').append(input),
            update;
        
        ret.on('keydown', function (event) {
            setTimeout(function () {
                controller.setFilterValue(filterOptions.name, input.val());
                
                if (event.keyCode === 13) {
                    controller.submit();
                }
            }, 0);
        });
        
        if (!isNaN(maxLength) && maxLength > 0) {
            input.attr('maxlength', maxLength);
        }
        
        if (disabled !== undefined && disabled !== null && typeof disabled !== 'function') {            
            input.attr('disabled', 'disabled');
            input.addClass('k-state-disabled');                
        }
        
        controller.observeFilterValues(function (values) {
            var value = util.Objects.asString(values[filterName]);
            controller.setFilterValue(filterName, value);
            
            if (value !== ret.val()) {
                ret.val(value);
            }
            
            if (typeof disabled === 'function') {
                if (disabled(values)) {
                    input.attr('disabled', 'disabled');
                    input.addClass('k-state-disabled');
                } else {
                    input.removeAttr('disabled');
                    input.removeClass('k-state-disabled');
                }                
            }
        });

        controller.setFilterValue(filterName, value);
        return ret;
    }
    
    function createDateFilter(filterOptions, controller) {
        var ret = $('<span/>'),
            input = $('<input/>'),
            filterName = filterOptions.name,
            disabled = filterOptions.disabled,
            value = filterOptions.value instanceof Date ? filterOptions.value : null,
            component;
        
        ret.append(input);
        
        input.kendoDatePicker({
            value: value,
            change: function () {
                var value = this.value();
                controller.setFilterValue(filterName, value);
            },
            min: (filterOptions.min instanceof Date ? filterOptions.min : undefined),
            max: (filterOptions.max instanceof Date ? filterOptions.max : undefined)
        });
        
        component = input.data('kendoDatePicker');
        ret.find('.k-datepicker').addClass('kx-filter-box-filter');
        
        input.on('change', function () {
            var rawValue = input.val(),
                trimmedRawValue = $.trim(rawValue),
                value = component.value();
            
            if (rawValue !== trimmedRawValue) {
                input.val(trimmedRawValue);
            }
            
            if (value === null && trimmedRawValue !== '') {
                controller.setFilterValue(filterName, undefined);
                controller.setFilterErrors(filterName, ['Please enter a proper date!!!']);                          
            } else {
                controller.setFilterValue(filterName, value);
                controller.clearFilterErrors(filterName);
            }
        }).on('keydown', function (event) {                        
             setTimeout(function () {
                controller.setFilterValue(filterName, $.trim(input.val()) === '' ? null : undefined);
                 
                if (event.keyCode === 13) {
                    input.trigger('change');
                    controller.submit();
                }
            }, 0);
        });
        
        if (disabled !== undefined && disabled !== null) {
            if (typeof disabled === 'function') {
                controller.observeFilterValues(function (values) {
                    if (disabled(values)) {
                        component.enable(false);
                    } else {
                        component.enable(true);
                    }
                });
            } else if (disabled) {
                component.enable(!disabled);                
            }
        }
        
        
        return ret;
    }
    
    function createDateRangeFilter(filerOptions, controller) {
        var ret = $('<span class="kx-filter-box-date-range-filter"/>'),
            input1 = $('<input/>'),
            input2 = $('<input/>'),
            containerLeft = $('<span style="float: left"/>').append(input1),
            containerCenter = $('<span style="float: left; padding: 5px 0 0 5px"> &ndash; </span>'),
            containerRight = $('<span style="float: right"/>').append(input2),
            component1,
            component2;
        
        ret
            .append(containerLeft)
            .append(containerCenter)
            .append(containerRight);
        
        input1.kendoDatePicker({
        });
        
        input2.kendoDatePicker({
        });
        
        ret.find('.k-datepicker:eq(0)').css('float', 'left');
        
        ret.find('label').css('float', 'right');
        
        ret.find('.k-datepicker:eq(1)').css('float', 'right');
        
        return ret;
    }
    
    function createSingleSelectFilter(filterOptions, controller) {
        var ret = $('<span/>'),
            input = $('<input/>'),
            filterName = util.Objects.asString(filterOptions.name),
            disabled = filterOptions.disabled,
            dataSource = [],
            options = util.Objects.asArray(filterOptions.options),
            option,
            component,
            i;
        
        ret.append(input);
        
        for (var i = 0; i < options.length; ++i) {
            option = options[i];
            
            if (option !== null && typeof option === 'object') {
                dataSource.push({
                    name: util.Objects.asString(option.name),
                    text: util.Objects.asString(option.text)
                });
            } else {
                dataSource.push({
                    name: util.Objects.asString(option),
                    text: util.Objects.asString(option)
                });
            }
        }
        
        input.kendoDropDownList({
            dataSource: dataSource,
            dataValueField: 'name',
            dataTextField: 'text',
            value: filterOptions.value,
            change: function () {
                controller.setFilterValue(filterName, this.value());
            }
        });
        
        component = input.data('kendoDropDownList');
        ret.find('.k-dropdown').addClass('kx-filter-box-filter');
        
        if (disabled !== undefined && disabled !== null) {
            if (typeof disabled === 'function') {
                controller.observeFilterValues(function (values) {
                    if (disabled(values)) {
                        component.enable(false);
                    } else {
                        component.enable(true);
                    }
                });
            } else if (disabled) {
                component.enable(!disabled);                
            }
        }
        
        return ret;
    }
    
    function createMultiSelectFilter(filterOptions, controller) {
        var ret = $('<span/>'),
            value = util.Objects.asArray(filterOptions.value),
            options = util.Objects.asArray(filterOptions.options);
        
        util.Arrays.forEach(options, function (option) {
            var option = option || {},
                checkboxContainer = $(filterOptions.mode === 'horizontal' ? '<span/>' : '<div/>'),
                checkbox = $('<input type="checkbox" class="k-checkbox" id="kx-filter-box-checkbox-' + idCounter + '"/>'),
                label = $('<label class="k-checkbox-label" for="kx-filter-box-checkbox-' + (idCounter++) + '"/>'),
                optionName,
                optionText;
            
            if (typeof option === 'string') {
                optionName = optionText = option;
            } else {
                optionName = option.name;
                optionText = option.text;
            }
            
            if (util.Arrays.contains(value, optionName)) {
                checkbox.attr('checked', 'checked');
            }
            
            label.text(optionText);
            checkboxContainer.append(checkbox);
            checkboxContainer.append(label);
            ret.append(checkboxContainer);
        });
        
        
        return ret;
    };
        
    setFilterTooltip = function (container, hint) {
        var tip = $.trim(hint);

        if (tip !== '') {
            container.attr('title', tip);

            container.kendoTooltip({
                position: 'top',
                showAfter: 500,
                callout: false,
                width: (tip.length < 50 ? null : '20em'),
                animation: {
                    open: {
                        duration: 200,
                        effects: 'fade:in'
                    },
                    close: {
                        duration: 200,
                        effects: 'fade:out'
                    }
                }
            });
        }      
    };
    
    getInvolvedFilters = function (options) {
        var ret = [],
            mapOfFilterNames = {};
        
        util.Arrays.forEach(options.filters, function (filter) {
           var filterName;
            
           if (util.Objects.isObject(filter)) {
               filterName = util.Objects.asString(filter.name);

               if (!filter.omit && filterName !== '' && !mapOfFilterNames.hasOwnProperty(filterName)) {
                   ret.push(filter);
                   mapOfFilterNames[filter] = true;
               }              
           }
        });

        return ret;
    };
       
    // ------------------------
    
    var FilterTypeRegistry = function () {
        this._registeredTypes = {};
    };
    
    FilterTypeRegistry.prototype.register = function (filterType) {
        if (filterType instanceof FilterType) {
            this._registeredTypes[filterType.getName()] = filterType;
        }
    };
    
    FilterTypeRegistry.prototype.getFilterTypeByName = function (filterTypeName) {
        var filterType = this._registeredTypes[filterTypeName];
        
        return filterType instanceof FilterType ? filterType : null;
    };
    
    // ------------------------
    
    var FilterType = function (config) {
        var cfg = util.Objects.asObject(config),
            name = cfg.name,
            defaultOperator = null,
            operators = [],
            operatorsByName = {};
        
        if (!util.Strings.matches(name, /^[a-z][a-zA-Z0-9]*$/)) {
            throw 'Illegal filter name "' + name + "'";
        }

        util.Arrays.forEach (cfg.operators, function (operatorCfg) {
            var operator,
                operatorName;
            
            if (util.Objects.isObject(operatorCfg)
                    && util.Objects.isObject(cfg.views)
                    && util.Strings.matches(operatorCfg.name, /^[a-z][a-zA-Z0-9]*$/)
                    && cfg.views.hasOwnProperty(operatorCfg.view)
                    && typeof cfg.views[operatorCfg.view] === 'function'
                    && !operatorsByName[operatorCfg.name]) {
                
                operator = new FilterOperator(operatorCfg);
                
                operators.push(operator);
                operatorsByName[operator.getName()] = operator;
                
                if (operatorCfg.isDefault && defaultOperator === null) {
                    defaultOperator = operator;
                }
            } 
        });
        
        if (operators.length === 0) {
            throw 'No valid operator available for filter type "' + name + '"';
        }
                
        if (defaultOperator === null) {
            defaultOperator = operators[0];
        }
        
        this._name = name;
        this._views = cfg.views;
        this._operators = operators;
        this._operatorsByName = operatorsByName;
        this._defaultOperator = defaultOperator;
    };
    
    FilterType.prototype.getName = function () {
        return this._name;
    };
    
    FilterType.prototype.getOperators = function () {
        return this._operators;    
    };
    
    FilterType.prototype.getDefaultOperator = function () {
        return this._defaultOperator;
    };
    
    FilterType.prototype.getOperatorByName = function (name) {
        return this._operatorsByName[name] || null;    
    };
    
    FilterType.prototype.getFilterViewByOperator = function (operator) {
        var ret = null;
        console.debug(1, operator.getName(),operator.getViewName(), this._views)
        if (operator instanceof FilterOperator) {
            ret = this._views[operator.getViewName()] || null;
        }
        
        return ret;
    };
    
    // ------------------------
    
    
    var FilterOperator = function (config) {
        var cfg = util.Objects.asObject(config),
            name = cfg.name,
            caption = cfg.caption;
         
        if (!util.Strings.matches(name, /^[a-z][a-zA-Z0-9]*$/)) {
            throw 'Illegal filter operator name "' + name + '"';
        }
        
        this._name = name;
        this._caption = caption;
        this._viewName = cfg.view;
    };
    
    FilterOperator.prototype.getName = function () {
        return this._name;
    };
    
    FilterOperator.prototype.getCaption = function () {
        return this._caption;
    };
    
    FilterOperator.prototype.getViewName = function () {
        return this._viewName;
    };
    
    // ------------------------
    
    var Controller = function (options) {
        var filterName;

        this.filterValues = {};
        this.filterErrors = {};
        this.filterNames = [];
        this.filterValuesObservers = [];
        
        for (var i = 0; i < options.filters.length; ++i) {
            filterName = options.filters[i].name;
            this.filterNames.push(filterName);
            this.filterValues[filterName] = options.filters[i].value;
        }

        this.options = options;
    } 
    
    Controller.prototype.getFilterValue = function (filterName) {
        return this.filterValues[filterName];
    }
    
    Controller.prototype.setFilterValue = function (filterName, value) {
        var me = this,
            oldValue = this.filterValues[filterName];
        
        if (oldValue !== value) {
            this.filterValues[filterName] = value;

            for (var i = 0; i < me.filterValuesObservers.length; ++i) {
                me.filterValuesObservers[i](me.filterValues);
            }
        }
    };
    
    Controller.prototype.clearFilterErrors = function (filterName, errors) {
        delete this.filterErrors[filterName];
    };
    
    Controller.prototype.setFilterErrors = function (filterName, errors) {
        this.filterErrors[filterName] = errors;
    };
    
    Controller.prototype.getFilterErrors = function () {
        var ret = [],
            me = this;

        util.Arrays.forEach(this.filterNames, function (filterName) {
            var errors = me.filterErrors[filterName];

            util.Arrays.forEach(errors, function (error) {
                ret.push(error);                    
            });
        });

        return ret;
    };
    
    Controller.prototype.observeFilterValues = function (callback) {
        if (typeof callback === 'function') {
            this.filterValuesObservers.push(callback);
        }
    };

    Controller.prototype.submit = function () {
        var filterParams = {},
            filterErrors = this.getFilterErrors(),
            filterConstraints = this.options.filterConstraints || [],
            errorToShow = null;
        
        if (filterErrors.length > 0) {
            errorToShow = filterErrors[0];    
        } else {
            for (var i = 0; i < this.options.filters.length; ++i) {
                var key = this.options.filters[i].name;
                filterParams[key] = this.filterValues[key];
            }

            for (var i = 0; i < filterConstraints.length; ++i) {
                var constraint = filterConstraints[i],
                    condition = constraint.condition,
                    errorMsg = constraint.errorMessage;

                if (typeof condition === 'function' && !condition(filterParams)) {
                    errorToShow = util.Objects.asString(errorMsg);
                    break;
                }
            }
        }

        if (errorToShow !== null) {
            ui.Dialogs.showErrorDialog(errorToShow);
        } else if (typeof this.options.onSubmit === 'function') {
            this.options.onSubmit(filterParams);
        }
    };
    

    // ---------------------------------------------------------------
    
    filterTypeRegistry = new FilterTypeRegistry();
    
    $.fn.kxFilterBox.registerFilterTypes([{
        name: 'text',
        
        views: {
            textInput: createTextFilter
        },
        
        operators: [{
            name: 'equal',
            caption: 'equal',
            view: 'textInput',
            isDefault: true
        }, {
            name: 'contains',
            caption: 'contains',
            view: 'textInput'
        }, {
            name: 'startsWith',
            caption: 'starts with',
            view: 'textInput'
        }, {
            name: 'endsWith',
            caption: 'ends with',
            view: 'textInput'
        }]
    }, {
        name: 'date',
                                         
        views: {
            dateInput: createDateFilter,
            dateRangeInput: createDateRangeFilter
        },
                                         
        operators: [{
            name: 'lessOrEqual',
            caption: 'less or equal',
            view: 'dateInput'
        }, {
            name: 'less',
            caption: 'less',
            view: 'dateInput'
        }, {
            name: 'greaterOrEqual',
            caption: 'greater or equal',
            view: 'dateInput'
        }, {
            name: 'greater',
            caption: 'greater',
            view: 'dateInput'    
        }, {
            name: 'between',
            caption: 'between',
            view: 'dateRangeInput',
            isDefault: true
        }]
    }, {
        name: 'singleSelect',
       
        views: {
            singleSelection: createSingleSelectFilter
        },
                                        
        operators: [{
            name: 'equal',
            caption: 'equal',
            view: 'singleSelection',
            isDefault: true
        }, {
            name: 'unequal',
            caption: 'unequal',
            view: 'singleSelection'
        }]
    }, {
        name: 'multiSelect',
       
        views: {
            multiSelection: createMultiSelectFilter
        },
                                        
        operators: [{
            name: 'includes',
            caption: 'includes',
            view: 'multiSelection',
            isDefault: true
        }, {
            name: 'excludes',
            caption: 'excludes',
            view: 'multiSelection'
        }]
    }]);
    
    
    // ---------------------------------------------------------------
}());
