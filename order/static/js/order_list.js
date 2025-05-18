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
                    
                    tooltipContent += `<div>Total Repeats: ${data || 0}</div>`;
                    tooltipContent += `<div>In Progress: ${inProgress}</div>`;
                    
                    // Add badge styling based on repeat count
                    let badgeClass = 'bg-secondary';
                    if (data > 0) badgeClass = 'bg-info';
                    
                    return `<span class="badge ${badgeClass}" 
                              data-bs-toggle="tooltip" 
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
                                    <li><hr class="dropdown-divider"></li>
                                    <li class="dropdown-header">Individual Orders</li>
                                `;
                        
                                // Add a collapsible section for individual order details
                                html += `
                                    <li>
                                        <a class="dropdown-item" data-bs-toggle="collapse" href="#orderDetails${row.sl_no}" role="button" aria-expanded="false">
                                            <i class="fa-solid fa-list me-2"></i>View All Orders (${row.orders.length})
                                        </a>
                                        <div class="collapse p-2" id="orderDetails${row.sl_no}">
                                            <div class="card card-body p-2">
                                `;
                                
                                // List all orders in the group
                                row.orders.forEach(order => {
                                    html += `
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <div>
                                                <div>Order #${order.order_id}</div>
                                                <small>Color: ${order.color || 'N/A'}</small>
                                                <small>Qty: ${order.quantity}</small>
                                            </div>
                                            <span class="badge ${order.delivered === 'Yes' ? 'bg-success' : 'bg-warning'}">
                                                ${order.delivered === 'Yes' ? 'Delivered' : 'Not Delivered'}
                                            </span>
                                        </div>
                                    `;
                                });
                                
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
                                                <!-- These will be populated from your backend -->
                                                <option value="1">Setting</option>
                                                <option value="2">Pending</option>
                                                <option value="3">Processing</option>
                                                <option value="4">Completed</option>
                                                <option value="5">Cancelled</option>
                                            </select>
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
                // First look for model_id in rowData, then in sl_no if no model_id exists
                // In your case, it seems the model_id might be stored in a different property
                // const modelId = rowData.model_id || rowData.id || rowData.sl_no || $('#hiddenModelId').val();
                const modelId = rowData.model_id;
                
                console.log('Updating model status:', {
                    model_id: modelId,
                    status_id: modelStatusId,
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
                            status_id: modelStatusId
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
});