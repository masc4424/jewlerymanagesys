$(document).ready(function() {
    // Fetch stone name from data attribute
    var stoneName = $("#stone-data").data("stone-name");

    console.log("Stone Name:", stoneName);  // Debugging: Ensure stoneName is correct

    // Create toast container on page load
    createToastContainer();

    var dataTable = $('#stoneTypeTable').DataTable({
        ajax: {
            url: `/get-stone-type-data/?stone_name=${encodeURIComponent(stoneName)}`,
            dataSrc: 'data'
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr No.
                }
            },
            { data: 'type_name' },
            { 
                data: 'detail_count',
                render: function(data, type, row) {
                    return `<a href="/stone-type-details/?stone_name=${encodeURIComponent(stoneName)}&type_name=${encodeURIComponent(row.type_name)}" class="text-primary">${data}<i class="bx bx-chevron-right"></i></a>`;
                }
            },
            {
                data: null,
                render: function(data, type, row) {
                    // Using type_name as the identifier if id is not available
                    var identifier = row.id || row.type_name;
                    return `
                        <div class="d-flex gap-3">
                           <a class="edit-stone-type btn btn-sm btn-outline-primary" href="javascript:void(0);" data-type-name="${row.type_name}">
                                    <i class="bx bx-edit-alt me-1"></i> 
                            </a>
                            <a class="delete-stone-type btn btn-sm btn-outline-danger" href="javascript:void(0);" data-type-name="${row.type_name}">
                                <i class="bx bx-trash me-1"></i> 
                            </a>
                        </div>
                        
                    `;
                }
            }
        ]
    });
    
    // Create modals for delete confirmation
    createDeleteConfirmModal();
    
    // Create Stone Type Form Submission
    $('#createStoneTypeForm').submit(function(event) {
        event.preventDefault();
        
        var formData = {
            stone_name: stoneName,
            type_name: $('#typeName').val(),
        };
        
        $.ajax({
            type: 'POST',
            url: '/create-stone-type/',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function(response) {
                // Clear the form
                $('#typeName').val('');
                
                // Close the modal
                $('#createStoneTypeModal').modal('hide');
                
                // Force reload the DataTable data
                dataTable.ajax.reload();
                
                // Show success message
                showToast('success', 'Stone Type added successfully!');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                showToast('error', 'Failed to add Stone Type.');
            }
        });
    });

    // Edit Stone Type - Open Modal with Data
    $(document).on('click', '.edit-stone-type', function() {
        var typeName = $(this).data('type-name');
        
        // Set values in the edit modal
        $('#originalTypeName').val(typeName);  // Store original type name for identification
        $('#editTypeName').val(typeName);
        
        // Open the edit modal
        $('#editStoneTypeModal').modal('show');
    });
    
    // Edit Stone Type Form Submission
    $('#editStoneTypeForm').submit(function(event) {
        event.preventDefault();
        
        var formData = {
            stone_name: stoneName,
            original_type_name: $('#originalTypeName').val(),  // Original name to find the record
            new_type_name: $('#editTypeName').val()
        };
        
        $.ajax({
            type: 'POST',
            url: '/update-stone-type/',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function(response) {
                // Close the modal
                $('#editStoneTypeModal').modal('hide');
                
                // Reload the table data
                dataTable.ajax.reload();
                
                // Show success message
                showToast('success', 'Stone Type updated successfully!');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                showToast('error', 'Failed to update Stone Type.');
            }
        });
    });
    
    // Delete Stone Type - Open delete confirmation modal
    $(document).on('click', '.delete-stone-type', function() {
        var typeName = $(this).data('type-name');
        
        // Set the type name for deletion
        $('#deleteItemName').text(typeName);
        $('#deleteTypeName').val(typeName);
        
        // Show the confirmation modal
        var deleteModal = new bootstrap.Modal($('#deleteConfirmModal')[0]);
        deleteModal.show();
    });
    
    // Confirm Delete Button Click
    $(document).on('click', '#confirmDeleteBtn', function() {
        var typeName = $('#deleteTypeName').val();
        
        $.ajax({
            type: 'POST',
            url: '/delete-stone-type/',
            data: JSON.stringify({
                stone_name: stoneName,
                type_name: typeName
            }),
            contentType: 'application/json',
            success: function(response) {
                // Close the modal
                var modal = bootstrap.Modal.getInstance($('#deleteConfirmModal')[0]);
                modal.hide();
                
                // Reload the table
                dataTable.ajax.reload();
                
                // Show success message
                showToast('success', 'Stone Type has been deleted successfully!');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                showToast('error', 'Failed to delete Stone Type.');
            }
        });
    });
});

// Function to create delete confirmation modal
function createDeleteConfirmModal() {
    if ($('#deleteConfirmModal').length === 0) {
        $('body').append(`
            <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Delete Stone Type</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete the stone type "<span id="deleteItemName"></span>"?</p>
                            <input type="hidden" id="deleteTypeName">
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