$(document).ready(function() {
    $.ajax({
        url: "/get_repeated_orders/",
        type: "GET",
        success: function(data) {
            initializeDataTable(data);
        },
        error: function(xhr, status, error) {
            console.error("Error fetching repeated orders:", error);
        }
    });
    
    function initializeDataTable(data) {
        $('#repeatedOrdersTable').DataTable({
            data: data,
            columns: [
                { data: "id" },
                { data: "client_name" },
                { data: "original_pieces" },
                { data: "date_of_reorder" },
                { data: "est_delivery_date" },
                { data: "contact_no" },
                { 
                    data: null,
                    render: function(data, type, row) {
                        let actions = `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-icon" type="button" id="actionDropdown${row.id}" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                                    <i class="bx bx-dots-vertical-rounded"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="actionDropdown${row.id}">
                                    <li><a class="dropdown-item" href="/view_order/${row.new_order_id}">View New Order</a></li>
                                    <li><a class="dropdown-item" href="/view_order/${row.original_order_id}">View Original Order</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger delete-repeated-order" href="#" data-id="${row.id}">Delete</a></li>
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
        $('#repeatedOrdersTable').on('click', '.view-order', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            window.location.href = `/view_order/${uniqueId}`;
        });
        
        // Event listener for deleting repeated orders
        $('#repeatedOrdersTable').on('click', '.delete-repeated-order', function(e) {
            e.preventDefault();
            const id = $(this).data('id');
            deleteRepeatedOrder(id);
        });
    }
    
    function deleteRepeatedOrder(id) {
        if (confirm(`Are you sure you want to delete this repeated order relationship? This will NOT delete the actual orders.`)) {
            // AJAX request to delete repeated order entry
            $.ajax({
                url: "/delete_repeated_order/",
                type: "POST",
                data: {
                    repeated_order_id: id,
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function(response) {
                    if (response.success) {
                        // Reload the table
                        $('#repeatedOrdersTable').DataTable().ajax.reload();
                        alert("Repeated order entry deleted successfully!");
                    } else {
                        alert("Error: " + response.error);
                    }
                },
                error: function() {
                    alert("An error occurred while deleting the repeated order entry.");
                }
            });
        }
    }
});