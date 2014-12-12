(function () {
    var $ = window.jQuery,
        kendox = window.kendox = window.kendox || {},
        util = kendox.util,
        createDataTable;
    
    $.fn.kendoxDataTable = function (config) {
        if (this.size() === 1) {
            this.empty().append(createDataTable(config));
        }
        
        return this;
    }
    
    createDataTable = function (config) {
        var cfg = config || {},
            dtCfg = {columns: [], data: []},
            table = $('<table cellpadding="0" cellspacing="0" border ="0" width="100%"/>'),
            ret = $('<div xxxstyle="height: 200px; overflow: auto; position: relative" class="k-grid kx-data-table"/>').append(table),
            columns = util.Arrays.filter(cfg.columns, function (item) {
                return util.Objects.isObject(item);
            }),
            dataSource = cfg.dataSource,
            dataTable,
            rowNumberOffset = 0;
        
        
        $(table).data('internalApi', {
            showRowDetails: function (idx) {
                var button = $(table).find('button.kx-idx-' + idx + ' span').toggleClass('k-si-plus').toggleClass('k-si-minus'),
                    tr = button.closest('tr').toggleClass('kx-state-open'),
                    row = component.row(tr);
                

                if (button.hasClass('k-si-minus')) {
                    
                    row.child('xxx').show();
                    var child = tr.next();
                    
                    if (child.children().size() === 1) {
                        child.children(':first').attr('colspan', 6);
                        child.prepend('<td colspan="3" class="kx-meta-column"></td>');
                    }
                    
                    child.addClass('kx-data-table-details-row');
                    
                    if (tr.hasClass('k-alt')) {
                        child.addClass('k-alt');
                    }
                } else {
                    row.child().hide();
                }
            }    
        });
        
        if (!(dataSource instanceof kendo.data.DataSource)) {
            alert('todo');
        }
        
        if (config.showRowNumbers === true) {
            dtCfg.columns.push({
                title: '#',
                data: function (_, _, _, meta) {
                    return rowNumberOffset + meta.row + 1;    
                },
                width: '1px',
                className: 'kx-meta-column'
            });
        }
        
        if (config.rowSelection === 'multi') {
            dtCfg.columns.push({
                title: '<input style="margin-top: 0; margin-bottom: 0" type="checkbox"/>',
                data: function () {
                    //return '<button onclick="jQuery(this).children().first().toggleClass(\'kx-hidden\')" class="k-button" style="background-color: transparent; min-width: 20px; xborder: 1px solid #ccc; xborder-radius: 3px; padding: 0"><span class="kx-hidden k-icon k-i-tick" /></button">'
                   return '<input type="checkbox"/>';
                },
                width: '1px',
                className: 'kx-meta-column'
            });
        }
        
        if (true) {
            dtCfg.columns.push({
                title: '<button class="k-button" style="min-width: 0; padding: 0 2px;"><span class="k-icon k-si-plus"/></button>',
                data: function (_, _, _, meta) {
                    return '<button class="k-button kx-idx-' + meta.row + '" style="min-width: 0; padding: 0 2px" onclick="jQuery(this).parents(\'table:first\').data(\'internalApi\').showRowDetails(' + meta.row + ')"><span class="k-icon k-si-plus"/></button>';
                },
                width: 1,
                className: 'kx-meta-column'
            });
        }
        
        if (false) {
            dtCfg.columns.push({
                data: function () {
                    return '<button>Delete</button>';  
                }
            });
        }
        
        util.Arrays.forEach(columns, function (column, idx) {
           var columnCfg = {
               title: $.trim(column.title),
               data: function (record) {
                   return record[column.field] || ''
               }
           };
            
           dtCfg.columns.push(columnCfg);
        });
        
        dtCfg.searching = false;
        dtCfg.orderable = false;
        dtCfg.paging = false;
        dtCfg.info = false;
        dtCfg.autoWidth = true;
        dtCfg.scrollY = "400px";
        
        dtCfg.initComplete = function (header) {
            table.find('thead:first').addClass('k-grid-header');
            table.find('thead:first th').addClass('k-header');
           
        }
        
            
        dataTable = table.dataTable(dtCfg);
        component = dataTable.api(); 
      
        //$('<tfoot><tr><td colspan="8">Juhu</td></tr></tfoot>').insertAfter(dataTable.find('thead'))
       
        
        
        dataSource.bind('change', function (data) {
            rowNumberOffset = ((this.page() - 1) * this.pageSize());
            component.clear();
            component.rows.add(data.items);
            component.draw();
            
            //$(table).fixedHeaderTable();
            
            
           setTimeout(function () {
               ret.find('.dataTables_scrollHead thead').addClass('k-grid-header');
               ret.find('.dataTables_scrollHeadInner').addClass('k-header');
               ret.find('.dataTables_scrollHead th').addClass('k-header');
               component.draw();
               //new $.fn.dataTable.FixedHeader( component, {bottom: true, top: true} );
               //setTimeout(function () {
               //$(document.body).find('.FixedHeader_Header').addClass('kx-data-table').removeClass('FixedHeader_Cloned');
                   
               //ret.find('.FixedHeader_Header thead').addClass('k-grid-header');
               //ret.find('.FixedHeader_Header thead th').addClass('k-header');
               //}, 0);
           }, 0);
            
            
            dataTable.find('tbody:first tr').each(function (idx, tr) {
                if (idx % 2 === 1) {
                    $(tr).addClass('k-alt');
                }
            });
        });
        
        dataSource.fetch();
        
        return ret;
    };
}());