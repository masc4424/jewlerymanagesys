$(document).ready(function() {
    const csrfToken = $('input[name="csrfmiddlewaretoken"]').val();

    showSummaryView();

    function showSummaryView() {
        $('#summarySection').removeClass('view-hidden').addClass('summary-view');
        $('#detailedSection').removeClass('detailed-view').addClass('view-hidden');
    }

    // Function to show detailed view and hide summary view
    function showDetailedView() {
        $('#summarySection').removeClass('summary-view').addClass('view-hidden');
        $('#detailedSection').removeClass('view-hidden').addClass('detailed-view').show();
    }
    
    // Define DataTable common settings
    const commonSettings = {
        processing: true,
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        responsive: true,
        autoWidth: false,
        order: [[5, 'desc']], // Order by date descending
        columns: [
            {
                title: 'Sr. No',
                data: null,
                render: function (data, type, row, meta) {
                    return meta.row + 1;
                }
            },
            { 
                title: 'Model Name', 
                data: null,
                render: function(data, type, row) {
                    return `<div class="d-flex align-items-center">
                        ${row.model_img ? 
                          `<img src="${row.model_img}" alt="Model" class="me-2 rounded table-img model-image-clickable" data-img-src="${row.model_img}">` : 
                          '<span class="badge bg-secondary me-2">No Image</span>'}
                        <strong>${row.model_no}</strong>
                    </div>`;
                }
            },
            { 
                title: 'Model Status', 
                data: 'status',
                render: function(data) {
                    const statusMap = {
                        'Pending':'warning',
                        'CADE': 'secondary',
                        'WAX SETTING': 'info',
                        'CASTING': 'primary',
                        'FILLING': 'warning',
                        'POLISHING': 'secondary',
                        'SETTING': 'info',
                        'PLATING': 'primary',
                        'QC-POST PLATING': 'warning',
                        'READY TO DELIVER': 'success',
                        'RE SETTING': 'secondary',
                        'FINISHED': 'success',
                        'RETURNED': 'warning',
                        'DEFECTIVE': 'danger',
                        'Delivered': 'success'
                    };

                    if (!data) {
                        return `<span class="badge bg-warning">In Progress</span>`;
                    }

                    const badgeClass = statusMap[data] || 'light';
                    return `<span class="badge bg-${badgeClass}">${data}</span>`;
                }
            },
            { 
                title: 'Delivery Status', 
                data: 'delivered',
                render: function(data) {
                    return data ? 
                        `<span class="badge bg-success">Delivered</span>` : 
                        `<span class="badge bg-secondary">Not Delivered</span>`;
                }
            },
            { title: 'Type', data: 'jewelry_type' },
            { 
                title: 'Quantity with color', 
                data: null,
                render: function(data, type, row) {
                    return `${row.quantity} (${row.color})`;
                }
            },
            { 
                title: 'Order Date', 
                data: 'order_date',
                render: data => new Date(data).toLocaleDateString()
            },
            { 
                title: 'Est. Delivery Date', 
                data: 'est_delivery_date',
                render: data => data ? new Date(data).toLocaleDateString() : 'Not set'
            },
            { title: 'Weight/Set(gm)', data: 'weight' }
            /* Actions column commented out for client view
            ,{
                title: 'Actions',
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    if (row.is_repeated) {
                        return `
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li><button class="dropdown-item return-order" data-id="${row.id}" data-repeated="true">Return</button></li>
                                    <li><button class="dropdown-item cancel-order" data-id="${row.id}">Cancel Order</button></li>
                                </ul>
                            </div>`;
                    } else if (!row.is_approved) {
                        return `
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li><button class="dropdown-item allow-order" data-id="${row.id}">Approve</button></li>
                                    <li><button class="dropdown-item deny-order" data-id="${row.id}">Deny</button></li>
                                    <li><button class="dropdown-item return-order" data-id="${row.id}" data-repeated="false">Return</button></li>
                                </ul>
                            </div>`;
                    } else {
                        return `
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li><button class="dropdown-item return-order" data-id="${row.id}" data-repeated="false">Return</button></li>
                                </ul>
                            </div>`;
                    }
                }
            }
            */
        ]
    };

    // Add Order Summary Table initialization
    const orderSummaryTable = $('#orderSummaryTable').DataTable({
        processing: true,
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        responsive: true,
        autoWidth: false,
        order: [[0, 'desc']], // Order by date descending
        ajax: {
            url: '/api/client/orders/',
            dataSrc: function(json) {
                return createOrderSummary(json.data);
            }
        },
        columns: [
            { 
                title: 'Order Date', 
                data: 'order_date',
                render: data => new Date(data).toLocaleDateString()
            },
            { 
                title: 'Total Quantity', 
                data: 'total_quantity',
                render: function(data, type, row) {
                    return `<a href="#" class="text-primary fw-bold quantity-filter-link" data-order-date="${row.order_date}" style="text-decoration: none;">${data}</a>`;
                }
            },
            { 
                title: 'Total Orders', 
                data: 'total_orders'
            },
            { 
                title: 'Models Count', 
                data: 'models_count'
            }
        ]
    });

    // Function to create order summary data
    function createOrderSummary(groupedData) {
        const summaryData = [];
        
        // Iterate through each date in grouped data
        for (const orderDate in groupedData) {
            let totalQuantity = 0;
            let totalOrders = 0;
            let modelsCount = 0;
            
            // Iterate through each model_no within that date
            for (const modelNo in groupedData[orderDate]) {
                const orders = groupedData[orderDate][modelNo];
                modelsCount++;
                
                // Count quantities and orders for this date
                orders.forEach(order => {
                    totalQuantity += order.quantity;
                    totalOrders++;
                });
            }
            
            summaryData.push({
                order_date: orderDate,
                total_quantity: totalQuantity,
                total_orders: totalOrders,
                models_count: modelsCount
            });
        }
        
        return summaryData;
    }

    // Add click event handler for quantity filter links (add this after the returns table initialization)
    $(document).on('click', '.quantity-filter-link', function(e) {
        e.preventDefault();
        const selectedDate = $(this).data('order-date');
        
        // Show detailed view
        showDetailedView();
        
        // Switch to My Orders tab if not already active
        // const myOrdersTab = new bootstrap.Tab(document.querySelector('#my-orders-tab'));
        // myOrdersTab.show();

        const reOrderTab = new bootstrap.Tab(document.querySelector('#reorders-tab'));
        reOrderTab.show();
        
        // Apply date filter to both tables
        applyDateFilterToBothTables(selectedDate);
        
        // Show active filter indicator
        showActiveFilterIndicator(selectedDate);
    });

    // Function to apply date filter
    function applyDateFilterToBothTables(selectedDate) {
        // Clear existing search filters
        while($.fn.dataTable.ext.search.length > 0) {
            $.fn.dataTable.ext.search.pop();
        }
        
        // Add date filter for both tables
        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex) {
                if (settings.nTable.id !== 'myOrdersTable' && settings.nTable.id !== 'reordersTable') {
                    return true; // Don't filter other tables
                }
                
                const table = settings.nTable.id === 'myOrdersTable' ? myOrdersTable : reordersTable;
                const order = table.row(dataIndex).data();
                return order.order_date === selectedDate;
            }
        );
        
        // Redraw both tables
        myOrdersTable.draw();
        reordersTable.draw();
    }

    $(document).on('click', '#backToSummary', function() {
        showSummaryView();
        
        // Clear all filters
        clearAllFilters();
    });

    function clearAllFilters() {
        // Remove all search filters
        while($.fn.dataTable.ext.search.length > 0) {
            $.fn.dataTable.ext.search.pop();
        }
        
        // Reset filter buttons
        $('.filter-btn').removeClass('active');
        $('[data-filter="all-status"]').addClass('active');
        
        // Remove filter indicator
        $('.active-filter-indicator').remove();
        
        // Redraw tables
        if (typeof myOrdersTable !== 'undefined') {
            myOrdersTable.draw();
        }
        if (typeof reordersTable !== 'undefined') {
            reordersTable.draw();
        }
    }

    $(document).on('click', '.filter-btn', function() {
        const filterValue = $(this).data('filter');
        
        // Update active button
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        
        // Clear existing filters
        while($.fn.dataTable.ext.search.length > 0) {
            $.fn.dataTable.ext.search.pop();
        }
        
        // Remove date filter indicator
        $('.active-filter-indicator').remove();
        
        // Apply filter based on type
        if (filterValue === 'delivered') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    if (settings.nTable.id !== 'myOrdersTable' && settings.nTable.id !== 'reordersTable') {
                        return true;
                    }
                    const table = settings.nTable.id === 'myOrdersTable' ? myOrdersTable : reordersTable;
                    const order = table.row(dataIndex).data();
                    return order.delivered === true;
                }
            );
        } else if (filterValue === 'not-delivered') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    if (settings.nTable.id !== 'myOrdersTable' && settings.nTable.id !== 'reordersTable') {
                        return true;
                    }
                    const table = settings.nTable.id === 'myOrdersTable' ? myOrdersTable : reordersTable;
                    const order = table.row(dataIndex).data();
                    return order.delivered === false || order.delivered === 'partial';
                }
            );
        } else if (filterValue.startsWith('status-')) {
            const status = filterValue.replace('status-', '').replace(/-/g, ' ').toUpperCase();
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    if (settings.nTable.id !== 'myOrdersTable' && settings.nTable.id !== 'reordersTable') {
                        return true;
                    }
                    const table = settings.nTable.id === 'myOrdersTable' ? myOrdersTable : reordersTable;
                    const order = table.row(dataIndex).data();
                    
                    // Check if any individual order in the group has this status
                    return order.individual_orders && order.individual_orders.some(o => o.status === status);
                }
            );
        }
        // If filterValue is 'all-status', no filter is applied (shows all)
        
        // Apply filter to both tables
        myOrdersTable.draw();
        reordersTable.draw();
    });

    // Function to show active filter indicator
    function showActiveFilterIndicator(selectedDate) {
        const formattedDate = new Date(selectedDate).toLocaleDateString();
        
        // Remove existing filter indicator
        $('.active-filter-indicator').remove();
    }

    // Function to clear date filter
    function clearDateFilter() {
        // Remove the search filter
        $.fn.dataTable.ext.search.pop();
        
        // Redraw the table
        myOrdersTable.draw();
        
        // Remove filter indicator
        $('.active-filter-indicator').remove();
    }

    function flattenGroupedData(groupedData) {
        const flattenedData = [];
        
        // Iterate through each date
        for (const orderDate in groupedData) {
            // Iterate through each model_no within that date
            for (const modelNo in groupedData[orderDate]) {
                // Add all orders for this date-model combination
                flattenedData.push(...groupedData[orderDate][modelNo]);
            }
        }
        
        return flattenedData;
    }

    function groupDataForTable(groupedData) {
        const result = [];
        
        // Iterate through each date
        for (const orderDate in groupedData) {
            // Iterate through each model_no within that date
            for (const modelNo in groupedData[orderDate]) {
                const orders = groupedData[orderDate][modelNo];
                
                // FIXED: Separate repeated and non-repeated orders instead of grouping them together
                const nonRepeatedOrders = orders.filter(order => !order.is_repeated);
                const repeatedOrders = orders.filter(order => order.is_repeated);
                
                // Create separate groups for non-repeated orders
                if (nonRepeatedOrders.length > 0) {
                    const groupedOrder = {
                        id: nonRepeatedOrders[0].id,
                        model_no: modelNo,
                        model_img: nonRepeatedOrders[0].model_img,
                        order_date: orderDate,
                        est_delivery_date: nonRepeatedOrders[0].est_delivery_date,
                        weight: nonRepeatedOrders[0].weight,
                        is_approved: nonRepeatedOrders[0].is_approved,
                        is_repeated: false, // Explicitly set to false for non-repeated group
                        repeat_order_id: nonRepeatedOrders[0].repeat_order_id,
                        
                        // Aggregate quantity and colors for non-repeated orders only
                        quantity: nonRepeatedOrders.reduce((sum, order) => sum + order.quantity, 0),
                        colors: nonRepeatedOrders.map(order => ({
                            color: order.color,
                            quantity: order.quantity
                        })),
                        
                        // Determine delivery status for non-repeated orders
                        delivered: getDeliveryStatus(nonRepeatedOrders),
                        
                        // Get jewelry types for non-repeated orders
                        jewelry_type: getJewelryTypes(nonRepeatedOrders),
                        
                        // Keep individual orders for reference
                        individual_orders: nonRepeatedOrders
                    };
                    
                    result.push(groupedOrder);
                }
                
                // Create separate groups for repeated orders
                if (repeatedOrders.length > 0) {
                    const groupedOrder = {
                        id: repeatedOrders[0].id,
                        model_no: modelNo,
                        model_img: repeatedOrders[0].model_img,
                        order_date: orderDate,
                        est_delivery_date: repeatedOrders[0].est_delivery_date,
                        weight: repeatedOrders[0].weight,
                        is_approved: repeatedOrders[0].is_approved,
                        is_repeated: true, // Explicitly set to true for repeated group
                        repeat_order_id: repeatedOrders[0].repeat_order_id,
                        
                        // Aggregate quantity and colors for repeated orders only
                        quantity: repeatedOrders.reduce((sum, order) => sum + order.quantity, 0),
                        colors: repeatedOrders.map(order => ({
                            color: order.color,
                            quantity: order.quantity
                        })),
                        
                        // Determine delivery status for repeated orders
                        delivered: getDeliveryStatus(repeatedOrders),
                        
                        // Get jewelry types for repeated orders
                        jewelry_type: getJewelryTypes(repeatedOrders),
                        
                        // Keep individual orders for reference
                        individual_orders: repeatedOrders
                    };
                    
                    result.push(groupedOrder);
                }
            }
        }
        
        return result;
    }

    // Function to determine delivery status
    function getDeliveryStatus(orders) {
        const deliveredCount = orders.filter(order => order.delivered).length;
        
        if (deliveredCount === 0) {
            return false; // Not delivered
        } else if (deliveredCount === orders.length) {
            return true; // Fully delivered
        } else {
            return 'partial'; // Partially delivered
        }
    }

    // Function to get jewelry types
    function getJewelryTypes(orders) {
        const types = [...new Set(orders.map(order => order.jewelry_type))];
        
        if (types.length === 1) {
            return types[0]; // Single type name
        } else {
            return `${types.length} types`; // Multiple types count
        }
    }

    // Initialize My Orders DataTable
    const myOrdersTable = $('#myOrdersTable').DataTable({
        processing: true,
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        responsive: true,
        autoWidth: false,
        order: [[5, 'desc']], // Order by date descending
        ajax: {
            url: '/api/client/orders/',
            dataSrc: function(json) {
                // Group the data for table display
                const groupedData = groupDataForTable(json.data);
                
                // Filter out repeated orders and returned/defective orders
                return groupedData.filter(order => {
                    // Check if any individual order in the group has these statuses
                    return !order.is_repeated && 
                        !order.individual_orders.some(o => ['RETURNED', 'DEFECTIVE'].includes(o.status));
                });
            }
        },
        columns: [
            {
                title: 'Sr. No',
                data: null,
                render: function (data, type, row, meta) {
                    return meta.row + 1;
                }
            },
            { 
                title: 'Model Name', 
                data: null,
                render: function(data, type, row) {
                    return `<div class="d-flex align-items-center">
                        ${row.model_img ? 
                        `<img src="${row.model_img}" alt="Model" class="me-2 rounded table-img model-image-clickable" data-img-src="${row.model_img}">` : 
                        '<span class="badge bg-secondary me-2">No Image</span>'}
                        <strong>${row.model_no}</strong>
                    </div>`;
                }
            },
            { 
                title: 'Delivery Status', 
                data: 'delivered',
                render: function(data) {
                    if (data === 'partial') {
                        return `<span class="badge bg-warning">Partially Delivered</span>`;
                    } else if (data === true) {
                        return `<span class="badge bg-success">Delivered</span>`;
                    } else {
                        return `<span class="badge bg-secondary">Not Delivered</span>`;
                    }
                }
            },
            { title: 'Type', data: 'jewelry_type' },
            { 
                title: 'Quantity', 
                data: null,
                render: function(data, type, row) {
                    const colorDetails = row.colors.map(c => `${c.color}: ${c.quantity}`).join(', ');
                    return `<span title="${colorDetails}" data-bs-toggle="tooltip" data-bs-placement="top">${row.quantity}</span>`;
                }
            },
            { 
                title: 'Order Date', 
                data: 'order_date',
                render: data => new Date(data).toLocaleDateString()
            },
            { 
                title: 'Est. Delivery Date', 
                data: 'est_delivery_date',
                render: data => data ? new Date(data).toLocaleDateString() : 'Not set'
            },
            { title: 'Weight/Set(gm)', data: 'weight' },
            {
                title: 'Actions',
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <button class="btn btn-sm btn-outline-danger delete-order-btn" 
                                data-order-date="${row.order_date}" 
                                data-model-no="${row.model_no}"
                                data-is-reordered="${row.is_repeated}"
                                title="Delete Orders">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    `;
                }
            }
        ]
    });

    // Initialize Reorders DataTable
    const reordersTable = $('#reordersTable').DataTable({
        processing: true,
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        responsive: true,
        autoWidth: false,
        order: [[5, 'desc']], // Order by date descending
        ajax: {
            url: '/api/client/orders/',
            dataSrc: function(json) {
                // Group the data for table display
                const groupedData = groupDataForTable(json.data);
                
                // Filter only repeated orders
                return groupedData.filter(order => {
                    return order.is_repeated && 
                        !order.individual_orders.some(o => ['RETURNED', 'DEFECTIVE'].includes(o.status));
                });
            }
        },
        columns: [
            {
                title: 'Sr. No',
                data: null,
                render: function (data, type, row, meta) {
                    return meta.row + 1;
                }
            },
            { 
                title: 'Model Name', 
                data: null,
                render: function(data, type, row) {
                    return `<div class="d-flex align-items-center">
                        ${row.model_img ? 
                        `<img src="${row.model_img}" alt="Model" class="me-2 rounded table-img model-image-clickable" data-img-src="${row.model_img}">` : 
                        '<span class="badge bg-secondary me-2">No Image</span>'}
                        <strong>${row.model_no}</strong>
                    </div>`;
                }
            },
            { 
                title: 'Delivery Status', 
                data: 'delivered',
                render: function(data) {
                    if (data === 'partial') {
                        return `<span class="badge bg-warning">Partially Delivered</span>`;
                    } else if (data === true) {
                        return `<span class="badge bg-success">Delivered</span>`;
                    } else {
                        return `<span class="badge bg-secondary">Not Delivered</span>`;
                    }
                }
            },
            { title: 'Type', data: 'jewelry_type' },
            { 
                title: 'Quantity', 
                data: null,
                render: function(data, type, row) {
                    const colorDetails = row.colors.map(c => `${c.color}: ${c.quantity}`).join(', ');
                    return `<span title="${colorDetails}" data-bs-toggle="tooltip" data-bs-placement="top">${row.quantity}</span>`;
                }
            },
            { 
                title: 'Order Date', 
                data: 'order_date',
                render: data => new Date(data).toLocaleDateString()
            },
            { 
                title: 'Est. Delivery Date', 
                data: 'est_delivery_date',
                render: data => data ? new Date(data).toLocaleDateString() : 'Not set'
            },
            { title: 'Weight/Set(gm)', data: 'weight' },
            {
                title: 'Actions',
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <button class="btn btn-sm btn-outline-danger delete-order-btn" 
                                data-order-date="${row.order_date}" 
                                data-model-no="${row.model_no}"
                                data-is-reordered="${row.is_repeated}"
                                title="Delete Orders">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    `;
                }
            }
        ]
    });

    // Initialize Returns DataTable with modified columns for returns
    const returnsTable = $('#returnsTable').DataTable({
        ...commonSettings,
        ajax: {
            url: '/api/client/orders/',
            dataSrc: function(json) {
                // For returns, we still want individual orders, not grouped
                const flatData = flattenGroupedData(json.data);
                
                // Filter orders with status RETURNED or DEFECTIVE
                return flatData.filter(order => 
                    ['RETURNED', 'DEFECTIVE'].includes(order.status));
            }
        },
        columns: [
            // ... keep existing returns columns as they are
            {
                title: 'Sr. No',
                data: null,
                render: function (data, type, row, meta) {
                    return meta.row + 1;
                }
            },
            { 
                title: 'Model Name', 
                data: null,
                render: function(data, type, row) {
                    return `<div class="d-flex align-items-center">
                        ${row.model_img ? 
                        `<img src="${row.model_img}" alt="Model" class="me-2 rounded table-img model-image-clickable" data-img-src="${row.model_img}">` : 
                        '<span class="badge bg-secondary me-2">No Image</span>'}
                        <strong>${row.model_no}</strong>
                    </div>`;
                }
            },
            { 
                title: 'Status', 
                data: 'status',
                render: function(data) {
                    const badgeClass = data === 'DEFECTIVE' ? 'danger' : 'warning';
                    return `<span class="badge bg-${badgeClass}">${data}</span>`;
                }
            },
            { 
                title: 'Delivery Status', 
                data: 'delivered',
                render: function(data) {
                    return data ? 
                        `<span class="badge bg-success">Delivered</span>` : 
                        `<span class="badge bg-secondary">Not Delivered</span>`;
                }
            },
            { title: 'Type', data: 'jewelry_type' },
            { 
                title: 'Quantity with color', 
                data: null,
                render: function(data, type, row) {
                    return `${row.quantity} (${row.color})`;
                }
            },
            { 
                title: 'Order Date', 
                data: 'order_date',
                render: data => new Date(data).toLocaleDateString()
            },
            { 
                title: 'Return Date', 
                data: 'return_date',
                render: data => data ? new Date(data).toLocaleDateString() : 'N/A'
            },
            { 
                title: 'Affected Pieces', 
                data: 'return_pieces',
                render: data => data || 'N/A'
            },
            {
                title: 'Details',
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `<button class="btn btn-sm btn-outline-info detail-btn">Details</button>`;
                }
            }
        ]
    });

    function flattenGroupedData(groupedData) {
        const flattenedData = [];
        
        // Iterate through each date
        for (const orderDate in groupedData) {
            // Iterate through each model_no within that date
            for (const modelNo in groupedData[orderDate]) {
                // Add all orders for this date-model combination
                flattenedData.push(...groupedData[orderDate][modelNo]);
            }
        }
        
        return flattenedData;
    }

    // Add image modal HTML to the document
    if ($('#imageModal').length === 0) {
        $('body').append(`
            <div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-fullscreen">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="imageModalLabel">Model Image</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center position-relative">
                            <!-- Display model details: Dimension, Jewelry Type, Weight -->
                            <div id="model-details" class="mb-3">
                                <p id="model-info" class="mb-0"></p>
                            </div>
                            <!-- Moved zoom controls to the top -->
                            <div class="zoom-controls mt-3">
                                <button class="btn btn-outline-secondary btn-sm me-2" id="zoomOut">
                                    <i class="fa-solid fa-search-minus"></i> Zoom Out
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" id="zoomIn">
                                    <i class="fa-solid fa-search-plus"></i> Zoom In
                                </button>
                                <button class="btn btn-outline-secondary btn-sm ms-2" id="resetZoom">
                                    <i class="fa-solid fa-arrows-rotate"></i> Reset
                                </button>
                            </div>
                            <div class="zoom-container" style="overflow: hidden; position: relative; height: 70vh; border: 1px solid #ddd;">
                                <div class="image-wrapper" style="position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                                    <img id="modalImage" src="" alt="Model Preview" 
                                        style="max-width: 100%; max-height: 100%; transform-origin: center; transition: transform 0.2s; display: block;">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        initializeImageZoom();
    }

    // Style for clickable images
    $('<style>')
        .text('.model-image-clickable { cursor: pointer; transition: transform 0.2s; } .model-image-clickable:hover { transform: scale(1.1); }')
        .appendTo('head');

    // Handle click on model images in any table
    $(document).on('click', '.model-image-clickable', function(e) {
        e.stopPropagation(); // Prevent row click events
        const imgSrc = $(this).data('img-src');
        $('#modalImage').attr('src', imgSrc);
        
        // Get model number from the table cell
        const modelNo = $(this).closest('div').find('strong').text();
        $('#imageModalLabel').text(`Model: ${modelNo}`);
        
        const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
        imageModal.show();
    });

    // My Orders Tab Filters - Changed to "All", "Delivered", "Not Delivered"
    $('#my-orders .filter-btn').on('click', function() {
        const filterValue = $(this).data('filter');
        
        // Clear date filter first
        $('.active-filter-indicator').remove();
        
        // Update active button
        $('#my-orders .filter-btn').removeClass('active');
        $(this).addClass('active');
        
        // Clear existing filters
        while($.fn.dataTable.ext.search.length > 0) {
            $.fn.dataTable.ext.search.pop();
        }
        
        if (filterValue === 'delivered') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    if (settings.nTable.id !== 'myOrdersTable') {
                        return true;
                    }
                    const order = myOrdersTable.row(dataIndex).data();
                    return order.delivered === true;
                }
            );
        } else if (filterValue === 'not-delivered') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    if (settings.nTable.id !== 'myOrdersTable') {
                        return true;
                    }
                    const order = myOrdersTable.row(dataIndex).data();
                    return order.delivered === false;
                }
            );
        }
        
        myOrdersTable.draw();
    });

    // Handle reorder filter dropdown change
    $('#reorders .filter-btn').on('click', function() {
        const filterValue = $(this).data('filter');
        
        // Update active button in dropdown
        $('#reorders .filter-btn').removeClass('active');
        $(this).addClass('active');
        
        // Update dropdown button text
        let buttonText = 'All Reorders';
        if (filterValue !== 'all-reorders') {
            buttonText = $(this).text();
        }
        $('#reorderFilterDropdown').text(buttonText);
        
        $.fn.dataTable.ext.search.pop();
        
        if (filterValue === 'delivered') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = reordersTable.row(dataIndex).data();
                    return order.delivered === true;
                }
            );
        } else if (filterValue === 'not-delivered') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = reordersTable.row(dataIndex).data();
                    return order.delivered === false;
                }
            );
        } else if (filterValue !== 'all-reorders') {
            const status = filterValue.replace('status-', '').replace(/-/g, ' ').toUpperCase();
            
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = reordersTable.row(dataIndex).data();
                    return order.status === status;
                }
            );
        }
        
        reordersTable.draw();
    });

    // Returns Tab Filters
    $('#returns .filter-btn').on('click', function() {
        const filterValue = $(this).data('filter');
        
        // Update active button
        $('#returns .filter-btn').removeClass('active');
        $(this).addClass('active');
        
        $.fn.dataTable.ext.search.pop();
        
        if (filterValue === 'defective') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = returnsTable.row(dataIndex).data();
                    return order.status === 'DEFECTIVE';
                }
            );
        } else if (filterValue === 'returned') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = returnsTable.row(dataIndex).data();
                    return order.status === 'RETURNED' && !order.status.includes('DEFECTIVE');
                }
            );
        } else if (filterValue === 'delivered') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = returnsTable.row(dataIndex).data();
                    return order.delivered === true;
                }
            );
        } else if (filterValue === 'not-delivered') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = returnsTable.row(dataIndex).data();
                    return order.delivered === false;
                }
            );
        }
        
        returnsTable.draw();
    });

    // Add return information to rows
    returnsTable.on('draw', function() {
        // Add return information to rows
        $('#returnsTable tbody tr').each(function() {
            const rowData = returnsTable.row(this).data();
            if (rowData.return_reason) {
                const returnInfo = $(`
                    <tr class="return-details bg-light">
                        <td colspan="10">
                            <div class="p-2">
                                <h6 class="mb-1">Return Information</h6>
                                <p class="mb-1"><strong>Reason:</strong> ${rowData.return_reason}</p>
                                <p class="mb-1"><strong>Date:</strong> ${new Date(rowData.return_date).toLocaleDateString()}</p>
                                <p class="mb-0"><strong>Pieces affected:</strong> ${rowData.return_pieces}</p>
                            </div>
                        </td>
                    </tr>
                `);
                $(this).after(returnInfo);
            }
        });
    });

    // Handle click on Details button in returns table
    $('#returnsTable').on('click', '.detail-btn', function(e) {
        e.stopPropagation();
        const tr = $(this).closest('tr');
        const row = returnsTable.row(tr);
        const data = row.data();
        
        Swal.fire({
            title: `Return Details: ${data.model_no}`,
            html: `
                <div class="text-start">
                    <p><strong>Status:</strong> ${data.status}</p>
                    <p><strong>Delivery Status:</strong> ${data.delivered ? 'Delivered' : 'Not Delivered'}</p>
                    <p><strong>Return Reason:</strong> ${data.return_reason || 'Not specified'}</p>
                    <p><strong>Return Date:</strong> ${data.return_date ? new Date(data.return_date).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Affected Pieces:</strong> ${data.return_pieces || 'Not specified'}</p>
                    <p><strong>Original Order Date:</strong> ${new Date(data.order_date).toLocaleDateString()}</p>
                    <p><strong>Order Type:</strong> ${data.is_repeated ? 'Reorder' : 'Original Order'}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Close'
        });
    });

    // Add clickable row expansion to view return details
    $('#returnsTable tbody').on('click', 'tr:not(.return-details)', function() {
        const rowData = returnsTable.row(this).data();
        if (rowData.return_reason) {
            const nextRow = $(this).next();
            if (nextRow.hasClass('return-details')) {
                nextRow.toggle();
            }
        }
    });

    // Reload tables when switching tabs to ensure data is fresh
    // $('a[data-bs-toggle="tab"]').on('shown.bs.tab', function(e) {
    //     const target = $(e.target).attr("href");
    //     if (target === "#my-orders") {
    //         myOrdersTable.ajax.reload();
    //     } else if (target === "#reorders") {
    //         reordersTable.ajax.reload();
    //     } else if (target === "#returns") {
    //         returnsTable.ajax.reload();
    //     }
    // });

    $('a[data-bs-toggle="tab"]').on('shown.bs.tab', function(e) {
        // Remove automatic reload - tables are already loaded
        // This prevents unnecessary API calls when switching tabs
    });
    
    /* Comment out order approval functionality for client view
    // Order Approval with Swal confirmation
    $(document).on('click', '.allow-order', function() {
        const orderId = $(this).data('id');
        
        Swal.fire({
            title: 'Approve this order?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, approve it!',
            cancelButtonText: 'No, cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/api/orders/${orderId}/approve/`,
                    type: 'POST',
                    headers: { 'X-CSRFToken': csrfToken },
                    success: function() {
                        showAlert('Order approved successfully', 'success');
                        refreshAllTables();
                    },
                    error: function(xhr) {
                        showAlert(`Error: ${xhr.responseText || 'Could not approve order'}`, 'danger');
                    }
                });
            }
        });
    });

    // Deny Order
    $(document).on('click', '.deny-order', function() {
        $('#denyOrderId').val($(this).data('id'));
        $('#denyOrderModal').modal('show');
    });

    // Return Order
    $(document).on('click', '.return-order', function() {
        $('#returnOrderId').val($(this).data('id'));
        $('#isRepeatedOrder').val($(this).data('repeated'));
        $('#returnOrderModal').modal('show');
    });

    // Cancel Repeated Order with Swal confirmation
    $(document).on('click', '.cancel-order', function() {
        const orderId = $(this).data('id');
        
        Swal.fire({
            title: 'Cancel this repeated order?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel it!',
            cancelButtonText: 'No, keep it'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/api/repeated-orders/${orderId}/cancel/`,
                    type: 'POST',
                    headers: { 'X-CSRFToken': csrfToken },
                    success: function() {
                        showAlert('Order cancelled successfully', 'success');
                        refreshAllTables();
                    },
                    error: function(xhr) {
                        showAlert(`Error: ${xhr.responseText || 'Could not cancel order'}`, 'danger');
                    }
                });
            }
        });
    });

    // Submit Deny Order Form
    $('#denyOrderForm').on('submit', function(e) {
        e.preventDefault();
        
        const orderId = $('#denyOrderId').val();
        const formData = new FormData(this);
        
        $.ajax({
            url: `/api/orders/${orderId}/deny/`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'X-CSRFToken': csrfToken },
            success: function() {
                $('#denyOrderModal').modal('hide');
                $('#denyOrderForm')[0].reset();
                showAlert('Order denied successfully', 'success');
                refreshAllTables();
            },
            error: function(xhr) {
                showAlert(`Error: ${xhr.responseText || 'Could not deny order'}`, 'danger');
            }
        });
    });

    // Submit Return Order Form
    $('#returnOrderForm').on('submit', function(e) {
        e.preventDefault();
        
        const orderId = $('#returnOrderId').val();
        const isRepeated = $('#isRepeatedOrder').val() === 'true';
        const formData = new FormData(this);
        
        formData.append('is_repeated', isRepeated);
        
        const endpoint = isRepeated ? 
            `/api/repeated-orders/${orderId}/return/` : 
            `/api/orders/${orderId}/return/`;
        
        $.ajax({
            url: endpoint,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'X-CSRFToken': csrfToken },
            success: function() {
                $('#returnOrderModal').modal('hide');
                $('#returnOrderForm')[0].reset();
                showAlert('Order marked for return successfully', 'success');
                refreshAllTables();
            },
            error: function(xhr) {
                showAlert(`Error: ${xhr.responseText || 'Could not return order'}`, 'danger');
            }
        });
    });
    */

    // Function to update order statistics
    function updateOrderStats(groupedData) {
        // Flatten the grouped data for stats calculation
        const data = flattenGroupedData(groupedData);
        
        const activeOrders = data.filter(order => 
            !['RETURNED', 'DEFECTIVE', 'FINISHED'].includes(order.status) && !order.is_repeated).length;
        
        const reorders = data.filter(order => order.is_repeated && 
            !['RETURNED', 'DEFECTIVE'].includes(order.status)).length;
        
        const returns = data.filter(order => 
            ['RETURNED', 'DEFECTIVE'].includes(order.status)).length;
        
        const pendingApproval = data.filter(order => 
            !order.is_approved && !order.is_repeated).length;
        
        const deliveredOrders = data.filter(order => order.delivered).length;
        
        $('#activeOrdersCount').text(activeOrders);
        $('#reordersCount').text(reorders);
        $('#returnsCount').text(returns);
        $('#pendingApprovalCount').text(pendingApproval);
        $('#deliveredOrdersCount').text(deliveredOrders);
    }

    // Update statistics on initial load and table reload
    $.ajax({
        url: '/api/client/orders/',
        success: function(response) {
            updateOrderStats(response.data);
        }
    });

    // Helper function to refresh all tables
    function refreshAllTables() {
        orderSummaryTable.ajax.reload();
        myOrdersTable.ajax.reload();
        reordersTable.ajax.reload();
        returnsTable.ajax.reload();
        
        // Update statistics after table reload
        $.ajax({
            url: '/api/client/orders/',
            success: function(response) {
                updateOrderStats(response.data);
            }
        });
    }
    
    // Alert helper function using Bootstrap Toast
    function showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        if (!$('#alertContainer').length) {
            $('body').append('<div id="alertContainer" class="position-fixed top-0 end-0 p-3" style="z-index: 1055;"></div>');
        }
        
        const toast = $(alertHtml);
        $('#alertContainer').append(toast);
        
        const bsToast = new bootstrap.Toast(toast[0], {
            autohide: true,
            delay: 5000
        });
        bsToast.show();
    }

    function openImageModal(imageUrl, modelName, jewelryType, weight, length, breadth) {
        $('#imageModalLabel').text(modelName);
        $('#modalImage').attr('src', imageUrl);
        $('#modalImage').css('transform', 'scale(1)');
    
        // Set all info in one line
        $('#model-info').text(`${length}x${breadth} cm | ${jewelryType} | ${weight} gm`);
    
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('imageModal'));
        modal.show();
    }
    
    // Initialize zoom functionality for the image modal
    function initializeImageZoom() {
        let scale = 1;
        const scaleStep = 0.25;
        const maxScale = 3;
        const minScale = 0.5;
    
        const $modalImage = $('#modalImage');
        const $zoomContainer = $('.zoom-container');
        const $imageWrapper = $('.image-wrapper');
    
        // Disable default image dragging
        $modalImage.on('dragstart', function (e) {
            e.preventDefault();
        });
    
        // Zoom in
        $('#zoomIn').on('click', function () {
            console.log('Zoom in clicked, current scale:', scale);
            if (scale < maxScale) {
                scale += scaleStep;
                updateZoom();
            }
        });
    
        // Zoom out
        $('#zoomOut').on('click', function () {
            console.log('Zoom out clicked, current scale:', scale);
            if (scale > minScale) {
                scale -= scaleStep;
                updateZoom();
            }
        });
    
        // Reset zoom
        function resetZoom() {
            console.log('Reset zoom called');
            scale = 1;
            updateZoom();
            $imageWrapper.css({
                'transform': 'translate(0px, 0px)'
            });
        }
    
        $('#resetZoom').on('click', resetZoom);
        $('#imageModal').on('hidden.bs.modal', resetZoom);
    
        // Update image zoom scale
        function updateZoom() {
            console.log('Updating zoom to scale:', scale);
            $modalImage.css('transform', `scale(${scale})`);
            
            // Update cursor based on zoom level
            if (scale > 1) {
                $zoomContainer.css('cursor', 'grab');
            } else {
                $zoomContainer.css('cursor', 'default');
            }
        }
    
        // Improved drag-to-move logic
        let isDragging = false;
        let startX = 0, startY = 0;
        let currentX = 0, currentY = 0;
    
        $zoomContainer.on('mousedown', function (e) {
            if (scale > 1) {
                isDragging = true;
                $zoomContainer.css('cursor', 'grabbing');
                
                // Get current transform values
                const transform = $imageWrapper.css('transform');
                const matrix = transform.match(/matrix\([^)]+\)/);
                if (matrix) {
                    const values = matrix[0].slice(7, -1).split(',');
                    currentX = parseFloat(values[4]) || 0;
                    currentY = parseFloat(values[5]) || 0;
                }
                
                startX = e.clientX - currentX;
                startY = e.clientY - currentY;
                e.preventDefault();
            }
        });
    
        $(document).on('mousemove', function (e) {
            if (!isDragging || scale <= 1) return;
            e.preventDefault();
            
            currentX = e.clientX - startX;
            currentY = e.clientY - startY;
            
            // Apply boundaries to prevent dragging too far
            const containerWidth = $zoomContainer.width();
            const containerHeight = $zoomContainer.height();
            const imageWidth = $modalImage.width() * scale;
            const imageHeight = $modalImage.height() * scale;
            
            const maxX = Math.max(0, (imageWidth - containerWidth) / 2);
            const maxY = Math.max(0, (imageHeight - containerHeight) / 2);
            
            currentX = Math.min(maxX, Math.max(-maxX, currentX));
            currentY = Math.min(maxY, Math.max(-maxY, currentY));
            
            $imageWrapper.css('transform', `translate(${currentX}px, ${currentY}px)`);
        });
    
        $(document).on('mouseup', function () {
            if (isDragging) {
                isDragging = false;
                $zoomContainer.css('cursor', scale > 1 ? 'grab' : 'default');
            }
        });
    
        // Optional: double-click to toggle zoom
        $modalImage.on('dblclick', function () {
            if (scale === 1) {
                scale = 2;
            } else {
                resetZoom();
                return;
            }
            updateZoom();
        });
    
        // Mouse wheel zoom (optional enhancement)
        $zoomContainer.on('wheel', function(e) {
            e.preventDefault();
            const delta = e.originalEvent.deltaY;
            
            if (delta > 0 && scale > minScale) {
                // Scroll down - zoom out
                scale -= scaleStep;
                updateZoom();
            } else if (delta < 0 && scale < maxScale) {
                // Scroll up - zoom in
                scale += scaleStep;
                updateZoom();
            }
        });
    
        // Touch support for mobile
        let touchStartX = 0, touchStartY = 0;
        
        $zoomContainer.on('touchstart', function(e) {
            if (scale > 1) {
                const touch = e.originalEvent.touches[0];
                
                // Get current transform values
                const transform = $imageWrapper.css('transform');
                const matrix = transform.match(/matrix\([^)]+\)/);
                if (matrix) {
                    const values = matrix[0].slice(7, -1).split(',');
                    currentX = parseFloat(values[4]) || 0;
                    currentY = parseFloat(values[5]) || 0;
                }
                
                touchStartX = touch.clientX - currentX;
                touchStartY = touch.clientY - currentY;
            }
        });
        
        $zoomContainer.on('touchmove', function(e) {
            if (scale > 1) {
                e.preventDefault();
                const touch = e.originalEvent.touches[0];
                
                currentX = touch.clientX - touchStartX;
                currentY = touch.clientY - touchStartY;
                
                // Apply boundaries
                const containerWidth = $zoomContainer.width();
                const containerHeight = $zoomContainer.height();
                const imageWidth = $modalImage.width() * scale;
                const imageHeight = $modalImage.height() * scale;
                
                const maxX = Math.max(0, (imageWidth - containerWidth) / 2);
                const maxY = Math.max(0, (imageHeight - containerHeight) / 2);
                
                currentX = Math.min(maxX, Math.max(-maxX, currentX));
                currentY = Math.min(maxY, Math.max(-maxY, currentY));
                
                $imageWrapper.css('transform', `translate(${currentX}px, ${currentY}px)`);
            }
        });
    }

    // Enable tooltips for quantity hover
    $(document).on('mouseenter', '[data-bs-toggle="tooltip"]', function() {
        $(this).tooltip('show');
    });
    
    $(document).on('mouseleave', '[data-bs-toggle="tooltip"]', function() {
        $(this).tooltip('hide');
    });
    
    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();

    if ($('#deleteOrderModal').length === 0) {
        $('body').append(`
            <div class="modal fade" id="deleteOrderModal" tabindex="-1" aria-labelledby="deleteOrderModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title" id="deleteOrderModalLabel">
                                <i class="fas fa-trash-alt me-2"></i>Delete Orders
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Warning:</strong> This action cannot be undone. Please select which orders you want to delete.
                            </div>
                            
                            <div class="mb-3">
                                <h6>Model: <span id="deleteModalModelNo"></span></h6>
                                <p class="text-muted">Order Date: <span id="deleteModalOrderDate"></span></p>
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="selectAllOrders">
                                    <label class="form-check-label fw-bold" for="selectAllOrders">
                                        Select All Orders
                                    </label>
                                </div>
                            </div>
                            
                            <div id="orderDetailsList" class="border rounded p-3" style="max-height: 400px; overflow-y: auto;">
                                <!-- Order details will be populated here -->
                            </div>
                            
                            <div class="mt-3">
                                <p class="text-muted mb-0">
                                    <i class="fas fa-info-circle me-1"></i>
                                    Selected orders: <span id="selectedOrdersCount" class="fw-bold">0</span>
                                </p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancel
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteBtn" disabled>
                                <i class="fas fa-trash-alt me-1"></i>Delete Selected Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    const commonSettingsWithDelete = {
        ...commonSettings,
        columns: [
            ...commonSettings.columns,
            {
                title: 'Actions',
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <button class="btn btn-sm btn-outline-danger delete-order-btn" 
                                data-order-date="${row.order_date}" 
                                data-model-no="${row.model_no}"
                                data-is-reordered="${row.is_repeated}"
                                title="Delete Orders">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    `;
                }
            }
        ]
    };

    $(document).on('click', '.delete-order-btn', function(e) {
        e.stopPropagation();
        
        const orderDate = $(this).data('order-date');
        const modelNo = $(this).data('model-no');
        const isReordered = $(this).data('is-reordered');
        
        // Set modal title information
        $('#deleteModalModelNo').text(modelNo);
        $('#deleteModalOrderDate').text(new Date(orderDate).toLocaleDateString());
        
        // Fetch detailed order information
        fetchOrderDetailsForDeletion(orderDate, modelNo, isReordered);
    });

    // Function to fetch order details for deletion
    function fetchOrderDetailsForDeletion(orderDate, modelNo, isReordered) {
        $.ajax({
            url: '/api/client/order-details-for-deletion/',
            method: 'POST',
            data: JSON.stringify({
                order_date: orderDate,
                model_no: modelNo,
                is_reordered: isReordered
            }),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': csrfToken
            },
            success: function(response) {
                if (response.success) {
                    populateDeleteModal(response.orders);
                    $('#deleteOrderModal').modal('show');
                } else {
                    showAlert(response.message, 'danger');
                }
            },
            error: function(xhr, status, error) {
                showAlert('Error fetching order details: ' + error, 'danger');
            }
        });
    }

    // Function to populate the delete modal with order details
    function populateDeleteModal(orders) {
        const ordersList = $('#orderDetailsList');
        ordersList.empty();
        
        if (orders.length === 0) {
            ordersList.html('<p class="text-muted text-center">No orders found.</p>');
            return;
        }
        
        let html = '';
        orders.forEach((order, index) => {
            const statusBadgeClass = getStatusBadgeClass(order.status);
            const deliveryBadgeClass = order.delivered ? 'success' : 'secondary';
            const deliveryText = order.delivered ? 'Delivered' : 'Not Delivered';
            const orderTypeText = order.type === 'repeated' ? 'Reorder' : 'Original Order';
            const orderTypeBadge = order.type === 'repeated' ? 'info' : 'primary';
            
            html += `
                <div class="border rounded p-3 mb-2 order-item" data-order-id="${order.id}" data-order-type="${order.type}">
                    <div class="form-check mb-2">
                        <input class="form-check-input order-checkbox" type="checkbox" 
                            id="order_${order.id}_${order.type}" 
                            data-order-id="${order.id}" 
                            data-order-type="${order.type}">
                        <label class="form-check-label fw-bold" for="order_${order.id}_${order.type}">
                            Order #${order.id} 
                            <span class="badge bg-${orderTypeBadge} ms-1">${orderTypeText}</span>
                        </label>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted d-block">Quantity & Color:</small>
                            <span class="fw-semibold">${order.quantity} (${order.color})</span>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted d-block">Status:</small>
                            <span class="badge bg-${statusBadgeClass}">${order.status}</span>
                        </div>
                    </div>
                    
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <small class="text-muted d-block">Delivery Status:</small>
                            <span class="badge bg-${deliveryBadgeClass}">${deliveryText}</span>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted d-block">Weight:</small>
                            <span>${order.weight}</span>
                        </div>
                    </div>
                    
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <small class="text-muted d-block">Type:</small>
                            <span>${order.jewelry_type}</span>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted d-block">Approved:</small>
                            <span class="badge bg-${order.is_approved ? 'success' : 'warning'}">
                                ${order.is_approved ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        ordersList.html(html);
        updateSelectedCount();
        
        // Reset checkboxes
        $('#selectAllOrders').prop('checked', false);
        $('.order-checkbox').prop('checked', false);
        $('#confirmDeleteBtn').prop('disabled', true);
    }

    // Function to get status badge class
    function getStatusBadgeClass(status) {
        const statusMap = {
            'Pending': 'warning',
            'CADE': 'secondary',
            'WAX SETTING': 'info',
            'CASTING': 'primary',
            'FILLING': 'warning',
            'POLISHING': 'secondary',
            'SETTING': 'info',
            'PLATING': 'primary',
            'QC-POST PLATING': 'warning',
            'READY TO DELIVER': 'success',
            'RE SETTING': 'secondary',
            'FINISHED': 'success',
            'RETURNED': 'warning',
            'DEFECTIVE': 'danger',
            'Delivered': 'success'
        };
        return statusMap[status] || 'light';
    }

    // Handle select all checkbox
    $(document).on('change', '#selectAllOrders', function() {
        const isChecked = $(this).is(':checked');
        $('.order-checkbox').prop('checked', isChecked);
        updateSelectedCount();
    });

    // Handle individual order checkbox
    $(document).on('change', '.order-checkbox', function() {
        updateSelectedCount();
        
        // Update select all checkbox
        const totalCheckboxes = $('.order-checkbox').length;
        const checkedCheckboxes = $('.order-checkbox:checked').length;
        $('#selectAllOrders').prop('checked', totalCheckboxes === checkedCheckboxes);
    });

    // Function to update selected count and enable/disable delete button
    function updateSelectedCount() {
        const selectedCount = $('.order-checkbox:checked').length;
        $('#selectedOrdersCount').text(selectedCount);
        $('#confirmDeleteBtn').prop('disabled', selectedCount === 0);
    }

    // Handle confirm delete button
    $(document).on('click', '#confirmDeleteBtn', function() {
        const selectedOrders = [];
        const selectedRepeatedOrders = [];
        
        $('.order-checkbox:checked').each(function() {
            const orderId = $(this).data('order-id');
            const orderType = $(this).data('order-type');
            
            if (orderType === 'repeated') {
                selectedRepeatedOrders.push(orderId);
            } else {
                selectedOrders.push(orderId);
            }
        });
        
        if (selectedOrders.length === 0 && selectedRepeatedOrders.length === 0) {
            showAlert('Please select at least one order to delete.', 'warning');
            return;
        }
        
        // Show confirmation dialog
        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedOrders.length + selectedRepeatedOrders.length} order(s). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel',
            customClass: {
                container: 'high-zindex-swal'
            },
            zIndex: 99999
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSelectedOrders(selectedOrders, selectedRepeatedOrders);
            }
        });
    });

    // Function to delete selected orders
    function deleteSelectedOrders(orderIds, repeatedOrderIds) {
        // Show loading state
        $('#confirmDeleteBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Deleting...');
        
        $.ajax({
            url: '/api/client/delete-orders/',
            method: 'POST',
            data: JSON.stringify({
                order_ids: orderIds,
                repeated_order_ids: repeatedOrderIds
            }),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': csrfToken
            },
            success: function(response) {
                if (response.success) {
                    $('#deleteOrderModal').modal('hide');
                    showAlert(response.message, 'success');
                    
                    // Refresh all tables
                    refreshAllTables();
                } else {
                    showAlert(response.message, 'danger');
                }
            },
            error: function(xhr, status, error) {
                showAlert('Error deleting orders: ' + error, 'danger');
            },
            complete: function() {
                // Reset button state
                $('#confirmDeleteBtn').prop('disabled', false).html('<i class="fas fa-trash-alt me-1"></i>Delete Selected Orders');
            }
        });
    }
});