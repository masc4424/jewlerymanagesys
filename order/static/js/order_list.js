$(document).ready(function() {
    var csrftoken = $('[name=csrfmiddlewaretoken]').val();
    
    // Initialize DataTable
    var table = $('#usersTable').DataTable({
        ajax: {
            url: '/orders/json/', // Replace with your actual URL
            dataSrc: 'data'
        },
        columns: [
            { data: 'sl_no' },
            { 
                data: null,
                render: function(data, type, row) {
                    if (type !== 'display') return row.model_no || '';
                    
                    // Create model display with image thumbnail
                    var html = '<div class="d-flex align-items-center model-info">';
                    
                    if (row.model_image) {
                        html += '<div class="model-thumbnail me-2">' +
                            '<img src="' + row.model_image + '" class="rounded-circle model-thumbnail-img" ' +
                            'width="40" height="40" alt="Model ' + row.model_no + '" ' +
                            'data-bs-toggle="tooltip" title="Click to view" ' +
                            'data-model-no="' + row.model_no + '" ' +
                            'data-model-image="' + row.model_image + '">' +
                            '</div>';
                    }
                    
                    html += '<span>' + (row.model_no || 'N/A') + '</span></div>';
                    
                    return html;
                }
            },
            { data: 'client' },
            { data: 'status' },
            { data: 'quantity' },
            { data: 'delivered' },
            { data: 'repeated_order' },
            { data: 'in_progress' },
            { data: 'weight' },
            { data: 'color' },
            { data: 'delivery_date' },
            {
                data: 'order_id',
                render: function(data, type, row, meta) {
                    if (type !== 'display') return data;
                    
                    return `
                        <div class="action-menu">
                            <button class="btn btn-sm btn-icon" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li>
                                    <button class="dropdown-item d-flex align-items-center update-order" data-id="${data}">
                                        <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>
                                        <span>Update</span>
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item d-flex align-items-center change-status" data-id="${data}" 
                                        data-delivery-date="${row.delivery_date}" data-delivered="${row.delivered === 'Yes'}"
                                        data-status-id="${row.status_id}">
                                        <i class="fa-solid fa-toggle-on me-2 text-warning"></i>
                                        <span>Change Status</span>
                                    </button>
                                </li>
                                <li><hr class="dropdown-divider"></li>
                                <li>
                                    <button class="dropdown-item d-flex align-items-center repeat-order" data-id="${data}">
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
        initComplete: function() {
            // Initialize tooltips
            $('[data-bs-toggle="tooltip"]').tooltip();
        }
    });

    $('#ordersFilterTabs button').on('click', function() {
        let filter = $(this).data('filter');
        // Use DataTables API to filter or reload with filter param
        let table = $('#usersTable').DataTable();
        
        if (filter === 'all') {
            table.ajax.url('orders/json/').load();
        } else if (filter === 'delivered') {
            table.ajax.url('orders/json/?status=delivered').load();
        } else if (filter === 'not-delivered') {
            table.ajax.url('orders/json/?status=not-delivered').load();
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
        var modelImage = $(this).data('model-image');
        
        $('#modelNoDisplay').text(modelNo);
        $('#modelFullImage').attr('src', modelImage);
        var modal = new bootstrap.Modal(document.getElementById('modelImageModal'));
        modal.show();
    });

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
        $('#orderDeliveryStatus').val(statusId);
        
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