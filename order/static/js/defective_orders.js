$(document).ready(function() {
    // Create modal dynamically and append to body
    const imageModalHTML = `
        <div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="imageModalLabel">Defective Order Image</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body text-center">
                <img src="" id="modalImage" class="img-fluid rounded shadow" alt="Defective Image">
              </div>
            </div>
          </div>
        </div>
    `;
    $('body').append(imageModalHTML);

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
                            return `
                                <img src="${data}" alt="Defect" class="img-thumbnail view-defect-img" 
                                     style="max-width: 60px; cursor: pointer;" 
                                     data-bs-toggle="modal" 
                                     data-bs-target="#imageModal" 
                                     data-image="${data}" />
                            `;
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
            buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
        });

        // Handle image thumbnail click
        $('#defectiveOrdersTable').on('click', '.view-defect-img', function() {
            const imageUrl = $(this).data('image');
            $('#modalImage').attr('src', imageUrl);
        });

        // View order
        $('#defectiveOrdersTable').on('click', '.view-order', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            window.location.href = `/view_order/${uniqueId}`;
        });

        // Delete order
        $('#defectiveOrdersTable').on('click', '.delete-defective', function(e) {
            e.preventDefault();
            const id = $(this).data('id');
            deleteDefectiveOrder(id);
        });
    }

    // Show report modal
    $("#report_defective").on("click", function() {
        $('#defectiveOrderModal').modal('show');
    });

    // Form submission
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
            $.ajax({
                url: "/delete_defective_order/",
                type: "POST",
                data: {
                    defective_order_id: id,
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function(response) {
                    if (response.success) {
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
