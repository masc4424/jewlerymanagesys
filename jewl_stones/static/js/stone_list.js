$(document).ready(function() {
    $('#stoneTable').DataTable({
        ajax: {
            url: '/get-stone-data/',
            dataSrc: 'data'
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr No.
                }
            },
            { data: 'stone_name' },
            { 
                data: 'type_count',
                render: function(data, type, row) {
                    return `<a href="/stone-types/?stone_name=${encodeURIComponent(row.stone_name)}" class="text-primary">${data}<i class="bx bx-chevron-right"></i></a>`;
                }
            },
            {
                data: 'status',
                render: function(data, type, row) {
                    if (data === 'ACTIVE') {
                        return '<small class="badge bg-label-success me-1" style="font-size:11px;">Active</small>';
                    } else {
                        return '<small class="badge bg-label-danger me-1" style="font-size:11px;">Inactive</small>';
                    }
                }
            },
            {
                data: null,
                render: function(data, type, row) {
                    return `
                        <div class="d-flex gap-3">
                            <a class="edit-stone btn btn-sm btn-outline-primary" href="javascript:void(0);" data-id="${row.id}" data-name="${row.stone_name}" data-status="${row.status}">
                                <i class="bx bx-edit-alt me-1"></i>
                            </a>
                            <a class="delete-stone btn btn-sm btn-outline-danger" href="javascript:void(0);" data-id="${row.id}" data-name="${row.stone_name}">
                                <i class="bx bx-trash me-1"></i>
                            </a>
                        </div>
                    `;
                }
            }
        ]
    });
    
    // Create toast container on page load
    createToastContainer();
    
    // Create modals
    createModals();
    
    // Create Stone Form Submission
    $('#createStoneForm').on('submit', function(e) {
        e.preventDefault();
        
        const stoneName = $('#stoneName').val();
        // Get the status from checkbox - if checked it's ACTIVE, otherwise INACTIVE
        const isActive = $('#is_active').is(':checked') ? 'ACTIVE' : 'INACTIVE';
        
        $.ajax({
            url: '/create-stone/',
            type: 'POST',
            data: {
                stone_name: stoneName,
                is_active: isActive,
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function(response) {
                if (response.status === 'success') {
                    // Close the modal
                    $('#createStoneModal').modal('hide');
                    
                    // Refresh the DataTable
                    $('#stoneTable').DataTable().ajax.reload();
                    
                    // Show success message
                    showToast('success', 'Stone added successfully!');
                    
                    // Reset the form
                    $('#createStoneForm')[0].reset();
                } else {
                    showToast('error', 'Error adding stone: ' + response.message);
                }
            },
            error: function(xhr) {
                showToast('error', 'Error adding stone. Please try again.');
            }
        });
    });
    
    // Edit Stone - Open Modal with Data
    $(document).on('click', '.edit-stone', function() {
        const stoneId = $(this).data('id');
        const stoneName = $(this).data('name');
        const stoneStatus = $(this).data('status');
        
        // Set values in edit form
        $('#editStoneId').val(stoneId);
        $('#editStoneName').val(stoneName);
        $('#edit_is_active').prop('checked', stoneStatus === 'ACTIVE');
        
        // Open modal
        $('#editStoneModal').modal('show');
    });
    
    // Update Stone Form Submission
    $('#editStoneForm').on('submit', function(e) {
        e.preventDefault();
        
        const stoneId = $('#editStoneId').val();
        const stoneName = $('#editStoneName').val();
        const isActive = $('#edit_is_active').is(':checked') ? 'ACTIVE' : 'INACTIVE';
        
        $.ajax({
            url: '/update-stone/',
            type: 'POST',
            data: {
                stone_id: stoneId,
                stone_name: stoneName,
                is_active: isActive,
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function(response) {
                if (response.status === 'success') {
                    // Close the modal
                    $('#editStoneModal').modal('hide');
                    
                    // Refresh the DataTable
                    $('#stoneTable').DataTable().ajax.reload();
                    
                    // Show success message
                    showToast('success', 'Stone updated successfully!');
                } else {
                    showToast('error', 'Error updating stone: ' + response.message);
                }
            },
            error: function(xhr) {
                showToast('error', 'Error updating stone. Please try again.');
            }
        });
    });
    
    // Delete Stone - Open confirmation modal
    $(document).on('click', '.delete-stone', function() {
        const stoneId = $(this).data('id');
        const stoneName = $(this).data('name');
        
        // Set the item name and ID for deletion
        $('#deleteItemName').text(stoneName);
        $('#deleteItemId').val(stoneId);
        
        // Show the confirmation modal
        var deleteModal = new bootstrap.Modal($('#deleteConfirmModal')[0]);
        deleteModal.show();
    });
    
    // Confirm Delete Button Click
    $(document).on('click', '#confirmDeleteBtn', function() {
        const deleteId = $('#deleteItemId').val();
        
        $.ajax({
            url: '/delete-stone/',
            type: 'POST',
            data: {
                stone_id: deleteId,
                csrfmiddlewaretoken: getCookie('csrftoken')
            },
            success: function(response) {
                if (response.status === 'success') {
                    // Close the modal
                    var modal = bootstrap.Modal.getInstance($('#deleteConfirmModal')[0]);
                    modal.hide();
                    
                    // Refresh the DataTable
                    $('#stoneTable').DataTable().ajax.reload();
                    
                    // Show success message
                    showToast('success', 'Stone has been deleted successfully!');
                } else {
                    showToast('error', 'Failed to delete stone: ' + response.message);
                }
            },
            error: function(xhr) {
                showToast('error', 'An error occurred while deleting the stone.');
            }
        });
    });
});

// Function to create modals
function createModals() {
    // Delete confirmation modal
    if ($('#deleteConfirmModal').length === 0) {
        $('body').append(`
            <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Delete Stone</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete <span id="deleteItemName"></span>?</p>
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
}

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

// Function to get cookie by name (for CSRF token)
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