(function ($) {
   'use strict';
    
    var $ = window.jQuery,
        idCounter = 0,
        kendox = window.kendox,
        util = kendox.util,
        ui = kendox.ui;

    
    $.fn.kendoxFilterBox = function (options) {
        return this.first().empty().append(createFilterBox(options));
    };
        
    function createFilterBox(options) {
        var ret = $('<div class="kx-filter-box"><table cellSpacing="0" cellPadding="0" border="0><tbody>'),
            outerTableRow = ret.first().first().first(),
            filters = options.filters || [],
            filterCount = filters.length,
            filter,
            filterType,
            filterLabel,
            tbody,
            tr,
            controller,
            i;
  
        controller = new Controller(options);
        
        for (i = 0; i < filterCount; ++i) {
            filter = filters[i];        
            
            var filterName = filter.name;
            var filterValue = filter.value;
            
            controller.setFilterValue(filterName, filterValue);
            
            if (i === 0 || i === Math.ceil(filterCount / 3) || i === Math.ceil(2 * filterCount / 3)) {
                outerTableRow.append($('<td><table cellSpacing="5" cellPadding="0" border="0"><tbody>'));
                tbody = outerTableRow.children(':last-child').children().children();
            }
            
            
            tr = $('<tr/>');
            tr.append($('<td valign="top" align="right" style="padding: 1ex 3px 3px 3px"/>').append(createFilterLabel(filter)));
            tr.append($('<td style="padding: 3px;"/>').append(createFilter(filter, controller)));
            tbody.append(tr);
            
            var hint = filter.hint;
            
            if (hint) {
                var cell = $(tr.children().get(1));
                cell.attr('title', hint)
            
                cell.kendoTooltip({
                    position: 'top',
                    showAfter: 500,
                    callout: false,
                    width: (hint.length < 50 ? null : '20em'),
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
     
        }

        
        outerTableRow.append(
            $('<td valign="middle"/>')
                .append(createSearchButton(options, controller)));

        return ret;
    }

    function createSearchButton(options, controller) {
        var ret = $('<button class="kx-filter-box-search-button"/>');
        ret.text('Search');
        ret.on('click', function () {
           controller.submit(); 
        });
        
        ret.kendoButton({
            spriteCssClass: 'k-icon k-i-search'
        });  
        
        return ret;
    }
    
    function createFilterLabel(filterOptions) {
        var ret = $('<label class="k-label"/>');
        ret.text(filterOptions.label);
        return ret;
    }
    
    function createFilter(filterOptions, controller) {
        var ret,
            filter;
        
        filterOptions = util.Objects.asObject(filterOptions);

        if (filterOptions) {
            switch (filterOptions.type) {
                case 'text':
                    filter = createTextFilter(filterOptions, controller);
                    break;

                case 'date':
                    filter = createDateFilter(filterOptions, controller);
                    break;
                  
                case 'dateRange':
                    filter = createDateRangeFilter(filterOptions, controller);
                    break;
                    
                case 'singleSelect':
                    filter = createSingleSelectFilter(filterOptions, controller);
                    break;
                
                case 'multiSelect':
                    filter = createMultiSelectFilter(filterOptions, controller);
                    break;
            }
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
    }
        
  
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
}());
