$(document).ready(function() {
    var csrftoken = $('[name=csrfmiddlewaretoken]').val();
    
    // Initialize DataTable
    var table = $('#usersTable').DataTable({
        ajax: {
            url: '/orders/json/',
            dataSrc: function(json) {
                // Process the data to calculate status distributions for tooltips
                let modelStatusCounts = {};
                let deliveryStatusCounts = {};
                let quantityCounts = {};
                
                // Count occurrences of each status across all groups
                json.data.forEach(function(group) {
                    if (group.orders && group.orders.length > 0) {
                        group.orders.forEach(function(order) {
                            // Model Status counts
                            let status = order.status || 'N/A';
                            modelStatusCounts[status] = (modelStatusCounts[status] || 0) + 1;

                            // Delivery Status counts
                            let deliveryStatus = order.delivered === 'Yes' ? 'Delivered' : 'Not Delivered';
                            deliveryStatusCounts[deliveryStatus] = (deliveryStatusCounts[deliveryStatus] || 0) + 1;

                            // Quantity counts
                            let qty = order.quantity;
                            quantityCounts[qty] = (quantityCounts[qty] || 0) + 1;
                        });
                    }
                });
                
                // Now calculate group-specific distributions
                json.data.forEach(function(group) {
                    // For each group, create distribution data specific to this group
                    let groupModelStatusCounts = {};
                    let groupDeliveryStatusCounts = {};
                    let groupQuantityCounts = {};
                    
                    if (group.orders && group.orders.length > 0) {
                        group.orders.forEach(function(order) {
                            // Group-specific Model Status counts
                            let status = order.status || 'N/A';
                            groupModelStatusCounts[status] = (groupModelStatusCounts[status] || 0) + 1;

                            // Group-specific Delivery Status counts
                            let deliveryStatus = order.delivered === 'Yes' ? 'Delivered' : 'Not Delivered';
                            groupDeliveryStatusCounts[deliveryStatus] = (groupDeliveryStatusCounts[deliveryStatus] || 0) + 1;

                            // Group-specific Quantity counts
                            let qty = order.quantity;
                            groupQuantityCounts[qty] = (groupQuantityCounts[qty] || 0) + 1;
                        });
                    }
                    
                    // Store both group-specific and global distributions
                    group._modelStatusDistribution = {
                        group: groupModelStatusCounts,
                        global: modelStatusCounts
                    };
                    
                    group._deliveryStatusDistribution = {
                        group: groupDeliveryStatusCounts,
                        global: deliveryStatusCounts
                    };
                    
                    group._quantityDistribution = {
                        group: groupQuantityCounts,
                        global: quantityCounts
                    };
                });
                
                return json.data;
            }
        },
        columns: [
            { data: 'sl_no' },
            { data: 'client' },
            {
                data: null,
                render: function(data, type, row) {
                    if (type !== 'display') return row.model_no || '';
                    var html = '<div class="d-flex align-items-center model-info">';
                    if (row.model_image) {
                        html += '<div class="model-thumbnail me-2">' +
                            '<img src="' + row.model_image + '" class="rounded-circle model-thumbnail-img" ' +
                            'width="40" height="40" alt="Model ' + row.model_no + '" ' +
                            'data-bs-toggle="modal" data-bs-target="#modelImageModal" ' +
                            'data-model-no="' + row.model_no + '" ' +
                            'data-img-src="' + row.model_image + '">' +
                            '</div>';
                    }
                    html += '<span>' + (row.model_no || 'N/A') + '</span></div>';
                    return html;
                }
            },
            { 
                // Model Status column
                data: null,
                render: function(data, type, row) {
                    if (type !== 'display') return '';
                    
                    // For grouped orders, we'll show aggregated status info
                    if (row.orders && row.orders.length > 0) {
                        // Count statuses to find the predominant one
                        let statusCounts = {};
                        let maxCount = 0;
                        let predominantStatus = 'N/A';
                        
                        row.orders.forEach(function(order) {
                            let status = order.status || 'N/A';
                            statusCounts[status] = (statusCounts[status] || 0) + 1;
                            
                            if (statusCounts[status] > maxCount) {
                                maxCount = statusCounts[status];
                                predominantStatus = status;
                            }
                        });
                        
                        // Set badge color based on status text
                        let badgeClass = 'bg-secondary';
                        if (predominantStatus.toLowerCase().includes('completed')) badgeClass = 'bg-success';
                        if (predominantStatus.toLowerCase().includes('pending')) badgeClass = 'bg-warning';
                        if (predominantStatus.toLowerCase().includes('processing') || 
                            predominantStatus.toLowerCase().includes('setting')) badgeClass = 'bg-info';
                        if (predominantStatus.toLowerCase().includes('cancelled') || 
                            predominantStatus.toLowerCase().includes('canceled')) badgeClass = 'bg-danger';
                        
                        // Create tooltip content with group-specific distribution
                        let tooltipContent = '<div>Status Distribution:</div>';
                        
                        // Add group-specific status counts to tooltip
                        if (row._modelStatusDistribution && row._modelStatusDistribution.group) {
                            for (const [status, count] of Object.entries(row._modelStatusDistribution.group)) {
                                let statusLabel = status || 'N/A';
                                tooltipContent += `<div>${statusLabel}: ${count}</div>`;
                            }
                        }
                        
                        // Show multi-order indicator if there's more than one order
                        let multiOrderIndicator = '';
                        if (row.orders.length > 1) {
                            multiOrderIndicator = `<small class="ms-1">(${row.orders.length})</small>`;
                        }
                        
                        return `<span class="badge ${badgeClass}" 
                                  data-bs-toggle="tooltip" 
                                  data-bs-html="true" 
                                  title="${tooltipContent}">${predominantStatus}${multiOrderIndicator}</span>`;
                    }
                    
                    // If we get here, it's a single order (should not happen with your grouping)
                    let statusText = row.orders.status || 'N/A';
                    let badgeClass = 'bg-secondary';
                    
                    // Set badge color based on status text
                    if (statusText.toLowerCase().includes('completed')) badgeClass = 'bg-success';
                    if (statusText.toLowerCase().includes('pending')) badgeClass = 'bg-warning';
                    if (statusText.toLowerCase().includes('processing') || 
                        statusText.toLowerCase().includes('setting')) badgeClass = 'bg-info';
                    if (statusText.toLowerCase().includes('cancelled') || 
                        statusText.toLowerCase().includes('canceled')) badgeClass = 'bg-danger';
                    
                    return `<span class="badge ${badgeClass}">${statusText}</span>`;
                }
            },
            { 
                // Delivery Status column
                data: null,
                render: function(data, type, row) {
                    if (type !== 'display') return '';
                    
                    // For grouped orders
                    if (row.orders && row.orders.length > 0) {
                        // Calculate delivery ratio
                        let totalOrders = row.orders.length;
                        let deliveredOrders = row.delivered_count || 0;
                        let deliveryRatio = deliveredOrders / totalOrders;
                        
                        // Determine badge class based on delivery ratio
                        let badgeClass = 'bg-warning'; // Default: Not delivered
                        let statusText = 'Not Delivered';
                        
                        if (deliveryRatio === 1) {
                            badgeClass = 'bg-success';
                            statusText = 'All Delivered';
                        } else if (deliveryRatio > 0) {
                            badgeClass = 'bg-info';
                            statusText = `Partially Delivered (${deliveredOrders}/${totalOrders})`;
                        }
                        
                        // Create tooltip content with group-specific distribution
                        let tooltipContent = '<div>Delivery Status Distribution:</div>';
                        
                        // Add group-specific delivery status counts to tooltip
                        if (row._deliveryStatusDistribution && row._deliveryStatusDistribution.group) {
                            for (const [status, count] of Object.entries(row._deliveryStatusDistribution.group)) {
                                tooltipContent += `<div>${status}: ${count}</div>`;
                            }
                        }
                        
                        return `<span class="badge ${badgeClass}" 
                                  data-bs-toggle="tooltip" 
                                  data-bs-html="true" 
                                  title="${tooltipContent}">${statusText}</span>`;
                    }
                    
                    // Single order case (shouldn't happen with grouping)
                    let isDelivered = (row.orders.delivered === 'Yes');
                    let badgeClass = isDelivered ? 'bg-success' : 'bg-warning';
                    let statusText = isDelivered ? 'Delivered' : 'Not Delivered';
                    
                    return `<span class="badge ${badgeClass}">${statusText}</span>`;
                }
            },
            { 
                // Quantity column
                data: 'quantity',
                render: function(data, type, row) {
                    if (!data && data !== 0) return 'N/A';
                    
                    // Create tooltip content with quantity distribution
                    let tooltipContent = '<div>Quantity Distribution:</div>';
                    
                    if (row._quantityDistribution && row._quantityDistribution.group) {
                        // Sort quantities for better readability
                        let sortedQuantities = Object.keys(row._quantityDistribution.group).sort((a, b) => Number(a) - Number(b));
                        
                        for (const quantity of sortedQuantities) {
                            tooltipContent += `<div>${quantity}: ${row._quantityDistribution.group[quantity]}</div>`;
                        }
                    }
                    
                    return `<span data-bs-toggle="tooltip" 
                                 data-bs-html="true" 
                                 title="${tooltipContent}">${data}</span>`;
                }
            },
            { 
                // Repeated Order column
                data: 'repeated_order',
                render: function(data, type, row) {
                    if (type !== 'display') return data || 0;
                    
                    // Create tooltip content for repeat orders
                    let tooltipContent = '<div>Repeat Orders:</div>';
                    let inProgress = row.in_progress || 0;
                    
                    tooltipContent += `<div>Total Repeats: ${data}</div>`;
                    tooltipContent += `<div>In Progress: ${inProgress}</div>`;
                    
                    // Add badge styling based on repeat count
                    let badgeClass = 'bg-secondary';
                    if (data > 0) badgeClass = 'bg-info';
                    
                    return `<span class="badge ${badgeClass}" 
                              data-bs-toggle="tooltip" 
                              data-bs-html="true" 
                              title="${tooltipContent}">${data}</span>`;
                }
            },
            { data: 'weight' },
            { 
                data: null,
                render: function(data, type, row) {
                    if (type !== 'display') return '';
                    
                    // For grouped orders, show the earliest delivery date
                    if (row.orders && row.orders.length > 0) {
                        let dates = row.orders.map(order => order.delivery_date).filter(date => date);
                        
                        if (dates.length === 0) return 'N/A';
                        
                        // Sort dates and get the earliest
                        dates.sort();
                        let earliestDate = dates[0];
                        
                        // Create tooltip with all delivery dates
                        let tooltipContent = '<div>Delivery Dates:</div>';
                        dates.forEach(date => {
                            tooltipContent += `<div>${date}</div>`;
                        });
                        
                        return `<span data-bs-toggle="tooltip" 
                                     data-bs-html="true" 
                                     title="${tooltipContent}">${earliestDate}</span>`;
                    }
                    
                    return 'N/A';
                }
            },
            {
                data: null,
                render: function(data, type, row, meta) {
                    if (type !== 'display') return '';
                    
                    // For grouped orders, create a dropdown with all orders in the group
                    if (row.orders && row.orders.length > 0) {
                        let html = `
                            <div class="action-menu">
                                <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                    <li class="dropdown-header">Select Order</li>
                        `;
                        
                        // Add all orders in the group
                        row.orders.forEach(order => {
                            html += `
                                <li class="dropdown-item order-item">
                                    <div class="d-flex justify-content-between w-100">
                                        <span>Order #${order.order_id}</span>
                                        <span class="ms-2">${order.status || 'N/A'}</span>
                                    </div>
                                    <div class="btn-group mt-1 w-100">
                                        <button class="btn btn-sm btn-outline-primary update-order" data-id="${order.order_id}">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-warning change-status" data-id="${order.order_id}" 
                                            data-delivery-date="${order.delivery_date || ''}" data-delivered="${order.delivered === 'Yes'}"
                                            data-status-id="${order.status_id || ''}">
                                            <i class="fa-solid fa-toggle-on"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success repeat-order" data-id="${order.order_id}">
                                            <i class="fa-solid fa-rotate"></i>
                                        </button>
                                    </div>
                                </li>
                                <li><hr class="dropdown-divider"></li>
                            `;
                        });
                        
                        // Add a group action option
                        html += `
                                <li class="dropdown-header">Group Actions</li>
                                <li>
                                    <button class="dropdown-item d-flex align-items-center create-similar-order" 
                                        data-client-id="${row.client_id || ''}" 
                                        data-model-no="${row.model_no || ''}">
                                        <i class="fa-solid fa-plus me-2 text-primary"></i>
                                        <span>Create Similar Order</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                        `;
                        
                        return html;
                    }
                    
                    // Single order actions (shouldn't happen with grouping)
                    return `
                        <div class="action-menu">
                            <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li>
                                    <button class="dropdown-item d-flex align-items-center update-order" data-id="${row.order_id || ''}">
                                        <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>
                                        <span>Update</span>
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item d-flex align-items-center change-status" 
                                        data-id="${row.order_id || ''}" 
                                        data-delivery-date="${row.delivery_date || ''}" 
                                        data-delivered="${row.delivered === 'Yes'}"
                                        data-status-id="${row.status_id || ''}">
                                        <i class="fa-solid fa-toggle-on me-2 text-warning"></i>
                                        <span>Change Status</span>
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item d-flex align-items-center repeat-order" data-id="${row.order_id || ''}">
                                        <i class="fa-solid fa-rotate me-2 text-success"></i>
                                        <span>Repeat Order</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    `;
                }
            }
        ],
        responsive: true,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],
        order: [[0, 'asc']], // Default sorting by sl_no
        drawCallback: function() {
            // Initialize tooltips with custom options
            $('[data-bs-toggle="tooltip"]').tooltip({
                html: true,
                container: 'body',
                placement: 'top',
                trigger: 'hover',
                template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner custom-tooltip-inner"></div></div>'
            });
        }
    });

    // Add event handlers for the new group-based actions
    $(document).on('click', '.create-similar-order', function() {
        const clientId = $(this).data('client-id');
        const modelNo = $(this).data('model-no');
        
        // You can implement a modal or redirect to create a new order with pre-filled data
        alert(`Create new order for client ID: ${clientId} with model: ${modelNo}`);
        // Or redirect to: window.location.href = `/orders/create/?client=${clientId}&model=${modelNo}`;
    });

    // Initialize Bootstrap Tooltips with custom styling
    $(document).ready(function() {
        // Add custom CSS for tooltips
        $('<style>')
            .prop('type', 'text/css')
            .html(`
                .custom-tooltip-inner {
                    min-width: 180px;
                    max-width: 300px;
                    padding: 10px;
                    color: #fff;
                    text-align: left;
                    background-color: #333;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .tooltip-inner div {
                    margin-bottom: 6px;
                    display: flex;
                    justify-content: space-between;
                }
                .tooltip-inner div:first-child {
                    font-weight: bold;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                    padding-bottom: 3px;
                    margin-bottom: 6px;
                }
            `)
            .appendTo('head');
    });

    // Initialize zoom level
    let zoomLevel = 1;
    const zoomStep = 0.1;
    const minZoom = 0.5;
    const maxZoom = 3;
    
    // Get elements
    const img = document.getElementById('modelFullImage');
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const resetZoom = document.getElementById('resetZoom');
    
    // Zoom in function
    if (zoomIn) {
        zoomIn.addEventListener('click', function() {
            if (zoomLevel < maxZoom) {
                zoomLevel += zoomStep;
                applyZoom();
            }
        });
    }
    
    // Zoom out function
    if (zoomOut) {
        zoomOut.addEventListener('click', function() {
            if (zoomLevel > minZoom) {
                zoomLevel -= zoomStep;
                applyZoom();
            }
        });
    }
    
    // Reset zoom function
    if (resetZoom) {
        resetZoom.addEventListener('click', function() {
            zoomLevel = 1;
            applyZoom();
        });
    }
    
    // Apply zoom level to image
    function applyZoom() {
        if (img) {
            img.style.transform = `scale(${zoomLevel})`;
        }
    }
    
    // Handle showing the model number when modal opens
    const modelImageModal = document.getElementById('modelImageModal');
    if (modelImageModal) {
        modelImageModal.addEventListener('show.bs.modal', function(event) {
            // Get the button that triggered the modal
            const button = event.relatedTarget;
            if (button) {
                // Extract model number from data attribute
                const modelNo = button.getAttribute('data-model-no');
                const imgSrc = button.getAttribute('data-img-src');
                
                // Update the modal content
                const modelNoDisplay = document.getElementById('modelNoDisplay');
                if (modelNoDisplay) {
                    modelNoDisplay.textContent = modelNo || '';
                }
                
                if (img && imgSrc) {
                    img.src = imgSrc;
                }
                
                // Reset zoom when opening modal
                zoomLevel = 1;
                applyZoom();
            }
        });
    }

    // Tab filter handlers
    $('#ordersFilterTabs button').on('click', function() {
        let filter = $(this).data('filter');
        // Use DataTables API to filter or reload with filter param
        let table = $('#usersTable').DataTable();
        
        if (filter === 'all') {
            table.ajax.url('/orders/json/').load();
        } else if (filter === 'delivered') {
            table.ajax.url('/orders/json/?status=delivered').load();
        } else if (filter === 'not-delivered') {
            table.ajax.url('/orders/json/?status=not-delivered').load();
        }
        
        $('#ordersFilterTabs button').removeClass('active');
        $(this).addClass('active');
    });

    // Initialize today's date for delivery date inputs
    var today = new Date().toISOString().split('T')[0];
    $('#estDeliveryDate, #repeatEstDeliveryDate, #updateEstDeliveryDate').attr('min', today);
    $('#repeatEstDeliveryDate').val(today);

    // Model thumbnail click handler - Show image modal
    $('#usersTable').on('click', '.model-thumbnail-img', function(e) {
        e.stopPropagation();
        
        var modelNo = $(this).data('model-no');
        var modelImage = $(this).data('img-src');
        
        $('#modelNoDisplay').text(modelNo);
        $('#modelFullImage').attr('src', modelImage);
        var modal = new bootstrap.Modal(document.getElementById('modelImageModal'));
        modal.show();
    });

    // ACTIONS: Update Order, Change Status, Repeat Order
    
    // 1. UPDATE ORDER
    // Update Order click handler
    $('#usersTable').on('click', '.update-order', function() {
        const orderId = $(this).data('id');
        
        // Get current order details via AJAX
        $.ajax({
            url: '/orders/get_order/' + orderId + '/',
            type: 'GET',
            success: function(response) {
                // Populate the modal with current values
                $('#updateOrderId').val(orderId);
                $('#updateEstDeliveryDate').val(response.est_delivery_date);
                $('#updateQuantity').val(response.quantity);
                
                // Show the modal
                var modal = new bootstrap.Modal(document.getElementById('updateOrderModal'));
                modal.show();
            },
            error: function(error) {
                toastr.error('Error retrieving order details');
            }
        });
    });
    
    // Save Order Updates button click handler
    $('#saveOrderUpdates').on('click', function() {
        const orderId = $('#updateOrderId').val();
        const estDeliveryDate = $('#updateEstDeliveryDate').val();
        const quantity = $('#updateQuantity').val();
        
        // Form validation
        if (!estDeliveryDate || !quantity) {
            toastr.error('Please fill all required fields');
            return;
        }
        
        // Perform AJAX request to update order
        $.ajax({
            url: '/orders/update_order/',
            type: 'POST',
            data: JSON.stringify({
                order_id: orderId,
                est_delivery_date: estDeliveryDate,
                quantity: quantity
            }),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': csrftoken
            },
            success: function(response) {
                // Close modal and refresh table
                $('#updateOrderModal').modal('hide');
                table.ajax.reload();
                
                // Show success message
                toastr.success('Order updated successfully');
            },
            error: function(error) {
                toastr.error('Error updating order');
            }
        });
    });

    // 2. CHANGE STATUS
    // Change Status click handler
    $('#usersTable').on('click', '.change-status', function() {
        const orderId = $(this).data('id');
        const deliveryDate = $(this).data('delivery-date');
        const isDelivered = $(this).data('delivered');
        const statusId = $(this).data('status-id');
        
        // Populate the modal with current values
        $('#statusOrderId').val(orderId);
        $('#estDeliveryDate').val(deliveryDate);
        
        // Pre-select the current status in the dropdown
        if (statusId) {
            $('#orderDeliveryStatus').val(statusId);
        }
        
        // Show the modal
        var modal = new bootstrap.Modal(document.getElementById('changeStatusModal'));
        modal.show();
    });

    // Save Status Changes button click handler
    $('#saveStatusChanges').on('click', function() {
        const orderId = $('#statusOrderId').val();
        const statusId = $('#orderDeliveryStatus').val();
        const estDeliveryDate = $('#estDeliveryDate').val();
        
        // Perform AJAX request to update status
        $.ajax({
            url: '/orders/update_status/',
            type: 'POST',
            data: JSON.stringify({
                order_id: orderId,
                status_id: statusId,
                est_delivery_date: estDeliveryDate
            }),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': csrftoken
            },
            success: function(response) {
                // Close modal and refresh table
                $('#changeStatusModal').modal('hide');
                table.ajax.reload();
                
                // Show success message
                toastr.success('Order status updated successfully');
            },
            error: function(error) {
                toastr.error('Error updating order status');
            }
        });
    });

    // 3. REPEAT ORDER
    // Repeat Order click handler
    $('#usersTable').on('click', '.repeat-order', function() {
        const orderId = $(this).data('id');
        
        // Set default values
        $('#repeatOrderId').val(orderId);
        $('#repeatQuantity').val(1);
        
        // Today + 7 days as default delivery date
        var defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        $('#repeatEstDeliveryDate').val(defaultDate.toISOString().split('T')[0]);
        
        // Show the modal
        var modal = new bootstrap.Modal(document.getElementById('repeatOrderModal'));
        modal.show();
    });

    // Create Repeat Order button click handler
    $('#createRepeatOrder').on('click', function() {
        const orderId = $('#repeatOrderId').val();
        const quantity = $('#repeatQuantity').val();
        const estDeliveryDate = $('#repeatEstDeliveryDate').val();
        
        // Form validation
        if (!quantity || !estDeliveryDate) {
            toastr.error('Please fill all required fields');
            return;
        }
        
        // Perform AJAX request to create repeat order
        $.ajax({
            url: '/orders/create_repeat_order/',
            type: 'POST',
            data: JSON.stringify({
                order_id: orderId,
                quantity: quantity,
                est_delivery_date: estDeliveryDate
            }),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': csrftoken
            },
            success: function(response) {
                // Close modal and refresh table
                $('#repeatOrderModal').modal('hide');
                table.ajax.reload();
                
                // Show success message
                toastr.success('Repeat order created successfully');
            },
            error: function(error) {
                toastr.error('Error creating repeat order');
            }
        });
    });

    // New Order button click handler
    $("#new_order").on("click", function(event) {
        event.preventDefault();
        window.location.href = "/add_order";
    });

    // Add to Repeat Orders button click handler
    $("#add_to_repeat_orders").on("click", function(event) {
        // This would typically handle batch operations on selected orders
        toastr.info('This feature is coming soon');
    });
});