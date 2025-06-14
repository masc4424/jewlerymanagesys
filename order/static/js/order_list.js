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
                            'data-img-src="' + row.model_image + '" ' +
                            'data-bs-toggle="tooltip" title="Click to view" ' +
                            'data-bs-placement="top">' +
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
                    
                    // If there are no orders in the group, return N/A with a neutral badge
                    return '<span class="badge bg-secondary">N/A</span>';
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
                    
                    // If there are no orders in the group, return N/A with a neutral badge
                    return '<span class="badge bg-secondary">N/A</span>';
                }
            },
            { 
                // Quantity column
                data: 'quantity',
                render: function(data, type, row) {
                    if (!data && data !== 0) return 'N/A';
                    
                    // Create tooltip content with quantity distribution
                    let tooltipContent = '<div>Quantity Distribution:</div>';
                    
                    // Create a map of colors to quantities
                    let colorQuantityMap = {};
                    
                    // Populate the map with color-quantity data from orders
                    if (row.orders && row.orders.length > 0) {
                        row.orders.forEach(function(order) {
                            let qty = order.quantity;
                            let color = order.color || 'N/A';
                            
                            if (!colorQuantityMap[color]) {
                                colorQuantityMap[color] = 0;
                            }
                            
                            // Sum quantities by color
                            colorQuantityMap[color] += qty;
                        });
                        
                        // Add color and quantities to tooltip
                        for (const [color, quantity] of Object.entries(colorQuantityMap)) {
                            tooltipContent += `<div>${color}: ${quantity}</div>`;
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
                    
                    tooltipContent += `<div>Total Repeats: ${data || 0}</div>`;
                    tooltipContent += `<div>In Progress: ${inProgress}</div>`;
                    
                    // Badge removed, just showing the number with tooltip
                    return `<span data-bs-toggle="tooltip" 
                                data-bs-html="true" 
                                title="${tooltipContent}">${data || 0}</span>`;
                }
            },
            { 
                data: 'weight',
                render: function(data, type, row) {
                    return data || 'N/A';
                }
            },
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
                    
                    // For grouped orders, create a simplified dropdown with consolidated actions
                    if (row.orders && row.orders.length > 0) {
                        let html = `
                            <div class="action-menu">
                                <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                    <li class="dropdown-header">Group Actions</li>
                                    <li>
                                        <a class="dropdown-item update-group-order" href="#" data-group-id="${row.sl_no}">
                                            <i class="fa-solid fa-pen-to-square me-2"></i>Update Order
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item change-group-status" href="#" data-group-id="${row.sl_no}" data-model_id ="${row.model_id}">
                                            <i class="fa-solid fa-toggle-on me-2"></i>Change Status
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item repeat-group-order" href="#" data-group-id="${row.sl_no}">
                                            <i class="fa-solid fa-rotate me-2"></i>Repeat Order
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item delete-group-order text-danger" href="#" data-group-id="${row.sl_no}">
                                            <i class="fa-solid fa-trash-can me-2"></i>Delete Order
                                        </a>
                                    </li>
                                `;
                                
                                html += `
                                            </div>
                                        </div>
                                    </li>
                                `;
                        
                        html += `
                                </ul>
                            </div>
                        `;
                        
                        return html;
                    }
                    
                    // For rows without orders, provide a minimal action menu
                    return `
                        <div class="action-menu">
                            <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li class="dropdown-header">No Orders Available</li>
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

    // Add these event handlers after the existing event handlers in your JavaScript file

    // 1. UPDATE GROUP ORDER
    // Event handler for updating a group of orders
    $(document).on('click', '.update-group-order', function(e) {
        e.preventDefault();
        
        const groupId = $(this).data('group-id');
        
        // Get the corresponding row data from DataTable
        const table = $('#usersTable').DataTable();
        const rowData = table.row(function(idx, data) {
            return data.sl_no === groupId;
        }).data();
        
        if (!rowData || !rowData.orders || rowData.orders.length === 0) {
            toastr.error('No orders found in this group');
            return;
        }
        
        // Create a modal to update orders by color
        let modalContent = `
            <div class="modal fade" id="updateGroupOrderModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Update Orders - Model: ${rowData.model_no}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="updateGroupOrderForm">
                                <div class="mb-3">
                                    <label class="form-label">Common Delivery Date</label>
                                    <input type="date" class="form-control" id="groupDeliveryDate">
                                    <div class="form-text">Leave blank to update individual orders separately</div>
                                </div>
                                
                                <h6 class="mt-4">Update Orders by Color</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Color</th>
                                                <th>Current Qty</th>
                                                <th>New Qty</th>
                                                <th>Delivered Qty</th>
                                                <th>Delivery Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
            `;
            
            // Group orders by color for more logical presentation
            const ordersByColor = {};
            
            rowData.orders.forEach(order => {
                const color = order.color || 'N/A';
                if (!ordersByColor[color]) {
                    ordersByColor[color] = [];
                }
                ordersByColor[color].push(order);
            });
            
            // Add a row for each color group
            Object.entries(ordersByColor).forEach(([color, orders]) => {
                orders.forEach((order, index) => {
                    // Check if quantity_delivered exists in the data structure, otherwise use default
                    // If the order.delivered is "Yes", we might assume full delivery
                    let deliveredQty = 0;
                    
                    if (order.quantity_delivered !== undefined) {
                        // If we have a specific quantity_delivered field
                        deliveredQty = order.quantity_delivered;
                    } else if (order.delivered === 'Yes') {
                        // If delivered is "Yes" but no quantity specified, assume all items delivered
                        deliveredQty = order.quantity;
                    }
                    
                    console.log(`Order ${order.order_id} - Status: ${order.delivered}, Delivered Qty: ${deliveredQty}`, order);
                    
                    modalContent += `
                        <tr>
                            <td>${order.order_id}</td>
                            <td>${color}</td>
                            <td>${order.quantity}</td>
                            <td>
                                <input type="number" class="form-control form-control-sm order-quantity" 
                                    data-order-id="${order.order_id}" value="${order.quantity}" min="1">
                            </td>
                            <td>
                                <input type="number" class="form-control form-control-sm order-quantity-delivered" 
                                    data-order-id="${order.order_id}" value="${deliveredQty}" min="0">
                            </td>
                            <td>
                                <input type="date" class="form-control form-control-sm order-delivery-date" 
                                    data-order-id="${order.order_id}" value="${order.delivery_date || ''}">
                            </td>
                        </tr>
                    `;
                });
            });
            
            modalContent += `
                                        </tbody>
                                    </table>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveGroupOrderUpdates">Save All Changes</button>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            // Remove any existing modals with the same ID and append the new one
            $('#updateGroupOrderModal').remove();
            $('body').append(modalContent);
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('updateGroupOrderModal'));
            modal.show();
            
            // Handle applying common delivery date to all orders
            $('#groupDeliveryDate').on('change', function() {
                const commonDate = $(this).val();
                if (commonDate) {
                    $('.order-delivery-date').val(commonDate);
                }
            });
            
            // Handle saving all updates
            $('#saveGroupOrderUpdates').on('click', function() {
                const updates = [];
                
                // Collect all the updates from the form
                rowData.orders.forEach(order => {
                    const orderId = order.order_id;
                    const newQuantity = parseInt($(`.order-quantity[data-order-id="${orderId}"]`).val());
                    const newDeliveryDate = $(`.order-delivery-date[data-order-id="${orderId}"]`).val();
                    
                    // Get the delivered quantity explicitly - if empty, use 0
                    const deliveredQtyInput = $(`.order-quantity-delivered[data-order-id="${orderId}"]`);
                    const newQuantityDelivered = deliveredQtyInput.val() ? parseInt(deliveredQtyInput.val()) : 0;
                    
                    // Get current values for comparison, handling different data structures
                    const currentQty = order.quantity || 0;
                    const currentDeliveryDate = order.delivery_date || '';
                    const currentQtyDelivered = order.quantity_delivered !== undefined ? order.quantity_delivered : 0;
                    
                    // Only add to updates if something changed
                    if (newQuantity != currentQty || 
                        newQuantityDelivered != currentQtyDelivered || 
                        newDeliveryDate != currentDeliveryDate) {
                        
                        console.log(`Order ${orderId} changes: 
                            Quantity: ${currentQty} -> ${newQuantity}, 
                            Delivery date: ${currentDeliveryDate} -> ${newDeliveryDate}, 
                            Delivered: ${currentQtyDelivered} -> ${newQuantityDelivered}`);
                        
                        updates.push({
                            order_id: orderId,
                            quantity: newQuantity,
                            quantity_delivered: newQuantityDelivered,
                            est_delivery_date: newDeliveryDate
                        });
                    }
                });
                
                if (updates.length === 0) {
                    toastr.info('No changes detected');
                    return;
                }
                
                // Process all updates sequentially
                let completedUpdates = 0;
                let errors = 0;
                
                function processNextUpdate(index) {
                    if (index >= updates.length) {
                        // All updates complete
                        if (errors === 0) {
                            toastr.success(`Successfully updated ${completedUpdates} orders`);
                            modal.hide();
                            
                            // Refresh the table
                            $('#usersTable').DataTable().ajax.reload();
                        } else {
                            toastr.warning(`Completed with ${errors} errors. Please try again.`);
                        }
                        return;
                    }
                    
                    const update = updates[index];
                    
                    // Send the update request
                    $.ajax({
                        url: '/orders/update_order/',
                        type: 'POST',
                        data: JSON.stringify(update),
                        contentType: 'application/json',
                        headers: {
                            'X-CSRFToken': $('[name=csrfmiddlewaretoken]').val()
                        },
                        success: function() {
                            completedUpdates++;
                            processNextUpdate(index + 1);
                        },
                        error: function(xhr) {
                            errors++;
                            console.error('Error updating order:', xhr.responseText);
                            processNextUpdate(index + 1);
                        }
                    });
                }
                
                // Start processing updates
                processNextUpdate(0);
            });
    });

    // 2. CHANGE GROUP STATUS
    // Event handler for changing status of a group of orders
    $(document).on('click', '.change-group-status', function(e) {
        e.preventDefault();
        
        const groupId = $(this).data('group-id');
        
        // Get the corresponding row data from DataTable
        const table = $('#usersTable').DataTable();
        const rowData = table.row(function(idx, data) {
            return data.sl_no === groupId;
        }).data();
        
        if (!rowData || !rowData.orders || rowData.orders.length === 0) {
            toastr.error('No orders found in this group');
            return;
        }
        
        // First fetch the statuses from the server if we don't have them cached
        let fetchStatusesPromise;
        
        if (!window.modelStatuses) {
            fetchStatusesPromise = $.ajax({
                url: '/orders/json/',
                method: 'GET',
                dataType: 'json'
            }).then(response => {
                // Cache the statuses for future use
                window.modelStatuses = response.statuses || [];
                return window.modelStatuses;
            });
        } else {
            // Use the cached statuses
            fetchStatusesPromise = Promise.resolve(window.modelStatuses);
        }
        
        fetchStatusesPromise.then(statuses => {
            // Create a modal to update statuses
            let modalContent = `
                <div class="modal fade" id="changeGroupStatusModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Change Status - Model: ${rowData.model_no}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="changeGroupStatusForm">
                                    <!-- Store the model_id as a hidden input -->
                                    <input type="hidden" id="hiddenModelId" value="${rowData.model_id || ''}">
                                    
                                    <div class="row mb-4">
                                        <div class="col">
                                            <h6>Model Settings</h6>
                                            <div class="mb-3">
                                                <label class="form-label">Model Status</label>
                                                <select class="form-select" id="modelStatusSelect">
                                                    <option value="">No Change</option>
                                                    ${statuses.map(status => 
                                                        `<option value="${status.id}" ${rowData.orders[0].status_id === status.id ? 'selected' : ''}>${status.status}</option>`
                                                    ).join('')}
                                                </select>
                                            </div>
                                            
                                            <div class="mb-3 mt-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="sendStatusNotification">
                                                    <label class="form-check-label" for="sendStatusNotification">
                                                        Send notification to customer
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <h6>Order Delivery Status</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Color</th>
                                                    <th>Current Status</th>
                                                    <th>Mark as Delivered</th>
                                                </tr>
                                            </thead>
                                            <tbody>
            `;
            
            // Group orders by color
            const ordersByColor = {};
            
            rowData.orders.forEach(order => {
                const color = order.color || 'N/A';
                if (!ordersByColor[color]) {
                    ordersByColor[color] = [];
                }
                ordersByColor[color].push(order);
            });
            
            // Add a row for each color group
            Object.entries(ordersByColor).forEach(([color, orders]) => {
                orders.forEach((order, index) => {
                    const isDelivered = order.delivered === 'Yes';
                    modalContent += `
                        <tr>
                            <td>${order.order_id}</td>
                            <td>${color}</td>
                            <td>${order.status || 'N/A'}</td>
                            <td>
                                <div class="form-check form-switch">
                                    <input class="form-check-input order-delivered" type="checkbox" 
                                        data-order-id="${order.order_id}" ${isDelivered ? 'checked' : ''}>
                                    <label class="form-check-label">${isDelivered ? 'Delivered' : 'Not Delivered'}</label>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            });
            
            modalContent += `
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div class="form-check mt-3">
                                        <input class="form-check-input" type="checkbox" id="markAllDelivered">
                                        <label class="form-check-label" for="markAllDelivered">
                                            Mark all orders as delivered
                                        </label>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="saveGroupStatusChanges">Save All Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove any existing modals with the same ID and append the new one
            $('#changeGroupStatusModal').remove();
            $('body').append(modalContent);
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('changeGroupStatusModal'));
            modal.show();
            
            // Handle mark all delivered checkbox
            $('#markAllDelivered').on('change', function() {
                const isChecked = $(this).prop('checked');
                $('.order-delivered').prop('checked', isChecked);
            });
            
            // Handle saving all updates
            $('#saveGroupStatusChanges').on('click', function() {
                const modelStatusId = $('#modelStatusSelect').val();
                const sendNotification = $('#sendStatusNotification').prop('checked');
                
                // Collect all the delivery status updates
                const deliveryUpdates = [];
                
                rowData.orders.forEach(order => {
                    const orderId = order.order_id;
                    const isDelivered = $(`.order-delivered[data-order-id="${orderId}"]`).prop('checked');
                    const currentDelivered = order.delivered === 'Yes';
                    
                    // Only add to updates if delivery status changed
                    if (isDelivered !== currentDelivered) {
                        deliveryUpdates.push({
                            order_id: orderId,
                            delivered: isDelivered
                        });
                    }
                });
                
                // Create a promise for model status update if needed
                let modelUpdatePromise = Promise.resolve();
                
                if (modelStatusId) {
                    const modelId = rowData.model_id;
                    
                    console.log('Updating model status:', {
                        model_id: modelId,
                        status_id: modelStatusId,
                        send_notification: sendNotification,
                        rowData: rowData
                    });
                    
                    if (!modelId) {
                        console.error('No model_id available!');
                        toastr.error('Cannot update status: model ID is missing');
                        return;
                    }
                    
                    modelUpdatePromise = new Promise((resolve, reject) => {
                        $.ajax({
                            url: '/update_model_status/',
                            type: 'POST',
                            data: JSON.stringify({
                                model_id: modelId,
                                status_id: modelStatusId,
                                send_notification: sendNotification
                            }),
                            contentType: 'application/json',
                            headers: {
                                'X-CSRFToken': $('[name=csrfmiddlewaretoken]').val()
                            },
                            success: function(response) {
                                console.log('Model update success:', response);
                                resolve(response);
                            },
                            error: function(xhr, status, error) {
                                console.error('Model update error:', xhr.responseText);
                                reject(error);
                            }
                        });
                    });
                }
                
                // Create promises for all delivery updates
                const deliveryPromises = deliveryUpdates.map(update => {
                    return new Promise((resolve, reject) => {
                        $.ajax({
                            url: '/update_delivered/',
                            type: 'POST',
                            data: JSON.stringify(update),
                            contentType: 'application/json',
                            headers: {
                                'X-CSRFToken': $('[name=csrfmiddlewaretoken]').val()
                            },
                            success: resolve,
                            error: reject
                        });
                    });
                });
                
                // Process all updates
                Promise.all([modelUpdatePromise, ...deliveryPromises])
                    .then(() => {
                        toastr.success('All statuses updated successfully');
                        modal.hide();
                        
                        // Refresh the table
                        $('#usersTable').DataTable().ajax.reload();
                    })
                    .catch(error => {
                        toastr.error('Error updating statuses: ' + error);
                    });
            });
        }).catch(error => {
            console.error('Error fetching statuses:', error);
            toastr.error('Could not load status options. Please try again.');
        });
    });

    // 3. REPEAT GROUP ORDER
    // Event handler for repeating a group of orders
    $(document).on('click', '.repeat-group-order', function(e) {
        e.preventDefault();
        
        const groupId = $(this).data('group-id');
        
        // Get the corresponding row data from DataTable
        const table = $('#usersTable').DataTable();
        const rowData = table.row(function(idx, data) {
            return data.sl_no === groupId;
        }).data();
        
        if (!rowData || !rowData.orders || rowData.orders.length === 0) {
            toastr.error('No orders found in this group');
            return;
        }
        
        // Create a modal to create repeat orders
        let modalContent = `
            <div class="modal fade" id="repeatGroupOrderModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Repeat Orders - Model: ${rowData.model_no}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="repeatGroupOrderForm">
                                <div class="mb-3">
                                    <label class="form-label">Common Delivery Date</label>
                                    <input type="date" class="form-control" id="repeatCommonDeliveryDate" required>
                                </div>
                                
                                <h6 class="mt-4">Select Orders to Repeat</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="checkbox" id="selectAllOrders" checked>
                                                    </div>
                                                </th>
                                                <th>Order ID</th>
                                                <th>Color</th>
                                                <th>Original Qty</th>
                                                <th>New Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
        `;
        
        // Group orders by color
        const ordersByColor = {};
        
        rowData.orders.forEach(order => {
            const color = order.color || 'N/A';
            if (!ordersByColor[color]) {
                ordersByColor[color] = [];
            }
            ordersByColor[color].push(order);
        });
        
        // Add a row for each color group
        Object.entries(ordersByColor).forEach(([color, orders]) => {
            orders.forEach((order, index) => {
                modalContent += `
                    <tr>
                        <td>
                            <div class="form-check">
                                <input class="form-check-input repeat-order-select" type="checkbox" 
                                    data-order-id="${order.order_id}" checked>
                            </div>
                        </td>
                        <td>${order.order_id}</td>
                        <td>${color}</td>
                        <td>${order.quantity}</td>
                        <td>
                            <input type="number" class="form-control form-control-sm repeat-order-quantity" 
                                data-order-id="${order.order_id}" value="${order.quantity}" min="1" required>
                        </td>
                    </tr>
                `;
            });
        });
        
        // Default to today + 7 days for delivery date
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        const defaultDateStr = defaultDate.toISOString().split('T')[0];
        
        modalContent += `
                                        </tbody>
                                    </table>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-success" id="createGroupRepeatOrders">Create Repeat Orders</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modals with the same ID and append the new one
        $('#repeatGroupOrderModal').remove();
        $('body').append(modalContent);
        
        // Set default delivery date
        $('#repeatCommonDeliveryDate').val(defaultDateStr);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('repeatGroupOrderModal'));
        modal.show();
        
        // Handle select all checkbox
        $('#selectAllOrders').on('change', function() {
            const isChecked = $(this).prop('checked');
            $('.repeat-order-select').prop('checked', isChecked);
        });
        
        // Handle creating repeat orders
        $('#createGroupRepeatOrders').on('click', function() {
            const commonDeliveryDate = $('#repeatCommonDeliveryDate').val();
            
            if (!commonDeliveryDate) {
                toastr.error('Please select a delivery date');
                return;
            }
            
            // Collect all selected orders for repeat
            const repeatOrders = [];
            
            $('.repeat-order-select:checked').each(function() {
                const orderId = $(this).data('order-id');
                const quantity = $(`.repeat-order-quantity[data-order-id="${orderId}"]`).val();
                
                repeatOrders.push({
                    order_id: orderId,
                    quantity: quantity,
                    est_delivery_date: commonDeliveryDate
                });
            });
            
            if (repeatOrders.length === 0) {
                toastr.error('Please select at least one order to repeat');
                return;
            }
            
            // Process all repeat orders sequentially
            let completedUpdates = 0;
            let errors = 0;
            
            function processNextRepeat(index) {
                if (index >= repeatOrders.length) {
                    // All repeats complete
                    if (errors === 0) {
                        toastr.success(`Successfully created ${completedUpdates} repeat orders`);
                        modal.hide();
                        
                        // Refresh the table
                        $('#usersTable').DataTable().ajax.reload();
                    } else {
                        toastr.warning(`Completed with ${errors} errors. Please try again.`);
                    }
                    return;
                }
                
                const repeat = repeatOrders[index];
                
                // Send the repeat order request
                $.ajax({
                    url: '/orders/create_repeat_order/',
                    type: 'POST',
                    data: JSON.stringify(repeat),
                    contentType: 'application/json',
                    headers: {
                        'X-CSRFToken': $('[name=csrfmiddlewaretoken]').val()
                    },
                    success: function() {
                        completedUpdates++;
                        processNextRepeat(index + 1);
                    },
                    error: function() {
                        errors++;
                        processNextRepeat(index + 1);
                    }
                });
            }
            
            // Start processing repeat orders
            processNextRepeat(0);
        });
    });

    // 4. DELETE GROUP ORDER
    // Event handler for deleting a group of orders
    $(document).on('click', '.delete-group-order', function(e) {
        e.preventDefault();
        
        const groupId = $(this).data('group-id');
        
        // Get the corresponding row data from DataTable
        const table = $('#usersTable').DataTable();
        const rowData = table.row(function(idx, data) {
            return data.sl_no === groupId;
        }).data();
        
        if (!rowData || !rowData.orders || rowData.orders.length === 0) {
            toastr.error('No orders found in this group');
            return;
        }
        
        // Create a modal to confirm order deletion
        let modalContent = `
            <div class="modal fade" id="deleteGroupOrderModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Delete Orders - Model: ${rowData.model_no}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="fa-solid fa-triangle-exclamation me-2"></i>
                                Warning: This action cannot be undone. Please confirm which orders you want to delete.
                            </div>
                            
                            <form id="deleteGroupOrderForm">
                                <h6 class="mt-4">Select Orders to Delete</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="checkbox" id="selectAllOrdersDelete">
                                                    </div>
                                                </th>
                                                <th>Order ID</th>
                                                <th>Color</th>
                                                <th>Quantity</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
        `;
        
        // Group orders by color
        const ordersByColor = {};
        
        rowData.orders.forEach(order => {
            const color = order.color || 'N/A';
            if (!ordersByColor[color]) {
                ordersByColor[color] = [];
            }
            ordersByColor[color].push(order);
        });
        
        // Add a row for each color group
        Object.entries(ordersByColor).forEach(([color, orders]) => {
            orders.forEach((order, index) => {
                const deliveryStatus = order.delivered === 'Yes' ? 'Delivered' : 'Not Delivered';
                modalContent += `
                    <tr>
                        <td>
                            <div class="form-check">
                                <input class="form-check-input delete-order-select" type="checkbox" 
                                    data-order-id="${order.order_id}">
                            </div>
                        </td>
                        <td>${order.order_id}</td>
                        <td>${color}</td>
                        <td>${order.quantity}</td>
                        <td>
                            <span class="badge ${order.delivered === 'Yes' ? 'bg-success' : 'bg-warning'}">
                                ${deliveryStatus}
                            </span>
                        </td>
                    </tr>
                `;
            });
        });
        
        modalContent += `
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="form-check mt-3">
                                    <input class="form-check-input" type="checkbox" id="confirmDeleteAll">
                                    <label class="form-check-label" for="confirmDeleteAll">
                                        Delete all orders in this group
                                    </label>
                                </div>
                                
                                <div class="form-check mt-3 mb-3">
                                    <input class="form-check-input" type="checkbox" id="confirmDelete" required>
                                    <label class="form-check-label" for="confirmDelete">
                                        I understand this action cannot be undone
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="executeGroupDelete" disabled>Delete Selected Orders</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modals with the same ID and append the new one
        $('#deleteGroupOrderModal').remove();
        $('body').append(modalContent);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('deleteGroupOrderModal'));
        modal.show();
        
        // Handle select all checkbox
        $('#selectAllOrdersDelete').on('change', function() {
            const isChecked = $(this).prop('checked');
            $('.delete-order-select').prop('checked', isChecked);
            updateDeleteButton();
        });
        
        // Handle delete all checkbox
        $('#confirmDeleteAll').on('change', function() {
            const isChecked = $(this).prop('checked');
            if (isChecked) {
                $('.delete-order-select').prop('checked', true);
                $('#selectAllOrdersDelete').prop('checked', true);
            }
            updateDeleteButton();
        });
        
        // Handle confirm checkbox
        $('#confirmDelete').on('change', function() {
            updateDeleteButton();
        });
        
        // Handle individual order selection
        $('.delete-order-select').on('change', function() {
            const allChecked = $('.delete-order-select:checked').length === $('.delete-order-select').length;
            $('#selectAllOrdersDelete').prop('checked', allChecked);
            
            // If none is checked, uncheck the delete all checkbox
            if ($('.delete-order-select:checked').length === 0) {
                $('#confirmDeleteAll').prop('checked', false);
            }
            
            updateDeleteButton();
        });
        
        // Function to update delete button state
        function updateDeleteButton() {
            const ordersSelected = $('.delete-order-select:checked').length > 0 || $('#confirmDeleteAll').prop('checked');
            const confirmChecked = $('#confirmDelete').prop('checked');
            
            $('#executeGroupDelete').prop('disabled', !(ordersSelected && confirmChecked));
            
            // Update button text based on selection
            if ($('#confirmDeleteAll').prop('checked')) {
                $('#executeGroupDelete').text('Delete All Orders');
            } else {
                const count = $('.delete-order-select:checked').length;
                $('#executeGroupDelete').text(`Delete ${count} Selected Order${count !== 1 ? 's' : ''}`);
            }
        }
        
        // Handle executing the delete operation
        $('#executeGroupDelete').on('click', function() {
            const deleteAll = $('#confirmDeleteAll').prop('checked');
            const orderIds = [];
            
            if (deleteAll) {
                // Add all order IDs in the group
                rowData.orders.forEach(order => {
                    orderIds.push(order.order_id);
                });
            } else {
                // Only add selected order IDs
                $('.delete-order-select:checked').each(function() {
                    orderIds.push($(this).data('order-id'));
                });
            }
            
            if (orderIds.length === 0) {
                toastr.error('No orders selected for deletion');
                return;
            }
            
            // Process all deletions sequentially
            let completedDeletes = 0;
            let errors = 0;
            
            function processNextDelete(index) {
                if (index >= orderIds.length) {
                    // All deletions complete
                    if (errors === 0) {
                        toastr.success(`Successfully deleted ${completedDeletes} order${completedDeletes !== 1 ? 's' : ''}`);
                        modal.hide();
                        
                        // Refresh the table
                        $('#usersTable').DataTable().ajax.reload();
                    } else {
                        toastr.warning(`Completed with ${errors} errors. Please try again.`);
                    }
                    return;
                }
                
                const orderId = orderIds[index];
                
                // Send the delete request
                $.ajax({
                    url: '/delete_order/',
                    type: 'POST',
                    data: JSON.stringify({
                        order_id: orderId
                    }),
                    contentType: 'application/json',
                    headers: {
                        'X-CSRFToken': $('[name=csrfmiddlewaretoken]').val()
                    },
                    success: function() {
                        completedDeletes++;
                        processNextDelete(index + 1);
                    },
                    error: function(xhr) {
                        errors++;
                        console.error('Error deleting order:', xhr.responseText);
                        processNextDelete(index + 1);
                    }
                });
            }
            
            // Start processing deletions
            processNextDelete(0);
        });
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

    $(document).ready(function() {
        // Listen for when the modal is hidden
        $('#modelImageModal').on('hidden.bs.modal', function () {
            // Remove the modal backdrop
            $('.modal-backdrop').remove();
            // Make sure the body doesn't have the 'modal-open' class
            $('body').removeClass('modal-open');
            // Reset any inline styles that might have been added to the body
            $('body').css('overflow', '');
            $('body').css('padding-right', '');
        });
    });

    let selectedFile = null;
    let validationPassed = false;

    // Download template functionality
    $('#downloadTemplate').on('click', function() {
        window.location.href = '/download-order-template/';
    });

    // Add download existing orders button (optional)
    const downloadExistingBtn = $('<button>')
        .addClass('btn btn-outline-secondary btn-sm ms-2')
        .html('<i class="bx bx-data"></i> Download Existing Orders')
        .on('click', function() {
            window.location.href = '/download-existing-orders/';
        });
    $('#downloadTemplate').parent().append(downloadExistingBtn);

    // File selection - Fixed version with multiple approaches
    $('#selectFileBtn').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Select file button clicked'); // Debug log
        
        // Try multiple approaches to trigger file input
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) {
            fileInput.click();
        } else {
            console.error('File input not found');
        }
    });

    // Alternative approach - also handle click on the upload area
    $('#uploadArea').on('click', function(e) {
        if (e.target === this || $(e.target).hasClass('upload-content') || $(e.target).closest('.upload-content').length) {
            e.preventDefault();
            $('#csvFileInput')[0].click();
        }
    });

    // File input change - Enhanced version
    $('#csvFileInput').on('change', function(e) {
        console.log('File input changed'); // Debug log
        const file = e.target.files[0];
        if (file) {
            console.log('File selected:', file.name); // Debug log
            handleFileSelection(file);
        }
    });

    // Drag and drop functionality
    $('#uploadArea')
        .on('dragover', function(e) {
            e.preventDefault();
            $(this).addClass('drag-over');
        })
        .on('dragleave', function(e) {
            e.preventDefault();
            $(this).removeClass('drag-over');
        })
        .on('drop', function(e) {
            e.preventDefault();
            $(this).removeClass('drag-over');
            
            const files = e.originalEvent.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelection(files[0]);
            }
        });

    // Remove file
    $('#removeFile').on('click', function() {
        clearFileSelection();
    });

    // Process bulk upload
    $('#processBulkUpload').on('click', function() {
        if (selectedFile && validationPassed) {
            processBulkUpload();
        }
    });

    // Handle file selection
    function handleFileSelection(file) {
        console.log('Handling file selection:', file.name); // Debug log
        
        // Validate file type
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            showAlert('Please select a CSV or Excel file.', 'danger');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showAlert('File size should not exceed 10MB.', 'danger');
            return;
        }

        selectedFile = file;
        
        // Display file info
        $('#fileName').text(file.name);
        $('#fileSize').text(formatFileSize(file.size));
        $('#fileInfo').show();
        
        // Hide upload area
        $('#uploadArea').hide();
        
        // Reset validation
        $('#validationResults').hide();
        validationPassed = false;
        $('#processBulkUpload').prop('disabled', true);
        
        // Auto-validate file
        validateFile();
    }

    // Clear file selection
    function clearFileSelection() {
        selectedFile = null;
        validationPassed = false;
        
        // Reset UI
        $('#fileInfo').hide();
        $('#uploadArea').show();
        $('#validationResults').hide();
        $('#uploadProgress').hide();
        $('#processBulkUpload').prop('disabled', true);
        
        // Clear file input
        $('#csvFileInput').val('');
    }

    // Validate file
    function validateFile() {
        if (!selectedFile) return;
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Show progress
        $('#uploadProgress').show();
        updateProgress(0, 'Validating...');
        
        $.ajax({
            url: '/validate-bulk-upload/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(data) {
                $('#uploadProgress').hide();
                
                if (data.valid) {
                    validationPassed = true;
                    $('#processBulkUpload').prop('disabled', false);
                    
                    // Show success message
                    showValidationResults(data, 'success');
                } else {
                    validationPassed = false;
                    $('#processBulkUpload').prop('disabled', true);
                    
                    // Show errors
                    showValidationResults(data, 'danger');
                }
            },
            error: function(xhr, status, error) {
                $('#uploadProgress').hide();
                showAlert('Error validating file: ' + error, 'danger');
                console.error('Validation error:', error);
            }
        });
    }

    // Process bulk upload
    function processBulkUpload() {
        if (!selectedFile || !validationPassed) return;
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Show progress
        $('#uploadProgress').show();
        updateProgress(0, 'Processing orders...');
        $('#processBulkUpload').prop('disabled', true);
        
        $.ajax({
            url: '/process-bulk-upload/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(data) {
                $('#uploadProgress').hide();
                $('#processBulkUpload').prop('disabled', false);
                
                if (data.success) {
                    showAlert(
                        `Successfully created ${data.created_count} orders!` +
                        (data.failed_count > 0 ? ` ${data.failed_count} orders failed.` : ''),
                        'success'
                    );
                    
                    // Show detailed results
                    showProcessResults(data);
                    
                    // Only reload if there are no failed orders
                    if (data.failed_count === 0) {
                        // Close modal after success
                        setTimeout(function() {
                            $('#bulkUploadModal').modal('hide');
                            // Refresh page to show new orders
                            window.location.reload();
                        }, 2000);
                    } else {
                        // Keep modal open so user can see the errors
                        console.log('Failed orders:', data.failed_orders);
                    }
                } else {
                    showAlert('Error processing upload: ' + (data.error || 'Unknown error'), 'danger');
                }
            },
            error: function(xhr, status, error) {
                $('#uploadProgress').hide();
                $('#processBulkUpload').prop('disabled', false);
                showAlert('Error processing upload: ' + error, 'danger');
                console.error('Upload error:', error);
            }
        });
    }

    // Helper functions
    function showValidationResults(data, type) {
        $('#validationResults').show().removeClass().addClass(`alert alert-${type}`);
        
        let html = '<h6>Validation Results:</h6>';
        html += `<p><strong>Total rows:</strong> ${data.total_rows}</p>`;
        html += `<p><strong>Valid rows:</strong> ${data.valid_rows}</p>`;
        
        if (data.errors && data.errors.length > 0) {
            html += '<h6 class="text-danger">Errors:</h6><ul>';
            $.each(data.errors, function(index, error) {
                html += `<li class="text-danger">${error}</li>`;
            });
            html += '</ul>';
        }
        
        if (data.warnings && data.warnings.length > 0) {
            html += '<h6 class="text-warning">Warnings:</h6><ul>';
            $.each(data.warnings, function(index, warning) {
                html += `<li class="text-warning">${warning}</li>`;
            });
            html += '</ul>';
        }
        
        $('#validationResults').html(html);
    }

    function showProcessResults(data) {
        let html = '<div class="alert alert-info mt-3">';
        html += '<h6>Processing Results:</h6>';
        html += `<p><strong>Created:</strong> ${data.created_count} orders</p>`;
        
        if (data.failed_count > 0) {
            html += `<p><strong>Failed:</strong> ${data.failed_count} orders</p>`;
            html += '<h6>Failed Orders:</h6><ul>';
            $.each(data.failed_orders, function(index, failed) {
                html += `<li>Row ${failed.row}: ${failed.error}</li>`;
            });
            html += '</ul>';
        }
        
        html += '</div>';
        
        // Insert after validation results
        $('#validationResults').after(html);
    }

    function updateProgress(percent, text) {
        $('#uploadProgress .progress-bar').css('width', percent + '%');
        $('#uploadProgress small').text(text);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showAlert(message, type) {
        // Create alert element
        const alert = $(`
            <div class="alert alert-${type} alert-dismissible fade show">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        // Insert at top of modal body
        $('#bulkUploadModal .modal-body').prepend(alert);
        
        // Auto remove after 5 seconds
        setTimeout(function() {
            alert.remove();
        }, 5000);
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Reset modal when closed
    $('#bulkUploadModal').on('hidden.bs.modal', function() {
        clearFileSelection();
    });

    // Initialize drag and drop styling
    initializeDragDropStyles();

    // CSS for drag and drop styling
    function initializeDragDropStyles() {
        if (!$('#bulk-upload-styles').length) {
            $('head').append(`
                <style id="bulk-upload-styles">
                    .bulk-upload-area {
                        border: 2px dashed #dee2e6;
                        border-radius: 8px;
                        padding: 40px;
                        text-align: center;
                        background-color: #f8f9fa;
                        transition: all 0.3s ease;
                        cursor: pointer;
                    }
                    
                    .bulk-upload-area:hover {
                        border-color: #007bff;
                        background-color: #e7f3ff;
                    }
                    
                    .bulk-upload-area.drag-over {
                        border-color: #007bff;
                        background-color: #e7f3ff;
                        transform: scale(1.02);
                    }
                    
                    .upload-content {
                        pointer-events: none;
                    }
                    
                    /* Ensure buttons are clickable */
                    .upload-content button {
                        pointer-events: auto;
                    }
                </style>
            `);
        }
    }
});

// Debug function to test if elements exist
function debugElements() {
    console.log('Select File Button:', $('#selectFileBtn').length);
    console.log('File Input:', $('#csvFileInput').length);
    console.log('Upload Area:', $('#uploadArea').length);
}