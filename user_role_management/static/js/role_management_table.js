$(document).ready(function() {
    // Load roles when page loads
    loadRoles();
    
    // Clear create role form when modal is opened
    $('#createrole').on('click', function() {
        $('#createRoleForm').trigger('reset');
        $('#roleName').removeClass('is-invalid');
    });
    
    // Create the modals if they don't exist
    createModals();
    
    // Add event listener to save button
    $(document).on('click', '#saveRoleBtn', function() {
        createRole();
    });
    
    // Add event listener to update button
    $(document).on('click', '#updateRoleBtn', function() {
        updateRole();
    });
    
    // Add event listener to confirm delete button
    $(document).on('click', '#confirmDeleteBtn', function() {
        deleteRole();
    });
});

// Function to load roles
function loadRoles() {
    $.ajax({
        url: '/user/api/roles/',
        type: 'GET',
        success: function(data) {
            var tableBody = $('#usersTable tbody');
            tableBody.empty();
            
            if (data.roles.length === 0) {
                tableBody.html('<tr><td colspan="4" class="text-center">No roles found</td></tr>');
                return;
            }
            
            $.each(data.roles, function(index, role) {
                // Create simplified tracking info HTML - without timestamps
                var trackingInfo = `Created by: ${role.created_by}`;
                
                if (role.updated_by) {
                    trackingInfo += `<br>Updated by: ${role.updated_by}`;
                }
                
                var row = `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${role.role_name}</td>
                        <td class="tracking-info-cell">${trackingInfo}</td>
                        <td>
                            <div class="d-flex">
                                <button class="btn btn-sm btn-outline-primary me-2 edit-role" 
                                    data-unique-id="${role.role_unique_id}" 
                                    data-role-name="${role.role_name}">
                                    <i class="bx bx-edit-alt"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-role" 
                                    data-unique-id="${role.role_unique_id}">
                                    <i class="bx bx-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                tableBody.append(row);
            });
            
            // Add event listeners to edit and delete buttons
            addActionButtonListeners();
            
            // Add some styling for the tracking info cell
            $('.tracking-info-cell').css({
                'font-size': '0.875rem',
                'max-width': '250px'
            });
        },
        error: function(xhr, status, error) {
            console.error('Error loading roles:', error);
            showToast('error', 'Failed to load roles. Please try again.');
        }
    });
}

// Function to create modals
function createModals() {
    // Create role modal
    var createModal = `
        <div class="modal fade" id="createRolemodal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create New Role</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="createRoleForm">
                            <div class="mb-3">
                                <label for="roleName" class="form-label">Role Name</label>
                                <input type="text" class="form-control" id="roleName" required>
                                <div class="invalid-feedback" id="roleNameFeedback"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="saveRoleBtn">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Edit role modal
    var editModal = `
        <div class="modal fade" id="editRoleModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Role</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editRoleForm">
                            <input type="hidden" id="editRoleUniqueId">
                            <div class="mb-3">
                                <label for="editRoleName" class="form-label">Role Name</label>
                                <input type="text" class="form-control" id="editRoleName" required>
                                <div class="invalid-feedback" id="editRoleNameFeedback"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="updateRoleBtn">Update</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Delete confirmation modal
    var deleteModal = `
        <div class="modal fade" id="deleteRoleModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Delete Role</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this role?</p>
                        <input type="hidden" id="deleteRoleUniqueId">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Toast container for notifications
    var toastContainer = `
        <div bs-toast toast fade show bg-label-success" role="alert" aria-live="assertive" aria-atomic="true">
            <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto" id="toastTitle"></strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toastMessage"></div>
            </div>
        </div>
    `;
    
    // Append modals to body if they don't exist
    if ($('#createRolemodal').length === 0) {
        $('body').append(createModal);
    }
    
    if ($('#editRoleModal').length === 0) {
        $('body').append(editModal);
    }
    
    if ($('#deleteRoleModal').length === 0) {
        $('body').append(deleteModal);
    }
    
    if ($('#liveToast').length === 0) {
        $('body').append(toastContainer);
    }
}

// Function to add event listeners to action buttons
function addActionButtonListeners() {
    // Edit role buttons
    $('.edit-role').off('click').on('click', function() {
        var roleUniqueId = $(this).data('unique-id');
        var roleName = $(this).data('role-name');
        
        $('#editRoleUniqueId').val(roleUniqueId);
        $('#editRoleName').val(roleName);
        $('#editRoleName').removeClass('is-invalid');
        
        var editModal = new bootstrap.Modal($('#editRoleModal')[0]);
        editModal.show();
    });
    
    // Delete role buttons
    $('.delete-role').off('click').on('click', function() {
        var roleUniqueId = $(this).data('unique-id');
        
        $('#deleteRoleUniqueId').val(roleUniqueId);
        
        var deleteModal = new bootstrap.Modal($('#deleteRoleModal')[0]);
        deleteModal.show();
    });
}

// Function to create a new role
function createRole() {
    var roleName = $('#roleName').val().trim();
    
    // Reset validation
    $('#roleName').removeClass('is-invalid');
    
    if (!roleName) {
        $('#roleName').addClass('is-invalid');
        $('#roleNameFeedback').text('Role name is required');
        return;
    }
    
    $.ajax({
        url: '/user/api/create_role/',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ role_name: roleName }),
        success: function(data) {
            if (data.message) {
                // Close modal and reset form
                var modal = bootstrap.Modal.getInstance($('#createRolemodal')[0]);
                modal.hide();
                $('#createRoleForm').trigger('reset');
                
                // Show success message
                showToast('success', data.message);
                
                // Reload roles
                loadRoles();
            }
        },
        error: function(xhr) {
            var response = xhr.responseJSON;
            if (response && response.error) {
                $('#roleName').addClass('is-invalid');
                $('#roleNameFeedback').text(response.error);
            } else {
                showToast('error', 'Failed to create role. Please try again.');
            }
        }
    });
}

// Function to update a role
function updateRole() {
    var roleUniqueId = $('#editRoleUniqueId').val();
    var roleName = $('#editRoleName').val().trim();
    
    // Reset validation
    $('#editRoleName').removeClass('is-invalid');
    
    if (!roleName) {
        $('#editRoleName').addClass('is-invalid');
        $('#editRoleNameFeedback').text('Role name is required');
        return;
    }
    
    $.ajax({
        url: '/user/api/update_role/',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            role_unique_id: roleUniqueId,
            role_name: roleName
        }),
        success: function(data) {
            if (data.message) {
                // Close modal
                var modal = bootstrap.Modal.getInstance($('#editRoleModal')[0]);
                modal.hide();
                
                // Show success message
                showToast('success', data.message);
                
                // Reload roles
                loadRoles();
            }
        },
        error: function(xhr) {
            var response = xhr.responseJSON;
            if (response && response.error) {
                $('#editRoleName').addClass('is-invalid');
                $('#editRoleNameFeedback').text(response.error);
            } else {
                showToast('error', 'Failed to update role. Please try again.');
            }
        }
    });
}

// Function to delete a role
function deleteRole() {
    var roleUniqueId = $('#deleteRoleUniqueId').val();
    
    $.ajax({
        url: '/user/api/delete_role/',
        type: 'DELETE',
        contentType: 'application/json',
        data: JSON.stringify({ role_unique_id: roleUniqueId }),
        success: function(data) {
            if (data.message) {
                // Close modal
                var modal = bootstrap.Modal.getInstance($('#deleteRoleModal')[0]);
                modal.hide();
                
                // Show success message
                showToast('success', data.message);
                
                // Reload roles
                loadRoles();
            }
        },
        error: function(xhr) {
            var response = xhr.responseJSON;
            showToast('error', response && response.error ? response.error : 'Failed to delete role. Please try again.');
        }
    });
}

// Function to show toast notifications
function showToast(type, message) {
    var toastEl = $('#liveToast');
    var toastTitle = $('#toastTitle');
    var toastMessage = $('#toastMessage');
    
    // Remove any existing classes
    toastEl.removeClass('bg-success bg-danger text-white');
    
    if (type === 'success') {
        toastTitle.text('Success');
        toastEl.addClass('bg-success text-white');
    } else {
        toastTitle.text('Error');
        toastEl.addClass('bg-danger text-white');
    }
    
    toastMessage.text(message);
    
    var toast = new bootstrap.Toast(toastEl[0]);
    toast.show();
}