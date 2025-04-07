$(document).ready(function() {
    $.ajax({
        url: "/get_defective_orders/",
        type: "GET",
        success: function(data) {
            initializeDataTable(data);
        },
        error: function(xhr, status, error) {
            console.error("Error fetching defective orders:", error);
        }
    });
    
    function initializeDataTable(data) {
        $('#defectiveOrdersTable').DataTable({
            data: data,
            columns: [
                { data: "id" },
                { 
                    data: "order_unique_id",
                    render: function(data) {
                        return `<a href="#" class="view-order" data-unique-id="${data}">${data}</a>`;
                    }
                },
                { data: "client_name" },
                { data: "model_no" },
                { data: "defective_pieces" },
                { data: "issue_description" },
                { data: "reported_date" },
                { data: "contact_no" },
                { 
                    data: "image_url",
                    render: function(data) {
                        if (data) {
                            return `<a href="${data}" target="_blank" class="btn btn-sm btn-outline-primary">View Image</a>`;
                        } else {
                            return 'No image';
                        }
                    }
                },
                { 
                    data: null,
                    render: function(data, type, row) {
                        let actions = `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-icon" type="button" id="actionDropdown${row.id}" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                                    <i class="bx bx-dots-vertical-rounded"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="actionDropdown${row.id}">
                                    <li><a class="dropdown-item" href="/view_order/${row.order_unique_id}">View Order</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger delete-defective" href="#" data-id="${row.id}">Delete</a></li>
                                </ul>
                            </div>
                        `;
                        return actions;
                    }
                }
            ],
            order: [[0, 'desc']],
            dom: 'Bfrtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf', 'print'
            ]
        });
        
        // Event listener for viewing orders
        $('#defectiveOrdersTable').on('click', '.view-order', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            window.location.href = `/view_order/${uniqueId}`;
        });
        
        // Event listener for deleting defective orders
        $('#defectiveOrdersTable').on('click', '.delete-defective', function(e) {
            e.preventDefault();
            const id = $(this).data('id');
            deleteDefectiveOrder(id);
        });
    }
    
    // Report Defective Order button
    $("#report_defective").on("click", function() {
        $('#defectiveOrderModal').modal('show');
    });
    
    // Form submission for reporting defective order
    $("#defectiveOrderForm").on("submit", function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        $.ajax({
            url: "/add_defective_order/",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    $('#defectiveOrderModal').modal('hide');
                    // Reload the table
                    location.reload();
                    alert("Defective order reported successfully!");
                } else {
                    alert("Error: " + response.error);
                }
            },
            error: function() {
                alert("An error occurred while reporting the defective order.");
            }
        });
    });
    
    function deleteDefectiveOrder(id) {
        if (confirm(`Are you sure you want to delete this defective order report?`)) {
            // AJAX request to delete defective order entry
            $.ajax({
                url: "/delete_defective_order/",
                type: "POST",
                data: {
                    defective_order_id: id,
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function(response) {
                    if (response.success) {
                        // Reload the table
                        $('#defectiveOrdersTable').DataTable().ajax.reload();
                        alert("Defective order report deleted successfully!");
                    } else {
                        alert("Error: " + response.error);
                    }
                },
                error: function() {
                    alert("An error occurred while deleting the defective order report.");
                }
            });
        }
    }
});