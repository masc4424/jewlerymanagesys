$(document).ready(function() {
    // Create toast container on page load
    createToastContainer();
    
    $('#jewelryTable').DataTable({
        ajax: {
            url: '/jewelery_type/',
            dataSrc: 'data'
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1;
                }
            },
            { data: 'name' },
            { 
                data: null,
                render: function(data) {
                    return `<a href="#" class="model-link" data-id="${data.id}" data-name="${data.name}">
                                ${data.model_count}<i class="bx bx-chevron-right"></i>
                            </a>`;
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="dropdown">
                            <button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                <i class="bx bx-dots-vertical-rounded"></i>
                            </button>
                            <div class="dropdown-menu">
                                <a class="dropdown-item" href="javascript:void(0);">
                                    <i class="bx bx-upload me-1"></i> Bulk Upload
                                </a>
                                <a class="dropdown-item" href="javascript:void(0);">
                                    <i class="bx bx-show me-1"></i> View Models
                                </a>
                            </div>
                            <button class="btn btn-sm btn-outline-primary edit-btn me-2" data-id="${data.id}" data-name="${data.name}">
                            <i class="bx bx-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${data.id}">
                                <i class="bx bx-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
    $('#createJewelryTypeForm').on('submit', function(e) {
        e.preventDefault();
        
        const jewelryTypeName = $('#jewelry_type_name').val();
        
        $.ajax({
            url: '/create_jewelry_type/',
            type: 'POST',
           
            data: {
                'name': jewelryTypeName,
                _token: $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                if (response.success) {
                    // Close the modal
                    $('#createJewelryTypeModal').modal('hide');
            
                    // Show success message with toast instead of SweetAlert
                    showToast('success', 'Jewelry Type created successfully');
            
                    // Get the DataTable instance
                    let table = $('#jewelryTable').DataTable();
            
                    // Add new row dynamically
                    table.row.add({
                        "name": response.jewelry_type_name,
                        "model_count": 0,  // Assuming new type has no models initially
                        "id": response.jewelry_type_id
                    }).draw(false); // Draw the table without resetting pagination
                } else {
                    // Show error message with toast
                    showToast('error', response.error || 'Failed to create jewelry type');
                }
            },
            
        });
    });
     // Edit Jewelry Type (Opens the modal)
     $(document).on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        const name = $(this).data('name');

        $('#editJewelryTypeId').val(id);
        $('#editJewelryTypeName').val(name);
        $('#editJewelryTypeModal').modal('show');
    });

    // Update Jewelry Type
    $('#editJewelryTypeForm').on('submit', function(e) {
        e.preventDefault();

        const id = $('#editJewelryTypeId').val();
        const newName = $('#editJewelryTypeName').val();

        $.ajax({
            url: `/edit_jewelry_type/${id}/`,
            type: 'POST',
            data: { 'name': newName, _token: $('meta[name="csrf-token"]').attr('content') },
            success: function(response) {
                if (response.success) {
                    $('#editJewelryTypeModal').modal('hide');
                    showToast('success', 'Jewelry Type updated successfully');
                    $('#jewelryTable').DataTable().ajax.reload();
                } else {
                    showToast('error', response.error || 'Failed to update jewelry type');
                }
            }
        });
    });

    // Delete Jewelry Type
    $(document).on('click', '.delete-btn', function() {
        const id = $(this).data('id');

        // Create delete confirmation modal dynamically if it doesn't exist
        if ($('#deleteConfirmModal').length === 0) {
            $('body').append(`
                <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Delete Jewelry Type</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>Are you sure you want to delete this Jewelry Type? This action cannot be undone.</p>
                                <input type="hidden" id="deleteItemId">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        }
        
        // Set the ID for deletion
        $('#deleteItemId').val(id);
        
        // Show the confirmation modal
        var deleteModal = new bootstrap.Modal($('#deleteConfirmModal')[0]);
        deleteModal.show();
    });

    // Confirm Delete Button Click
    $(document).on('click', '#confirmDeleteBtn', function() {
        const deleteId = $('#deleteItemId').val();
        
        $.ajax({
            url: `/delete_jewelry_type/${deleteId}/`,
            type: 'DELETE',
            data: { _token: $('meta[name="csrf-token"]').attr('content') },
            success: function(response) {
                if (response.success) {
                    // Close the modal
                    var modal = bootstrap.Modal.getInstance($('#deleteConfirmModal')[0]);
                    modal.hide();
                    
                    showToast('success', 'Jewelry Type has been deleted.');
                    $('#jewelryTable').DataTable().ajax.reload();
                } else {
                    showToast('error', response.error || 'Failed to delete jewelry type');
                }
            }
        });
    });

    // Redirect to product_list on model click
    $(document).on('click', '.model-link', function(e) {
        e.preventDefault();
        const jewelryTypeName = $(this).data('name');
        window.location.href = `/product_list/${jewelryTypeName}/`;
    });
});

// Function to create toast container
function createToastContainer() {
    // Remove any existing toast container
    if ($('#toastContainer').length > 0) {
        $('#toastContainer').remove();
    }
    
    // Create new toast container with higher z-index and better positioning
    $('body').append(`
        <div id="toastContainer" aria-live="assertive" aria-atomic="true" 
             style="position: fixed; top: 20px; right: 20px; min-width: 300px; z-index: 9999;">
            <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto" id="toastTitle"></strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toastMessage"></div>
            </div>
        </div>
    `);
}

// Function to show toast notifications
function showToast(type, message) {
    // Ensure toast container exists
    if ($('#toastContainer').length === 0) {
        createToastContainer();
    }
    
    var toastEl = $('#liveToast');
    var toastTitle = $('#toastTitle');
    var toastMessage = $('#toastMessage');
    
    // Remove any existing classes
    toastEl.removeClass('bg-success bg-danger bg-warning text-white');
    
    if (type === 'success') {
        toastTitle.text('Success');
        toastEl.addClass('bg-success text-white');
    } else if (type === 'warning') {
        toastTitle.text('Warning');
        toastEl.addClass('bg-warning');
    } else {
        toastTitle.text('Error');
        toastEl.addClass('bg-danger text-white');
    }
    
    toastMessage.text(message);
    
    // Force any existing toast to hide first
    var existingToast = bootstrap.Toast.getInstance(toastEl[0]);
    if (existingToast) {
        existingToast.hide();
    }
    
    // Create and show new toast with options
    var toast = new bootstrap.Toast(toastEl[0], {
        autohide: true,
        delay: 5000,  // Show for 5 seconds
        animation: true
    });
    toast.show();
}