$(document).ready(function() {
    toggleTableView(false);
    // Function to populate summary table
    function populateSummaryTable(data) {
        const summaryTableBody = $('#summaryTable tbody');
        summaryTableBody.empty();
        
        // Group data by date and client only (removed model)
        const summaryMap = new Map();
        
        data.forEach(item => {
            const key = `${item.order_date}_${item.client_name}`;
            
            if (!summaryMap.has(key)) {
                summaryMap.set(key, {
                    order_date: item.order_date,
                    client_name: item.client_name,
                    total_quantity: 0,
                    groups: []
                });
            }
            
            const summary = summaryMap.get(key);
            summary.total_quantity += item.total_quantity;
            summary.groups.push(item);
        });
        
        // Convert map to array and sort by date (newest first)
        const summaryArray = Array.from(summaryMap.values()).sort((a, b) => 
            new Date(b.order_date) - new Date(a.order_date)
        );
        
        // Populate the summary table (removed model column)
        summaryArray.forEach(summary => {
            const row = `
                <tr>
                    <td>${formatDate(summary.order_date)}</td>
                    <td>${summary.client_name}</td>
                    <td>
                        <button type="button" class="btn btn-outline-primary btn-sm quantity-filter-btn" 
                            data-date="${summary.order_date}" 
                            data-client="${summary.client_name}"
                            data-bs-toggle="tooltip" 
                            title="Click to filter main table">
                            <i class="fas fa-filter me-1"></i>
                            ${summary.total_quantity}
                        </button>
                    </td>
                </tr>
            `;
            summaryTableBody.append(row);
        });
        
        // Initialize tooltips
        $('[data-bs-toggle="tooltip"]').tooltip();
    }

    // Function to toggle between summary and main table
    function toggleTableView(showMain = false, filterData = null) {
        if (showMain) {
            // Hide the summary table card
            $('#summaryTableCard').hide();
            
            // Show the main table container
            $('#mainTableContainer').show();
            
            if (filterData) {
                // Apply filters to main table
                filterMainTable(filterData.date, filterData.client, filterData.model);
            }
        } else {
            // Show the summary table card
            $('#summaryTableCard').show();
            
            // Hide the main table container
            $('#mainTableContainer').hide();
            
            // Clear any existing filters
            if (typeof table !== 'undefined') {
                table.search('').columns().search('').draw();
            }
        }
    }
    
    // Function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Function to filter main table
    function filterMainTable(date, client) {
        console.log('Filtering with:', { date, client });
        
        // Clear any existing search and custom filters
        table.search('').columns().search('').draw();
        
        // Remove any existing custom search functions
        $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(function(fn) {
            return fn.name !== 'customOrderFilter';
        });
        
        // Add custom search function (removed model check)
        const customFilter = function(settings, data, dataIndex) {
            // Get the actual row data object
            const rowData = table.row(dataIndex).data();
            
            if (!rowData) return false;
            
            // Check matches based on the actual data structure (removed model)
            const clientMatch = rowData.client_name === client;
            const dateMatch = rowData.order_date === date;
            
            // Debug logging
            if (dataIndex < 3) { // Only log first few rows to avoid spam
                console.log(`Row ${dataIndex}:`, {
                    client: rowData.client_name,
                    date: rowData.order_date,
                    matches: { clientMatch, dateMatch }
                });
            }
            
            return clientMatch && dateMatch;
        };
        
        // Name the function for easier removal
        customFilter.displayName = 'customOrderFilter';
        
        // Add the custom filter
        $.fn.dataTable.ext.search.push(customFilter);
        
        // Redraw the table with the filter applied
        table.draw();
        
        // Debug: Check filtered results
        const filteredCount = table.rows({ search: 'applied' }).count();
        console.log('Filtered rows count:', filteredCount);
        
        if (filteredCount === 0) {
            console.warn('No rows match the filter criteria. Check data format.');
            // Show sample data for debugging
            const sampleRow = table.row(0).data();
            console.log('Sample row data:', sampleRow);
        }
        
        // Scroll to main table (only if main table is visible)
        if ($('#mainTableContainer').is(':visible')) {
            $('html, body').animate({
                scrollTop: $('#repeatedOrdersTable').offset().top - 100
            }, 500);
            
            // Highlight the table temporarily
            $('#repeatedOrdersTable').addClass('table-highlight');
            setTimeout(() => {
                $('#repeatedOrdersTable').removeClass('table-highlight');
            }, 2000);
        }
    }

    
    // Function to show detailed breakdown modal
    function showDetailedBreakdown(date, client) {
        // Find matching data (removed model check)
        const matchingGroups = summaryData.filter(item => 
            item.order_date === date && 
            item.client_name === client
        );
        
        let modalContent = `
            <div class="modal fade" id="detailBreakdownModal" tabindex="-1" aria-labelledby="detailBreakdownModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="detailBreakdownModalLabel">
                                Order Details - ${client}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <strong>Order Date:</strong> ${formatDate(date)}<br>
                                <strong>Client:</strong> ${client}
                            </div>
                            <hr>
        `;
        
        matchingGroups.forEach((group, groupIndex) => {
            modalContent += `
                <div class="mb-4">
                    <h6 class="text-primary">Model: ${group.model_no}</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Color</th>
                                    <th>Quantity</th>
                                    <th>Delivered</th>
                                    <th>Status</th>
                                    <th>Delivery Progress</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            group.orders.forEach(order => {
                const progressPercent = Math.round((order.quantity_delivered / order.quantity) * 100);
                const progressClass = progressPercent === 100 ? 'bg-success' : 
                                    progressPercent > 50 ? 'bg-warning' : 'bg-danger';
                
                modalContent += `
                    <tr>
                        <td>${order.color_name}</td>
                        <td>${order.quantity}</td>
                        <td>${order.quantity_delivered}</td>
                        <td>
                            <span class="badge ${order.delivered ? 'bg-success' : 'bg-warning'}">
                                ${order.status_name}
                            </span>
                        </td>
                        <td>
                            <div class="progress" style="height: 20px;">
                                <div class="progress-bar ${progressClass}" role="progressbar" 
                                    style="width: ${progressPercent}%" 
                                    aria-valuenow="${progressPercent}" 
                                    aria-valuemin="0" aria-valuemax="100">
                                    ${progressPercent}%
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            modalContent += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        modalContent += `
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary filter-from-modal" 
                                data-date="${date}" data-client="${client}">
                                <i class="fas fa-filter"></i> Filter Main Table
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        $('#detailBreakdownModal').remove();
        
        // Add modal to DOM and show
        $('body').append(modalContent);
        $('#detailBreakdownModal').modal('show');
    }
    
    // Store summary data globally for filtering
    let summaryData = [];
    
    // Event handlers for summary table
    $(document).on('click', '.quantity-filter-btn', function() {
        const date = $(this).data('date');
        const client = $(this).data('client');
        
        console.log('Filtering by:', { date, client }); // Debug log
        
        // Hide the entire summary table card
        $('#summaryTableCard').hide();
        
        // Show the main table container
        $('#mainTableContainer').show();
        
        // Apply filters to main table with date and client only
        filterMainTable(date, client);

        $('#reOrderheader').text(`Re Orders List for ${client} on ${formatDate(date)}`);
        
        // Show back button
        if (!$('#backToSummary').length) {
            $('#mainTableContainer').prepend(`
                <div class="mb-3">
                    <button type="button" id="backToSummary" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Back to Summary
                    </button>
                    <small class="text-muted ms-2">
                        Filtered by: ${formatDate(date)} | ${client}
                    </small>
                </div>
            `);
        } else {
            $('#backToSummary').show();
            // Update the filter info
            $('#backToSummary').next('.text-muted').text(`Filtered by: ${formatDate(date)} | ${client}`);
        }
    });

    
    $(document).on('click', '.view-details-btn', function() {
        const date = $(this).data('date');
        const client = $(this).data('client');
        
        showDetailedBreakdown(date, client, model);
    });
    
    $(document).on('click', '.filter-from-modal', function() {
        const date = $(this).data('date');
        const client = $(this).data('client');
        
        $('#detailBreakdownModal').modal('hide');
        filterMainTable(date, client);
    });

    // Updated back button handler
    $(document).on('click', '#backToSummary', function() {
        // Show the entire summary table card
        $('#summaryTableCard').show();
        
        // Hide the main table container
        $('#mainTableContainer').hide();

        $('#reOrderheader').text('Re Orders List');
        
        // Hide the back button
        $('#backToSummary').hide();
        
        // Clear any applied filters on the main table
        if (typeof table !== 'undefined') {
            // Clear column searches
            table.search('').columns().search('').draw();
            
            // Remove custom search functions
            $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(function(fn) {
                return fn.displayName !== 'customOrderFilter';
            });
            
            // Redraw to apply the cleanup
            table.draw();
        }
    });
    
    // Add CSS for table highlighting
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .table-highlight {
                animation: highlightTable 2s ease-in-out;
            }
            
            @keyframes highlightTable {
                0% { box-shadow: 0 0 0 rgba(0, 123, 255, 0); }
                50% { box-shadow: 0 0 20px rgba(0, 123, 255, 0.8); }
                100% { box-shadow: 0 0 0 rgba(0, 123, 255, 0); }
            }
            
            .progress {
                border-radius: 10px;
            }
            
            .quantity-filter-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
        `)
        .appendTo('head');

    // Make sure the table exists in the DOM before initializing
    if (!$('#repeatedOrdersTable').length) {
        console.error('Table #repeatedOrdersTable not found in DOM');
        return;
    }
    
    // Add image viewer modal to the DOM
    $('body').append(`
        <div class="modal fade" id="imageViewerModal" tabindex="-1" aria-labelledby="imageViewerModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="imageViewerModalLabel">Model Image Viewer</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body d-flex flex-column align-items-center justify-content-center">
                        <div class="image-info mb-2 text-center">
                            <span class="badge bg-info me-2" id="imageColorInfo">Color: N/A</span>
                            <span class="badge bg-secondary" id="imageDimensionsInfo">Dimensions: Calculating...</span>
                        </div>
                        <div class="controls mb-2">
                            <button class="btn btn-primary zoom-in me-2"><i class="fas fa-search-plus"></i> Zoom In</button>
                            <button class="btn btn-primary zoom-out me-2"><i class="fas fa-search-minus"></i> Zoom Out</button>
                            <button class="btn btn-secondary reset-zoom"><i class="fas fa-undo"></i> Reset</button>
                        </div>
                        <div class="image-container position-relative" style="overflow: hidden; height: 75vh; width: 90%; display: flex; justify-content: center; align-items: center;">
                            <img id="zoomableImage" src="" alt="Model Image" style="transform-origin: center; transition: transform 0.3s ease; max-height: 100%; max-width: 100%; cursor: move;">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    try {
        // Initialize DataTable with proper error handling
        var table = $('#repeatedOrdersTable').DataTable({
            ajax: {
                url: '/api/repeated-orders/',
                dataSrc: function(json) {
                    // Store data for summary table
                    summaryData = json.data;
                    
                    // Populate summary table
                    populateSummaryTable(json.data);
                    
                    return json.data;
                },
                error: function(xhr, error, thrown) {
                    console.error('Ajax error:', error, thrown);
                }
            },
            columns: [
                { data: null, render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr. No. column (auto-incremented)
                }},
                // { data: "client_name" }, // Client column
                { data: null, render: function(data, type, row) {
                    // Model column with image - made clickable with color data attribute
                    return `
                        <div class="d-flex align-items-center">
                            <img src="${row.model_img}" alt="${row.model_no}" class="me-2 clickable-image" 
                                width="40" height="40" data-img-src="${row.model_img}" 
                                data-model-no="${row.model_no}" data-color="${row.color_name || row.color || 'N/A'}"
                                data-length="${row.lenght || row.length || 'N/A'}" data-breadth="${row.breadth || 'N/A'}"
                                style="cursor: pointer;">
                            <span>${row.model_no}</span>
                        </div>
                    `;
                }},
                {
                    data: null,
                    render: function(data, type, row) {
                        // Calculate delivery status for grouped orders
                        if (row.orders && row.orders.length > 0) {
                            var deliveredCount = 0;
                            var totalOrders = row.orders.length;
                            var deliveryDetails = [];
                            
                            row.orders.forEach(function(order) {
                                var isDelivered = order.delivered || (order.quantity_delivered >= order.quantity);
                                if (isDelivered) {
                                    deliveredCount++;
                                }
                                
                                deliveryDetails.push({
                                    color: order.color_name || order.color || 'N/A',
                                    quantity: order.quantity,
                                    delivered: order.quantity_delivered || 0,
                                    isFullyDelivered: isDelivered,
                                    status: isDelivered ? 'Delivered' : 'Not Delivered'
                                });
                            });
                            
                            var deliveryDetailsJson = JSON.stringify(deliveryDetails);
                            
                            if (deliveredCount === 0) {
                                return `<span class="badge bg-danger delivery-status-hover" 
                                        data-delivery-details='${deliveryDetailsJson}' 
                                        style="cursor: help;">Not Delivered</span>`;
                            } else if (deliveredCount === totalOrders) {
                                return `<span class="badge bg-success delivery-status-hover" 
                                        data-delivery-details='${deliveryDetailsJson}' 
                                        style="cursor: help;">Delivered</span>`;
                            } else {
                                return `<span class="badge bg-warning text-dark delivery-status-hover" 
                                        data-delivery-details='${deliveryDetailsJson}' 
                                        style="cursor: help;">Partially Delivered (${deliveredCount}/${totalOrders})</span>`;
                            }
                        } else {
                            // Single order case
                            var isDelivered = row.delivered || (row.quantity_delivered >= row.quantity);
                            var deliveryDetails = [{
                                color: row.color_name || row.color || 'N/A',
                                quantity: row.quantity,
                                delivered: row.quantity_delivered || 0,
                                isFullyDelivered: isDelivered,
                                status: isDelivered ? 'Delivered' : 'Not Delivered'
                            }];
                            
                            var deliveryDetailsJson = JSON.stringify(deliveryDetails);
                            
                            if (isDelivered) {
                                return `<span class="badge bg-success delivery-status-hover" 
                                        data-delivery-details='${deliveryDetailsJson}' 
                                        style="cursor: help;">Delivered</span>`;
                            } else {
                                return `<span class="badge bg-warning text-dark delivery-status-hover" 
                                        data-delivery-details='${deliveryDetailsJson}' 
                                        style="cursor: help;">Not Delivered</span>`;
                            }
                        }
                    }
                },
                { data: null, render: function(data, type, row) {
                    // Get status from first order in group
                    var firstOrder = row.orders && row.orders.length > 0 ? row.orders[0] : row;
                    
                    if (firstOrder.status_id === null) {
                        return '<span class="badge bg-warning">Not Set</span>';
                    } else {
                        return '<span class="badge bg-success">' + firstOrder.status_name + '</span>';
                    }
                }},
                { data: null, render: function(data, type, row) {
                    // Show total quantity with color breakdown
                    var totalQuantity = row.total_quantity || row.quantity;
                    var colorData = [];
                    
                    // If it's grouped data, collect all color information
                    if (row.orders && row.orders.length > 0) {
                        row.orders.forEach(function(order) {
                            colorData.push({
                                color: order.color_name || order.color || 'N/A',
                                quantity: order.quantity,
                                delivered: order.quantity_delivered || 0
                            });
                        });
                    } else {
                        colorData.push({
                            color: row.color_name || row.color || 'N/A',
                            quantity: row.quantity,
                            delivered: row.quantity_delivered || 0
                        });
                    }
                    
                    return `
                        <span class="quantity-total-hover" 
                            data-color-data='${JSON.stringify(colorData)}'
                            data-total-quantity="${totalQuantity}"
                            style="cursor: help; border-bottom: 1px dotted #999; position: relative;">
                            ${totalQuantity}
                        </span>
                    `;
                }},
                { data: null, render: function(data, type, row) {
                    // Get weight from first order
                    var firstOrder = row.orders && row.orders.length > 0 ? row.orders[0] : row;
                    var weight = firstOrder.weight;
                    return weight ? weight + ' g' : '';
                }}, 
                { data: null, render: function(data, type, row) {
                    // FIXED: Use the first individual order's ID instead of grouped parent ID
                    var orderId = row.orders && row.orders.length > 0 ? row.orders[0].id : row.id;
                    
                    return `
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-primary update-status" 
                                data-id="${orderId}" data-bs-toggle="modal" data-bs-target="#updateStatusModal">
                                Update Status
                            </button>
                        </div>
                    `;
                }}
            ],
            dom: 'Bfrtip',
            buttons: [
                'copy', 'excel', 'pdf', 'print'
            ],
            responsive: true,
            initComplete: function() {
                console.log('DataTable initialized successfully');
                
                // Add hover functionality for delivery status column
                $('#repeatedOrdersTable').on('mouseenter', '.delivery-status-hover', function(e) {
                    var $this = $(this);
                    var deliveryDetails = $this.data('delivery-details');
                    
                    if (!deliveryDetails || deliveryDetails.length === 0) return;
                    
                    // Build tooltip content with delivery status breakdown
                    var tooltipHtml = '<div class="custom-tooltip">';
                    tooltipHtml += '<div style="margin-bottom: 8px;"><strong>Delivery Details:</strong></div>';
                    tooltipHtml += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
                    
                    deliveryDetails.forEach(function(item, index) {
                        if (index > 0) {
                            tooltipHtml += '<hr style="margin: 4px 0; border-color: #555;">';
                        }
                        
                        var statusColor = item.isFullyDelivered ? '#28a745' : '#dc3545';
                        var deliveredQty = item.delivered;
                        var remainingQty = item.quantity - deliveredQty;
                        
                        tooltipHtml += `
                            <div>
                                <strong>Color:</strong> ${item.color}<br>
                                <strong>Total Quantity:</strong> ${item.quantity}<br>
                                <strong>Delivered:</strong> <span style="color: #28a745;">${deliveredQty}</span><br>
                                ${remainingQty > 0 ? `<strong>Remaining:</strong> <span style="color: #dc3545;">${remainingQty}</span><br>` : ''}
                                <strong>Status:</strong> <span style="color: ${statusColor};">${item.status}</span>
                            </div>
                        `;
                    });
                    
                    tooltipHtml += '</div></div>';
                    
                    // Create and position tooltip
                    var $tooltip = $(tooltipHtml);
                    $('body').append($tooltip);
                    
                    // Position tooltip at mouse cursor with offset
                    var leftPos = e.pageX + 10; // 10px offset from cursor
                    var topPos = e.pageY - 10;  // 10px above cursor
                    
                    // Get tooltip dimensions after adding to DOM
                    var tooltipWidth = $tooltip.outerWidth();
                    var tooltipHeight = $tooltip.outerHeight();
                    
                    // Prevent tooltip from going off-screen
                    if (leftPos + tooltipWidth > $(window).width() + $(window).scrollLeft()) {
                        leftPos = e.pageX - tooltipWidth - 10; // Show to the left of cursor
                    }
                    if (leftPos < $(window).scrollLeft()) {
                        leftPos = $(window).scrollLeft() + 10;
                    }
                    if (topPos < $(window).scrollTop()) {
                        topPos = e.pageY + 20; // Show below cursor
                    }
                    if (topPos + tooltipHeight > $(window).height() + $(window).scrollTop()) {
                        topPos = e.pageY - tooltipHeight - 10; // Show above cursor
                    }
                    
                    $tooltip.css({
                        position: 'absolute',
                        top: topPos,
                        left: leftPos,
                        backgroundColor: '#333',
                        color: '#fff',
                        padding: '12px 15px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        zIndex: 9999,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: '1.4',
                        display: 'block',
                        minWidth: '200px'
                    });
                    
                    $this.data('tooltip-element', $tooltip);
                });

                // Add mousemove event to update tooltip position as mouse moves
                $('#repeatedOrdersTable').on('mousemove', '.delivery-status-hover', function(e) {
                    var $this = $(this);
                    var $tooltip = $this.data('tooltip-element');
                    
                    if ($tooltip) {
                        var leftPos = e.pageX + 10;
                        var topPos = e.pageY - 10;
                        
                        var tooltipWidth = $tooltip.outerWidth();
                        var tooltipHeight = $tooltip.outerHeight();
                        
                        // Prevent tooltip from going off-screen
                        if (leftPos + tooltipWidth > $(window).width() + $(window).scrollLeft()) {
                            leftPos = e.pageX - tooltipWidth - 10;
                        }
                        if (leftPos < $(window).scrollLeft()) {
                            leftPos = $(window).scrollLeft() + 10;
                        }
                        if (topPos < $(window).scrollTop()) {
                            topPos = e.pageY + 20;
                        }
                        if (topPos + tooltipHeight > $(window).height() + $(window).scrollTop()) {
                            topPos = e.pageY - tooltipHeight - 10;
                        }
                        
                        $tooltip.css({
                            top: topPos,
                            left: leftPos
                        });
                    }
                });

                $('#repeatedOrdersTable').on('mouseleave', '.delivery-status-hover', function() {
                    var $this = $(this);
                    var $tooltip = $this.data('tooltip-element');
                    
                    if ($tooltip) {
                        $tooltip.remove();
                        $this.removeData('tooltip-element');
                    }
                });

                // Add hover functionality for quantity total column
                $('#repeatedOrdersTable').on('mouseenter', '.quantity-total-hover', function(e) {
                    var $this = $(this);
                    var colorData = $this.data('color-data');
                    var totalQuantity = $this.data('total-quantity');
                    
                    // Build tooltip content with all color breakdowns
                    var tooltipHtml = '<div class="custom-tooltip">';
                    tooltipHtml += `<div style="margin-bottom: 8px;"><strong>Total Quantity: ${totalQuantity}</strong></div>`;
                    tooltipHtml += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
                    
                    if (colorData && colorData.length > 0) {
                        colorData.forEach(function(item, index) {
                            if (index > 0) {
                                tooltipHtml += '<hr style="margin: 4px 0; border-color: #555;">';
                            }
                            tooltipHtml += `
                                <div>
                                    <strong>Color:</strong> ${item.color}<br>
                                    <strong>Quantity:</strong> ${item.quantity}<br>
                                    <strong>Delivered:</strong> ${item.delivered}
                                </div>
                            `;
                        });
                    }
                    
                    tooltipHtml += '</div></div>';
                    
                    // Create tooltip element
                    var $tooltip = $(tooltipHtml);
                    $('body').append($tooltip);
                    
                    // Position tooltip at mouse cursor with offset
                    var leftPos = e.pageX + 10;
                    var topPos = e.pageY - 10;
                    
                    var tooltipWidth = $tooltip.outerWidth();
                    var tooltipHeight = $tooltip.outerHeight();
                    
                    // Prevent tooltip from going off-screen
                    if (leftPos + tooltipWidth > $(window).width() + $(window).scrollLeft()) {
                        leftPos = e.pageX - tooltipWidth - 10;
                    }
                    if (leftPos < $(window).scrollLeft()) {
                        leftPos = $(window).scrollLeft() + 10;
                    }
                    if (topPos < $(window).scrollTop()) {
                        topPos = e.pageY + 20;
                    }
                    if (topPos + tooltipHeight > $(window).height() + $(window).scrollTop()) {
                        topPos = e.pageY - tooltipHeight - 10;
                    }
                    
                    $tooltip.css({
                        position: 'absolute',
                        top: topPos,
                        left: leftPos,
                        backgroundColor: '#333',
                        color: '#fff',
                        padding: '12px 15px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        zIndex: 9999,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: '1.4',
                        display: 'block',
                        minWidth: '200px'
                    });
                    
                    // Store tooltip reference
                    $this.data('tooltip-element', $tooltip);
                    
                    // Add hover effect to the element
                    $this.css({
                        backgroundColor: '#f0f0f0',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                    });
                });

                // Add mousemove event for quantity tooltip
                $('#repeatedOrdersTable').on('mousemove', '.quantity-total-hover', function(e) {
                    var $this = $(this);
                    var $tooltip = $this.data('tooltip-element');
                    
                    if ($tooltip) {
                        var leftPos = e.pageX + 10;
                        var topPos = e.pageY - 10;
                        
                        var tooltipWidth = $tooltip.outerWidth();
                        var tooltipHeight = $tooltip.outerHeight();
                        
                        // Prevent tooltip from going off-screen
                        if (leftPos + tooltipWidth > $(window).width() + $(window).scrollLeft()) {
                            leftPos = e.pageX - tooltipWidth - 10;
                        }
                        if (leftPos < $(window).scrollLeft()) {
                            leftPos = $(window).scrollLeft() + 10;
                        }
                        if (topPos < $(window).scrollTop()) {
                            topPos = e.pageY + 20;
                        }
                        if (topPos + tooltipHeight > $(window).height() + $(window).scrollTop()) {
                            topPos = e.pageY - tooltipHeight - 10;
                        }
                        
                        $tooltip.css({
                            top: topPos,
                            left: leftPos
                        });
                    }
                });

                $('#repeatedOrdersTable').on('mouseleave', '.quantity-total-hover', function() {
                    var $this = $(this);
                    var $tooltip = $this.data('tooltip-element');
                    
                    // Remove tooltip
                    if ($tooltip) {
                        $tooltip.remove();
                        $this.removeData('tooltip-element');
                    }
                    
                    // Remove hover effect
                    $this.css({
                        backgroundColor: '',
                        padding: '',
                        borderRadius: '',
                        fontWeight: ''
                    });
                });
            }
        });

        // Add CSS styles for the tooltips
        $('<style>')
            .prop('type', 'text/css')
            .html(`
                .quantity-total-hover:hover, .delivery-status-hover:hover {
                    opacity: 0.8;
                }
                
                .custom-tooltip {
                    font-family: Arial, sans-serif !important;
                    line-height: 1.4 !important;
                    pointer-events: none;
                }
                
                .custom-tooltip strong {
                    font-weight: bold;
                }
                
                .delivery-status-hover {
                    cursor: help !important;
                }
            `)
            .appendTo('head');

        // Image viewer functionality
        let currentScale = 1;
        const scaleStep = 0.2;
        const minScale = 0.5;
        const maxScale = 3;
        
        // Variables for drag functionality
        let isDragging = false;
        let startX, startY, translateX = 0, translateY = 0;
        let lastTranslateX = 0, lastTranslateY = 0;
        
        // Handle clicking on images in the table
        $('#repeatedOrdersTable').on('click', '.clickable-image', function() {
            const imgSrc = $(this).data('img-src');
            const modelNo = $(this).data('model-no');
            const color = $(this).data('color');
            const length = $(this).data('length');
            const breadth = $(this).data('breadth');
            
            // Update modal with image and title
            $('#zoomableImage').attr('src', imgSrc);
            $('#imageViewerModalLabel').text(`Model ${modelNo}`);
            
            // Reset zoom and drag to default state
            resetZoom();
            
            // Update color information
            $('#imageColorInfo').text(`Color: ${color}`);
            
            // Update dimensions information using the length and breadth
            $('#imageDimensionsInfo').text(`Dimensions: ${length} × ${breadth} cm`);
            
            // Open the modal
            const imageModal = new bootstrap.Modal(document.getElementById('imageViewerModal'));
            imageModal.show();
        });
        
        // Zoom in functionality
        $('.zoom-in').click(function() {
            if (currentScale < maxScale) {
                currentScale += scaleStep;
                updateZoom();
            }
        });
        
        // Zoom out functionality
        $('.zoom-out').click(function() {
            if (currentScale > minScale) {
                currentScale -= scaleStep;
                updateZoom();
                
                // If zooming out to 1 or less, reset position
                if (currentScale <= 1) {
                    resetPosition();
                }
            }
        });
        
        // Reset zoom functionality
        $('.reset-zoom').click(function() {
            resetZoom();
        });
        
        // Update zoom level and apply any existing translation
        function updateZoom() {
            $('#zoomableImage').css('transform', `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`);
            
            // Toggle draggable cursor based on zoom level
            if (currentScale > 1) {
                $('#zoomableImage').css('cursor', 'move');
            } else {
                $('#zoomableImage').css('cursor', 'default');
                // Only reset position if we're not already in resetPosition function
                if (translateX !== 0 || translateY !== 0) {
                    translateX = 0;
                    translateY = 0;
                    lastTranslateX = 0;
                    lastTranslateY = 0;
                    // Apply the transform directly here instead of calling updateZoom again
                    $('#zoomableImage').css('transform', `scale(${currentScale}) translate(0px, 0px)`);
                }
            }
        }
        
        // Reset position (no translation)
        function resetPosition() {
            translateX = 0;
            translateY = 0;
            lastTranslateX = 0;
            lastTranslateY = 0;
            // Apply the transform directly here instead of calling updateZoom
            $('#zoomableImage').css('transform', `scale(${currentScale}) translate(0px, 0px)`);
        }
        
        // Reset zoom to default (1)
        function resetZoom() {
            currentScale = 1;
            resetPosition();
        }
        
        // Drag functionality for the image
        $('#zoomableImage').on('mousedown', function(e) {
            if (currentScale <= 1) return; // Only allow dragging when zoomed in
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // Disable transition during drag for smoother movement
            $(this).css('transition', 'none');
            
            e.preventDefault();
        });
        
        $(document).on('mousemove', function(e) {
            if (!isDragging) return;
            
            // Calculate how much the mouse has moved
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Update the translation values
            translateX = lastTranslateX + dx / currentScale;
            translateY = lastTranslateY + dy / currentScale;
            
            // Apply the new transformation
            $('#zoomableImage').css('transform', `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`);
        });
        
        $(document).on('mouseup mouseleave', function() {
            if (!isDragging) return;
            
            isDragging = false;
            lastTranslateX = translateX;
            lastTranslateY = translateY;
            
            // Re-enable transition
            $('#zoomableImage').css('transition', 'transform 0.3s ease');
        });
        
        // When modal closes, reset zoom
        $('#imageViewerModal').on('hidden.bs.modal', function() {
            resetZoom();
        });

        let currentGroupedOrders = [];
        let selectedOrderFromDropdown = null;
        let currentOrderDetails = null;
        
        // Load statuses when modal is opened
        $('#updateStatusModal').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget);
            var orderId = button.data('id');
            var orderColor = button.data('color');
            
            // Store the selected order ID
            selectedOrderFromDropdown = orderId;
            $('#order_id').val(orderId);
            
            // Reset form and UI
            $('#groupedOrderOptions').hide();
            $('#updateSingle').prop('checked', true);
            $('#orderColorSelection').hide(); // Add this section for color selection
            currentGroupedOrders = [];
            
            // Update modal title
            if (orderColor) {
                $('#updateStatusModalLabel').text(`Update Order Status - ${orderColor}`);
            } else {
                $('#updateStatusModalLabel').text('Update Order Status');
            }
            
            // Fetch order details
            $.ajax({
                url: `/api/repeated-orders/${orderId}/`,
                type: 'GET',
                success: function(response) {
                    currentOrderDetails = response;
                    currentGroupedOrders = response.grouped_orders || [];
                    
                    // Show grouped options if there are multiple orders
                    if (response.is_grouped && currentGroupedOrders.length > 1) {
                        $('#groupedOrderOptions').show();
                        displayGroupedOrdersWithSelection(response, currentGroupedOrders, selectedOrderFromDropdown);
                        
                        // Store all grouped order IDs
                        var groupedIds = currentGroupedOrders.map(order => order.id);
                        $('#grouped_order_ids').val(JSON.stringify(groupedIds));
                    } else {
                        // Single order display
                        displaySingleOrderInfo(response);
                    }
                    
                    // Load the selected order's current data into the form
                    loadSelectedOrderData(selectedOrderFromDropdown);
                    
                    // Load statuses for dropdown
                    loadStatuses();
                },
                error: function(xhr) {
                    console.error('Error fetching order details', xhr);
                    alert('Error fetching order details');
                }
            });
        });

        function displaySingleOrderInfo(orderData) {
            var infoHtml = `
                <strong>Model:</strong> ${orderData.model_no}<br>
                <strong>Client:</strong> ${orderData.client_name}<br>
                <strong>Color:</strong> ${orderData.color_name}<br>
                <strong>Quantity:</strong> ${orderData.quantity}<br>
                <strong>Delivered:</strong> ${orderData.quantity_delivered || 0}<br>
                <strong>Status:</strong> ${orderData.status_name}
            `;
            $('#orderDetails').html(infoHtml);
        }

        function displayGroupedOrdersWithSelection(mainOrder, groupedOrders, selectedOrderId) {
            var infoHtml = `
                <strong>Model:</strong> ${mainOrder.model_no}<br>
                <strong>Client:</strong> ${mainOrder.client_name}<br>
                <strong>Total Variants:</strong> ${groupedOrders.length}<br>
                <hr>
                <div class="mb-3">
                    <strong>Select Order to Update:</strong>
                    <div class="mt-2">
            `;
            
            groupedOrders.forEach(function(order, index) {
                var isSelected = order.id == selectedOrderId;
                var checkedAttr = isSelected ? 'checked' : '';
                
                infoHtml += `
                    <div class="form-check mb-2">
                        <input class="form-check-input order-selector" type="radio" 
                            name="selectedOrder" id="order_${order.id}" 
                            value="${order.id}" ${checkedAttr}>
                        <label class="form-check-label" for="order_${order.id}">
                            <strong>${order.color_name}</strong> - 
                            Qty: ${order.quantity}, 
                            Delivered: ${order.quantity_delivered || 0}, 
                            Status: ${order.status_name}
                        </label>
                    </div>
                `;
            });
            
            infoHtml += `
                    </div>
                </div>
                <hr>
                <div id="selectedOrderSummary"></div>
            `;
            
            $('#orderDetails').html(infoHtml);
            
            // Add event listener for order selection change
            $('.order-selector').on('change', function() {
                var newSelectedOrderId = $(this).val();
                selectedOrderFromDropdown = newSelectedOrderId;
                $('#order_id').val(newSelectedOrderId);
                
                // Update the form with the newly selected order's data
                loadSelectedOrderData(newSelectedOrderId);
                
                // Update the modal title
                var selectedOrder = currentGroupedOrders.find(order => order.id == newSelectedOrderId);
                if (selectedOrder) {
                    $('#updateStatusModalLabel').text(`Update Order Status - ${selectedOrder.color_name}`);
                }
            });
            
            // Load initial selection summary
            loadSelectedOrderData(selectedOrderId);
        }

        function loadSelectedOrderData(orderId) {
            var selectedOrder = null;
            
            if (currentGroupedOrders.length > 1) {
                selectedOrder = currentGroupedOrders.find(order => order.id == orderId);
            } else {
                selectedOrder = currentOrderDetails;
            }
            
            if (selectedOrder) {
                // Update form fields with selected order's data
                $('#status_id').val(selectedOrder.status_id || currentOrderDetails.status_id);
                $('#quantity_delivered').val(selectedOrder.quantity_delivered);
                $('#est_delivery_date').val(currentOrderDetails.est_delivery_date);
                $('#delivered').prop('checked', selectedOrder.delivered);
                
                // Update selected order summary
                var summaryHtml = `
                    <div class="alert alert-info">
                        <strong>Currently Updating:</strong><br>
                        <strong>Color:</strong> ${selectedOrder.color_name}<br>
                        <strong>Quantity:</strong> ${selectedOrder.quantity}<br>
                        <strong>Delivered:</strong> ${selectedOrder.quantity_delivered || 0}<br>
                        <strong>Current Status:</strong> ${selectedOrder.status_name}
                    </div>
                `;
                $('#selectedOrderSummary').html(summaryHtml);
            }
        }

        function displaySingleOrderInfo(orderData) {
            var infoHtml = `
                <strong>Model:</strong> ${orderData.model_no}<br>
                <strong>Client:</strong> ${orderData.client_name}<br>
                <strong>Color:</strong> ${orderData.color_name}<br>
                <strong>Quantity:</strong> ${orderData.quantity}<br>
                <strong>Delivered:</strong> ${orderData.quantity_delivered || 0}<br>
                <strong>Status:</strong> ${orderData.status_name}
            `;
            $('#orderDetails').html(infoHtml);
        }

        $(document).on('change', 'input[name="updateMode"]', function() {
            var selectedMode = $('input[name="updateMode"]:checked').val();
            
            if (selectedMode === 'all') {
                // Show bulk update configuration
                $('#bulkUpdateConfiguration').show();
                
                // Show warning for bulk update
                if (!$('#bulkUpdateWarning').length) {
                    $('#groupedOrderOptions').append(`
                        <div id="bulkUpdateWarning" class="alert alert-warning mt-2">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Warning:</strong> This will update the selected fields for all ${currentGroupedOrders.length} color variants.
                        </div>
                    `);
                }
                
                // Update the form labels to indicate bulk update
                updateFormLabelsForBulkMode(true);
                
            } else {
                // Hide bulk update configuration
                $('#bulkUpdateConfiguration').hide();
                $('#bulkUpdateWarning').remove();
                
                // Reset form labels to single update mode
                updateFormLabelsForBulkMode(false);
            }
        });

        function updateFormLabelsForBulkMode(isBulkMode) {
            if (isBulkMode) {
                $('label[for="status_id"]').html('Status <small class="text-muted">(Will apply to all selected variants)</small>');
                $('label[for="quantity_delivered"]').html('Quantity Delivered <small class="text-muted">(Will apply to all if checked above)</small>');
                $('label[for="est_delivery_date"]').html('Estimated Delivery Date <small class="text-muted">(Will apply to all if checked above)</small>');
                $('label[for="delivered"]').html('Mark as Delivered <small class="text-muted">(Will apply to all if checked above)</small>');
            } else {
                $('label[for="status_id"]').text('Status');
                $('label[for="quantity_delivered"]').text('Quantity Delivered');
                $('label[for="est_delivery_date"]').text('Estimated Delivery Date');
                $('label[for="delivered"]').text('Mark as Delivered');
            }
        }
        
        // Function to load statuses for dropdown
        function loadStatuses(selectedStatusId) {
            $.ajax({
                url: '/api/model-statuses/',
                type: 'GET',
                success: function(response) {
                    var dropdown = $('#status_id');
                    dropdown.empty();
                    
                    $.each(response.data, function(i, status) {
                        dropdown.append($('<option></option>')
                            .attr('value', status.id)
                            .text(status.name));
                    });
                    
                    if (selectedStatusId) {
                        dropdown.val(selectedStatusId);
                    }
                },
                error: function(xhr) {
                    console.error('Error loading statuses', xhr);
                }
            });
        }
        
        // Handle save button click
        $('#saveStatusBtn').click(function() {
            var updateMode = $('input[name="updateMode"]:checked').val();
            var isGroupedUpdate = currentGroupedOrders.length > 1 && updateMode === 'all';
            
            // Prepare form data
            var formData = {
                status_id: $('#status_id').val(),
                quantity_delivered: $('#quantity_delivered').val(),
                est_delivery_date: $('#est_delivery_date').val(),
                delivered: $('#delivered').is(':checked'),
                update_mode: updateMode
            };
            
            if (isGroupedUpdate) {
                // Add bulk update configuration
                formData.bulk_update_options = {
                    apply_status: $('#applyStatusToAll').is(':checked'),
                    apply_delivery_date: $('#applyDeliveryDateToAll').is(':checked'),
                    apply_delivered_flag: $('#applyDeliveredFlagToAll').is(':checked'),
                    apply_quantity: $('#applyQuantityToAll').is(':checked')
                };
                
                // Validate that at least one option is selected
                var hasSelectedOption = Object.values(formData.bulk_update_options).some(option => option === true);
                if (!hasSelectedOption) {
                    alert('Please select at least one option to apply to all variants.');
                    return;
                }
                
                // Bulk update for all grouped orders
                formData.order_ids = currentGroupedOrders.map(order => order.id);
                
                // Build confirmation message based on selected options
                var selectedOptions = [];
                if (formData.bulk_update_options.apply_status) selectedOptions.push('Status');
                if (formData.bulk_update_options.apply_delivery_date) selectedOptions.push('Delivery Date');
                if (formData.bulk_update_options.apply_delivered_flag) selectedOptions.push('Delivered Flag');
                if (formData.bulk_update_options.apply_quantity) selectedOptions.push('Delivered Quantity');
                
                var confirmMessage = `Are you sure you want to update the following fields for all ${currentGroupedOrders.length} color variants?\n\n`;
                confirmMessage += `Fields to update: ${selectedOptions.join(', ')}\n\n`;
                confirmMessage += `This action cannot be undone.`;
                
                if (!confirm(confirmMessage)) {
                    return;
                }
                
                // Use bulk update endpoint
                $.ajax({
                    url: '/api/update-repeated-order-status-bulk/',
                    type: 'POST',
                    data: JSON.stringify(formData),
                    contentType: 'application/json',
                    headers: {
                        'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val()
                    },
                    success: function(response) {
                        $('#updateStatusModal').modal('hide');
                        table.ajax.reload();
                        
                        var updatedFields = selectedOptions.join(', ');
                        alert(`Successfully updated ${updatedFields} for ${response.updated_orders.length} orders`);
                    },
                    error: function(xhr) {
                        console.error('Error updating status', xhr);
                        handleAjaxError(xhr, 'Error updating status');
                    }
                });
            } else {
                // Single order update - use the currently selected order ID
                formData.order_id = selectedOrderFromDropdown || $('#order_id').val();
                
                // Show which order is being updated
                var selectedOrder = currentGroupedOrders.find(order => order.id == selectedOrderFromDropdown) || currentOrderDetails;
                var confirmMessage = `Update status for ${selectedOrder.color_name || 'this order'}?`;
                
                if (!confirm(confirmMessage)) {
                    return;
                }
                
                $.ajax({
                    url: '/api/update-repeated-order-status/',
                    type: 'POST',
                    data: JSON.stringify(formData),
                    contentType: 'application/json',
                    headers: {
                        'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val()
                    },
                    success: function(response) {
                        $('#updateStatusModal').modal('hide');
                        table.ajax.reload();
                        alert(`Status updated successfully for ${selectedOrder.color_name || 'the order'}`);
                    },
                    error: function(xhr) {
                        console.error('Error updating status', xhr);
                        handleAjaxError(xhr, 'Error updating status');
                    }
                });
            }
        });

        // Helper function for error handling
        function handleAjaxError(xhr, defaultMessage) {
            var errorMessage = defaultMessage;
            try {
                var errorResponse = JSON.parse(xhr.responseText);
                errorMessage += ': ' + errorResponse.message;
            } catch(e) {
                errorMessage += ': ' + xhr.statusText;
            }
            alert(errorMessage);
        }

        // Updated modal cleanup
        $('#updateStatusModal').on('hidden.bs.modal', function () {
            currentGroupedOrders = [];
            selectedOrderFromDropdown = null;
            currentOrderDetails = null;
            $('#groupedOrderOptions').hide();
            $('#bulkUpdateConfiguration').hide(); // Add this line
            $('#bulkUpdateWarning').remove();
            $('#updateSingle').prop('checked', true);
            $('#orderDetails').empty();
            $('#selectedOrderSummary').empty();
            
            // Reset bulk update checkboxes
            $('#applyStatusToAll').prop('checked', true);
            $('#applyDeliveryDateToAll').prop('checked', false);
            $('#applyDeliveredFlagToAll').prop('checked', false);
            $('#applyQuantityToAll').prop('checked', false);
            
            // Reset form labels
            updateFormLabelsForBulkMode(false);
        });
    } catch(error) {
        console.error('Error initializing DataTable:', error);
    }
});