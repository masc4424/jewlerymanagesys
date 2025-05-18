$(document).ready(function() {
    // Make sure the table exists in the DOM before initializing
    if (!$('#repeatedOrdersTable').length) {
        console.error('Table #repeatedOrdersTable not found in DOM');
        return;
    }
    
    try {
        // Initialize DataTable with proper error handling
        var table = $('#repeatedOrdersTable').DataTable({
            ajax: {
                url: '/api/repeated-orders/',
                dataSrc: 'data',
                error: function(xhr, error, thrown) {
                    console.error('Ajax error:', error, thrown);
                }
            },
            columns: [
                { data: null, render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr. No. column (auto-incremented)
                }},
                { data: "client_name" }, // Client column
                { data: "model_no" }, // Model column
               {
                data: "delivered",
                    render: function(data, type, row) {
                        if (data) {
                            return '<span class="badge bg-success">Delivered</span>';
                        } else {
                            return '<span class="badge bg-warning text-dark">Not Delivered</span>';
                        }
                    }
                }, // Delivery Status column
                { data: null, render: function(data, type, row) {
                    // New Model Status column
                    // Use status_id to determine if status is set
                    if (row.status_id === null) {
                        return '<span class="badge bg-warning">Not Set</span>';
                    } else {
                        return '<span class="badge bg-success">' + row.status_name + '</span>';
                    }
                }},
                { data: null, render: function(data, type, row) {
                    return `${data.quantity} / ${data.color_name}`; // Qty / Colour combined
                }},
                { data: "weight", render: function(data) {
                    return data ? data + ' g' : ''; // Weight column with 'g' suffix
                }}, 
                { data: null, render: function(data, type, row) {
                    // Action buttons
                    return `
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-primary update-status" 
                                data-id="${data.id}" data-bs-toggle="modal" data-bs-target="#updateStatusModal">
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
            // Add responsive features
            responsive: true,
            // Add proper initialization options
            initComplete: function() {
                console.log('DataTable initialized successfully');
            }
        });
        
        // Load statuses when modal is opened
        $('#updateStatusModal').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget);
            var orderId = button.data('id');
            $('#order_id').val(orderId);
            
            // Fetch order details
            $.ajax({
                url: `/api/repeated-orders/${orderId}/`,
                type: 'GET',
                success: function(response) {
                    // Populate the form
                    $('#status_id').val(response.status_id);
                    $('#quantity_delivered').val(response.quantity_delivered);
                    $('#est_delivery_date').val(response.est_delivery_date);
                    $('#delivered').prop('checked', response.delivered);
                    
                    // Load statuses for dropdown
                    loadStatuses(response.status_id);
                },
                error: function(xhr) {
                    console.error('Error fetching order details', xhr);
                    alert('Error fetching order details');
                }
            });
        });
        
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
            var formData = {
                order_id: $('#order_id').val(),
                status_id: $('#status_id').val(),
                quantity_delivered: $('#quantity_delivered').val(),
                est_delivery_date: $('#est_delivery_date').val(),
                delivered: $('#delivered').is(':checked')
            };
            
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
                    // Show success message
                    alert('Status updated successfully');
                },
                error: function(xhr) {
                    console.error('Error updating status', xhr);
                    alert('Error updating status: ' + JSON.parse(xhr.responseText).message);
                }
            });
        });
    } catch(error) {
        console.error('Error initializing DataTable:', error);
    }
});