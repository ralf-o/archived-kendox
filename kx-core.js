(function () {
    var kx = window.kx = window.kx || {},
        util = kx.util = kx.util || {},
        ui = kx.ui = kx.ui || {};
  
    util.Objects = function () {
        throw 'kx.util.Strings cannto be instantiated';
    };
    
    util.Objects.toString = function () {
        return '<kx.util.Objects>';
    };
    
    util.Objects.isObject = function (x) {
        return (x !== null && typeof x === 'object');
    };
    
    util.Objects.isArray = function (x) {
       return (x instanceof Array); 
    };
    
    util.Objects.asString = function (value) {
        var ret;

        if (value === undefined || value === null) {
            ret = '';
        } else if (typeof value === 'string') {
            ret = value;
        } else {
            ret = '' + value;
        }
        
        return ret;
    };

    util.Objects.asInteger = function (value) {
        return util.Objects.asIntegerOrDefault(value, 0);  
    };
    
    util.Objects.asIntegerOrNull = function (value) {
        return util.Objects.asIntegerOrDefault(value, null);
    }
    
    util.Objects.asIntegerOrDefault = function (value, defaultValue) {
        if (isNaN(value)) {
            ret = defaultValue;
        } else if (typeof ret === 'string') {
            ret = parseInt(value, 10);
        } else {
            ret = Math.round(value);
        }
        
        return ret;
    };
    
    util.Objects.asArray = function (value) {
        return util.Objects.asArrayOrDefault(value, []);
    };
    
    util.Objects.asArrayOrNull = function (value) {
        return util.Objects.asArrayOrDefault(value, null);
    };
    
    util.Objects.asArrayOrDefault = function (value, defaultValue) {
        return (value instanceof Array ? value : defaultValue);
    };
    
    util.Objects.asObject = function (value) {
        return util.Objects.asObjectOrDefault(value, {})
    };
    
    util.Objects.asObjectOrNull = function (value) {
        return util.Objects.asObjectOrDefault(value, null);
    };
    
    util.Objects.asObjectOrDefault = function (value, defaultValue) {
        return (value !== null && typeof value === 'object' ? value : defaultValue);
    };
    
    util.Objects.copy = function (obj) {
        var ret;
        
        if (obj !== null && typeof obj === 'object') {
            ret = {};
            $.extend(ret, obj);
        } else {
            ret = obj;
        }
        
        return ret;
    }

    // ===============================================================
    
    util.Arrays = function () {
        throw 'kx.util.Arrays cannot be instantiated';
    }
    
    util.Arrays.toString = function () {
        return '<kx.util.Arrays>';
    }
    
    util.Arrays.contains = function (arr, item) {
        var ret = false;
        
        if (arr instanceof Array) {
            for (i = 0; i < arr.length; ++i) {
                if (arr[i] === item) {
                    ret = true;
                    break;
                }
            }
        }
        
        return ret;
    }

    util.Arrays.forEach = function (arr, f) {
        var i;
        
        if (arr instanceof Array) {
            for (i = 0; i < arr.length; ++i) {
                f(arr[i], i);
            }
        }
    }
    
    util.Arrays.filter = function (arr, pred) {
        var ret = [],
            item,
            i;
        
        if (arr instanceof Array) {
            for (i = 0; i < arr.length; ++i) {
                item = arr[i];
                
                if (pred(item, i)) {
                    ret.push(item);
                }
            }
        }
        
        return ret;
    }
    
    // ===============================================================
    
    
    ui.Dialogs = function () {
        throw 'kx.ui.Dialogs cannot be instantated';
    };
    
    
    ui.Dialogs.toString = function () {
        return '<kx.util.Dialogs>';
    };
    
    
    ui.Dialogs.showMessageDialog = function (options) {
        if (!options) {
            options = {}
        } else if (typeof options === 'string') {
            options = {content: options};
        }
        
        return ui.Dialogs.showCustomDialog({
            cssClass: 'kx-dialog-message',
            content: options.content,
            title: options.title || 'Information',
            buttons: [{
                primary: true,
                text: 'OK',
                name: 'OK'
            }]
        });
    };

    
    ui.Dialogs.showWarningDialog = function (options) {
        if (!options) {
            options = {}
        } else if (typeof options === 'string') {
            options = {content: options};
        }
        
        return ui.Dialogs.showCustomDialog({
            cssClass: 'kx-dialog-warning',
            content: options.content,
            title: options.title || 'Warning',
            buttons: [{
                text: 'OK',
                name: 'OK'
            }]
        });
    };

    ui.Dialogs.showErrorDialog = function (options) {
        if (!options) {
            options = {}
        } else if (typeof options === 'string') {
            options = {content: options};
        }
        
        return ui.Dialogs.showCustomDialog({
            cssClass: 'kx-dialog-error',
            content: options.content,
            title: options.title || 'Error',
            buttons: [{
                primary: true,
                text: 'OK',
                name: 'OK'
            }]
        });
    };

    
    ui.Dialogs.showCustomDialog = function (options2) {
        var options = options2 || {},
            mainDiv = $('<div class="kx-dialog"/>'),
            contentDiv = $('<div class="kx-dialog-content"/>'),
            buttonsDiv = $('<div class="kx-dialog-button-bar"/>'),
            buttons = util.Objects.asArray(options.buttons),
            primaryButton = null,
            dialog;
        
        mainDiv
            .addClass(options.cssClass)
            .append(contentDiv)
            .append(buttonsDiv);
        
        contentDiv.append(options.content);
 
        util.Arrays.forEach(buttons, function (button) {
            var btn = $('<button class="k-button"/>')
                .text(button.text)
                .addClass(button.cssClass)
                .on('click', function () {
                    dialog.close(); 
                });
            
            if (button.primary) {
                btn.addClass('k-primary')
                primaryButton = btn;
            }
            
            buttonsDiv.append(btn);
        });
        
        mainDiv.kendoWindow({
            maxWidth: 300,
            title: options.title,
            modal: true,
            resizable: false,
            open: function () {
              if (primaryButton) {
                  setTimeout(function () {
                    primaryButton.focus();
                  }, 0);
              }
            },
            activate: function () {
                primaryButton.focus();  
            },
            close: function () {
                var onClose = options.onClose;
                
                if (typeof onClose === 'function') {
                    setTimeout(function () {
                        onClose();
                    });
                }
            }
        });
        
        dialog = mainDiv.data('kendoWindow');
        dialog.center().open();        
    }
}());