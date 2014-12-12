(function () {
    var $ = window.jQuery,
        kendo = window.kendo,
        kendox = window.kendox = window.kendox || {},
        util = kendox.util,
        idCounter = 0,
        calcTableParams,
        createDataTable,
        createTableHead,
        createTableBody,
        createTableCell,
        createInlineRowActions,
        updateTableHead;
    
    $.fn.kendoxDataTable = function (config) {
        if (this.size() === 1) {
            this.empty().append(createDataTable(config));
        }
        
        return this;
    };
    
    calcTableParams = function (config) {
        var ret = {},
            cfg = util.Objects.asObject(config);
        
        if (cfg.dataSource instanceof kendo.data.DataSource) {
            ret.dataSource = cfg.dataSource;
        } else {
            ret.dataSource = new kendo.data.DataSource({data: []});
        }
        
        ret.columns = [];
        ret.columnGroups = [];
        ret.showRowNumbers = !!cfg.showRowNumbers;
        ret.rowSelection = cfg.rowSelection === 'single' || cfg.rowSelection === 'multi'
                ? cfg.rowSelection
                : null;
        
        util.Arrays.forEach(cfg.columns, function (column) {
            var subColumns = util.Arrays.filter(column.subColumns, util.Objects.isObject),
                subColumnCount = subColumns.length;
                title = $.trim(column.title);
              
            ret.columnGroups.push(column);
            
            if (subColumnCount === 0) {
                ret.columns.push(column);
            } else {
                util.Arrays.forEach(subColumns, function (subColumn) {
                    ret.columns.push(subColumn);
                });
            }
        });

        return ret;
    };
    
    
    
    createDataTable = function (config) {
        var tableParams = calcTableParams(config),
            dataSource = tableParams.dataSource,
            ret = $('<div class="k-grid kx-data-table"/>'),
            table = $('<table cellpadding="0" cellspacing="0" border="0" width="100%"/>').appendTo(ret),
            
            rowNumberOffset = 0;
        
        
        createTableHead(tableParams).appendTo(table);
        
          dataSource.bind('change', function (data) {
            rowNumberOffset = ((this.page() - 1) * this.pageSize());
            table.find('tbody').remove();
            table.append(createTableBody(tableParams).appendTo(table));
            
          });
            //$(table).fixedHeaderTable();
         
         setTimeout(function () {
             dataSource.fetch();
         }, 0);
            
        
        return ret;
    };  
        
        
    createTableHead = function (tableParams) {
        var ret = $('<thead class="k-grid-header"/>'),
            tr1 = $('<tr/>').appendTo(ret),
            tr2 = $('<tr/>');
 
        if (tableParams.showRowNumbers) {
            $('<th rowspan="2" class="k-header kx-data-table-meta-column"/>').text('').appendTo(tr1);
        }
        
        if (tableParams.rowSelection === 'multi') {
            $('<th rowspan="2" class="k-header kx-data-table-meta-column"/>')
                .append('<input type="checkbox" class="k-checkbox" id="k-data-table-checkbox-' + idCounter + '"/>')
                .append('<label class="k-checkbox-label" for="k-data-table-checkbox-' + (idCounter++) + '"/>')
                .appendTo(tr1);            
        }
        
        $('<th rowspan="2" class="k-header kx-data-table-meta-column"/>').append('<button class="k-button">+</button>').appendTo(tr1);

        $('<th rowspan="2" class="k-header kx-data-table-meta-column kx-data-table-action-column"/>').append('').appendTo(tr1);

        
        util.Arrays.forEach(tableParams.columnGroups, function (column) {
            var subColumns = util.Arrays.filter(column.subColumns, util.Objects.isObject),
                subColumnCount = subColumns.length,
                title = $.trim(column.title),
                th;
              
            if (subColumnCount === 0) {
                th = $('<th valign="middle" rowspan="2" class="k-header"/>').appendTo(tr1);
                
                if (column.field && column.sortable) {
                    th.attr('data-sortable', 'true');
                    th.attr('data-field', column.field);
                        
                    $('<a class="k-link"/>')
                        .text(title)
                        .click(function () {
                            var sortDirection = $(this).children().last().hasClass('kx-sorted-asc') ? 'desc' : 'asc';
                  
                            tableParams.dataSource.sort({field: column.field, dir: sortDirection});
                        })
                        .appendTo(th);
                } else {
                    th.text(title);
                }
            } else {
                $('<th valign="middle" class="k-header"/>').attr('colspan', subColumnCount).text(title).appendTo(tr1);
                
                util.Arrays.forEach(subColumns, function (subColumn) {
                    th = $('<th valign="middle" class="k-header"/>').appendTo(tr2);
                    
                    if (subColumn.field && subColumn.sortable) {
                        th.attr('data-sortable', 'true');
                        th.attr('data-field', subColumn.field);
                        
                        $('<a class="k-link"/>')
                            .text($.trim(subColumn.title))
                            .click(function () {
                                var sortDirection = $(this).children().last().hasClass('kx-sorted-asc') ? 'desc' : 'asc';
                  
                                tableParams.dataSource.sort({field: subColumn.field, dir: sortDirection});
                            })
                            .appendTo(th);
                    } else {
                        th.text($.trim(subColumn.title));
                    }
                });
            }
            
            if (tr2.children().length > 0) {
                tr2.children().first().addClass('k-first');
                tr2.appendTo(ret);
            }
        });
      
        $('<th rowspan="2" class="k-header kx-data-table-meta-column kx-data-table-action-column"/>').append('').appendTo(tr1);
      
        tableParams.dataSource.bind('change', function () {
            updateTableHead(ret, tableParams);
        });
        
        return ret;
    };
    
    createTableBody = function (tableParams) {
        var ret = $('<tbody/>'),
            records = dataSource.view(),
            page = dataSource.page(),
            pageSize = dataSource.pageSize(),
            rowNumberOffset = (page - 1) * pageSize + 1;

        if (records instanceof Array || records instanceof kendo.data.ObservableArray) {
           for (var i = 0; i < records.length; ++i) {
               var record = records[i];
               var tr = $('<tr/>').appendTo(ret);

               if (i % 2 === 1) {
                   tr.addClass('k-alt');
               }

               if (tableParams.showRowNumbers) {
                   $('<td class="xk-header kx-data-table-meta-column"/>').text(i + rowNumberOffset).appendTo(tr);
               }
               
               if (tableParams.rowSelection === 'multi') {
                   $('<td class="xk-header kx-data-table-meta-column"/>')
                       .append('<input type="checkbox" class="k-checkbox" id="kx-data-table-checkbox-' + idCounter + '"/>')
                       .append('<label class="k-checkbox-label" for="kx-data-table-checkbox-' + (idCounter++) + '"/>')
                       .appendTo(tr);            
               }
        
               $('<td class="xk-header kx-data-table-meta-column"/>').append('<button class="k-button">+</button>').appendTo(tr);            

               
    
               $('<td nowrap class="xk-header kx-data-table-meta-column kx-data-table-action-column"/>').append(createInlineRowActions(tableParams, record)).appendTo(tr);            

               
               util.Arrays.forEach(tableParams.columns, function (column) {
                   createTableCell(column, record).appendTo(tr);
               });
               
               $('<td nowrap class="xk-header kx-data-table-meta-column kx-data-table-action-column"/>').append(createInlineRowActions(tableParams, record)).appendTo(tr);            

           }
        }
        
        return ret;
    };
    
    createTableCell = function (column, record) {
        var ret = $('<td/>'),
            field = column.field;
        
        if (typeof field === 'string') {
            ret.text($.trim(record[field]));
        }
        
        return ret;
    }
    
    createInlineRowActions = function (tableParams, record) {
        var ret = $('<table cellspading="0" cellpadding="0" border="0">'),
            tbody = $('<tbody/>').appendTo(ret),
            tr = $('<tr/>').appendTo(tbody);
            
        $('<td><button class="k-button">Edit</button></td>').appendTo(tr);  
        $('<td><button class="k-button">Delete</button></td>').appendTo(tr);
        
        return ret;
    };
    
    updateTableHead = function (thead, tableParams) {
        var sort = tableParams.dataSource.sort(),
            sortInfo = {},
            i;

        for (i = 0; i < sort.length; ++i) {
            sortInfo[sort[i].field] = sort[i].dir;    
        }
        
        
        thead.find('th[data-sortable=true]').each(function (idx, elem) {
            var th = $(elem),
                field = th.attr('data-field'),
                className;

            th.find('a span').remove();
            if (field && sortInfo.hasOwnProperty(field)) {
                className = 'k-icon k-i-arrow-' + (sortInfo[field] === 'asc' ? 'n kx-sorted-asc' : 's kx-sorted-desc');
                $('<span/>').addClass(className).appendTo(th.children().first());
            }
        });
    }
}());