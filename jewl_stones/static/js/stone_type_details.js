$(document).ready(function() {
    // Fetch stone name and type name from data attributes
    var stoneName = $("#detail-data").data("stone-name");
    var typeName = $("#detail-data").data("type-name");

    console.log("Stone Name:", stoneName);
    console.log("Type Name:", typeName);

    // Create toast container on page load
    createToastContainer();
    
    // Create modals
    createModals();

    var dataTable = $('#detailTable').DataTable({
        ajax: {
            url: `/get-stone-type-detail-data/?stone_name=${encodeURIComponent(stoneName)}&type_name=${encodeURIComponent(typeName)}`,
            dataSrc: function(json) {
                console.log("API response:", json);  // Log the entire API response
                return json.data;
            }
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr No.
                }
            },
            { 
                data: null,
                render: function(data) {
                    const length = parseFloat(data.length);
                    const breadth = parseFloat(data.breadth);
    
                    // Remove .00 if it's a whole number
                    const formattedLength = length % 1 === 0 ? length.toFixed(0) : length.toFixed(2);
                    const formattedBreadth = breadth % 1 === 0 ? breadth.toFixed(0) : breadth.toFixed(2);
    
                    return `${formattedLength} × ${formattedBreadth}`; // Dimensions column
                }
            },
            { 
                data: 'weight',
                render: function(data) {
                    const weight = parseFloat(data);
                    return weight % 1 === 0 ? weight.toFixed(0) : weight.toFixed(2);
                }
            },
            { 
                data: 'rate',
                render: function(data) {
                    const rate = parseFloat(data);
                    return rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(2);
                }
            },
            {
                data: 'tracking_info',
                render: function(data, type, row) {
                    return `<small class="text-muted">${data}</small>`;
                }
            },
            {
                data: null,
                render: function(data, type, row) {
                    // Debug why id is undefined
                    console.log("Row data in render:", row);
                    
                    // Fallback to using an object property that definitely exists if id is undefined
                    const id = row.id || 'missing-id';
                    
                    return `
                        <div class="d-flex gap-3">
                           <a class="edit-detail btn btn-sm btn-outline-primary" href="javascript:void(0);" data-detail-id="${id}">
                                <i class="bx bx-edit-alt me-1"></i>
                            </a>
                            <a class="delete-detail btn btn-sm btn-outline-danger" href="javascript:void(0);" data-detail-id="${id}">
                                <i class="bx bx-trash me-1"></i>
                            </a>
                        </div>
                    `;
                }
            }
        ]
    });
    
    // Create detail form submission
    $('#createDetailForm').submit(function(event) {
        event.preventDefault();
        
        var formData = {
            stone_name: stoneName,
            type_name: typeName,
            length: $('#length').val(),
            breadth: $('#breadth').val(),
            weight: $('#weight').val(),
            rate: $('#rate').val()
        };
        
        $.ajax({
            type: 'POST',
            url: '/create-stone-type-detail/',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function(response) {
                // Clear the form
                $('#length').val('');
                $('#breadth').val('');
                $('#weight').val('');
                $('#rate').val('');
                
                // Close the modal
                $('#createDetailModal').modal('hide');
                
                // Force reload the DataTable data
                dataTable.ajax.reload();
                
                // Show success message
                showToast('success', 'Detail added successfully!');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                showToast('error', 'Failed to add Detail.');
            }
        });
    });
    
    // Edit detail - using data attributes and checking the DOM element
    $('#detailTable').on('click', '.edit-detail', function(e) {
        console.log("Edit button clicked", this);
        
        // Directly access the attribute with attr() instead of data()
        var detailId = $(this).attr('data-detail-id');
        console.log("Edit clicked, Detail ID from attr():", detailId);
        
        // As a fallback, try data()
        if (!detailId) {
            detailId = $(this).data('detail-id');
            console.log("Fallback to data(): Detail ID:", detailId);
        }
        
        if (!detailId || detailId === 'undefined' || detailId === 'missing-id') {
            showToast('error', 'Cannot identify the detail to edit.');
            return;
        }
        
        // Fetch the detail data
        $.ajax({
            type: 'GET',
            url: `/get-stone-type-detail/${detailId}/`,
            success: function(response) {
                console.log("Detail data received:", response);
                
                // Populate the edit form with data
                $('#editDetailId').val(detailId);
                $('#editLength').val(response.length);
                $('#editBreadth').val(response.breadth);
                $('#editWeight').val(response.weight);
                $('#editRate').val(response.rate);
                
                // Show the edit modal
                $('#editDetailModal').modal('show');
            },
            error: function(xhr, status, error) {
                console.error("Error fetching detail:", xhr.status, error);
                showToast('error', 'Failed to fetch detail data.');
            }
        });
    });
    
    // Update detail form submission
    $('#editDetailForm').submit(function(event) {
        event.preventDefault();
        
        var detailId = $('#editDetailId').val();
        console.log("Submitting edit form for Detail ID:", detailId);
        
        var formData = {
            stone_name: stoneName,
            type_name: typeName,
            length: $('#editLength').val(),
            breadth: $('#editBreadth').val(),
            weight: $('#editWeight').val(),
            rate: $('#editRate').val()
        };
        
        $.ajax({
            type: 'PUT',
            url: `/update-stone-type-detail/${detailId}/`,
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function(response) {
                // Close the modal
                $('#editDetailModal').modal('hide');
                
                // Reload the DataTable
                dataTable.ajax.reload();
                
                // Show success message
                showToast('success', 'Detail updated successfully!');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                showToast('error', 'Failed to update Detail.');
            }
        });
    });
    
    // Delete detail - using attr() instead of data()
    $('#detailTable').on('click', '.delete-detail', function() {
        // Direct access the attribute
        var detailId = $(this).attr('data-detail-id');
        console.log("Delete clicked, Detail ID from attr():", detailId);
        
        // As a fallback, try data()
        if (!detailId) {
            detailId = $(this).data('detail-id');
            console.log("Fallback to data(): Detail ID:", detailId);
        }
        
        if (!detailId || detailId === 'undefined' || detailId === 'missing-id') {
            showToast('error', 'Cannot identify the detail to delete.');
            return;
        }
        
        // Set the item ID for deletion
        $('#deleteItemId').val(detailId);
        
        // Show the confirmation modal
        var deleteModal = new bootstrap.Modal($('#deleteConfirmModal')[0]);
        deleteModal.show();
    });
    
    // Confirm Delete Button Click
    $(document).on('click', '#confirmDeleteBtn', function() {
        const deleteId = $('#deleteItemId').val();
        
        $.ajax({
            type: 'DELETE',
            url: `/delete-stone-type-detail/${deleteId}/`,
            success: function(response) {
                // Close the modal
                var modal = bootstrap.Modal.getInstance($('#deleteConfirmModal')[0]);
                modal.hide();
                
                // Reload the DataTable
                dataTable.ajax.reload();
                
                // Show success message
                showToast('success', 'Detail has been deleted successfully!');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                showToast('error', 'Failed to delete Detail.');
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
                            <h5 class="modal-title">Delete Detail</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete this detail?</p>
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