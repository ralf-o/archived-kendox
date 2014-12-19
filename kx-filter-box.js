(function () {
   'use strict';
    
    var $ = window.jQuery,
        kx = window.kx,
        util = kx.util,
        ui = kx.ui,
        idCounter = 0,
        registeredFilterTypes = {},
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
    
    $.fn.kxFilterBox.registerFilterType = function (filterTypeName, renderer) {
        var ret = false;

        if (typeof filterTypeName === 'string'
                && filterTypeName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)
                && typeof renderer === 'function') {
            registeredFilterTypes[filterTypeName] =  renderer;
        }
        
        return ret;
    };
    
    $.fn.kxFilterBox.unregisterFilterType = function (filterTypeName) {
        var ret = false;
        
        if (filterTypeName instanceof 'string' && registeredFilterTypes.hasOwnProperty(filterTypeName)) {
            delete registeredFilterTypes[filterTypeName];
            ret = true;
        }
        
        return ret;
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
                outerTableRow.append($('<td/>').append(innerTable));
            }

            innerTableRow = $('<tr/>').appendTo(innerTableBody);
            innerTableRow.append(
                    $('<td class="kx-filter-box-column"/>').append(createFilterLabel(filterOptions)).append('<div style="font-size: 0.9; color: #aaa; font-style: italic">contains...</div>'));
        
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
    
    createFilterOperatorButton = function (filterOptions) {
        var ret = $('<button class="k-button" style="border: none; background: none; xbackground-color: #f0f0f0; border-radius: 12px; padding: 0 2px 1px 2px;"><span class="k-icon k-si-arrow-s"/></button>');
   
       
    $('<ul><li>contains</li><li class="k-state-selected" style="white-space: nowrap">starts with</span></li><li>ends with</ul>').kendoContextMenu({
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
            filter;
        
        filterOptions = util.Objects.asObject(filterOptions);

        if (filterOptions
                && typeof filterOptions.type === 'string'
                && registeredFilterTypes.hasOwnProperty(filterOptions.type)) {

            filter = registeredFilterTypes[filterOptions.type](filterOptions, controller);
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
    
    $.fn.kxFilterBox.registerFilterType('text', createTextFilter);
    $.fn.kxFilterBox.registerFilterType('date', createDateFilter);
    $.fn.kxFilterBox.registerFilterType('dateRange', createDateRangeFilter);
    $.fn.kxFilterBox.registerFilterType('singleSelect', createSingleSelectFilter);
    $.fn.kxFilterBox.registerFilterType('multiSelect', createMultiSelectFilter);
    
    // ---------------------------------------------------------------
}());
