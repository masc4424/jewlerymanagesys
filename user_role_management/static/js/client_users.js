$(document).ready(function() {
    const usersTable = $('#usersTable').DataTable({
        processing: true,
        serverSide: false,
        ajax: {
            url: '/user/api/get_client_users/',
            dataSrc: function(json) {
                return json.data || [];
            },
            error: function(xhr, error) {
                console.error('Error loading users data:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load users data. Please try again.',
                });
            }
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1;
                }
            },
            { 
                data: null,
                render: function(data) {
                    return `
                        <div class="d-flex align-items-center">
                            <img src="${data.profile_image}" class="user-profile-image me-3"
                                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" 
                                 alt="Profile Image">
                            <span>${data.full_name}</span>
                        </div>
                    `;
                }
            },
            { data: 'email' },
            { data: 'phone_number' },
            { 
                data: null,
                render: function(data) {
                    let createdBy = data.created_by || 'System';
                    let updatedBy = data.updated_by || 'System';
                    return `Created: ${createdBy}<br>Updated: ${updatedBy}`;
                }
            },
            {
                data: null,
                orderable: false,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-outline-primary edit-user" href="javascript:void(0);" data-id="${data.id}">
                            <i class="bx bx-edit-alt me-1"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-user" href="javascript:void(0);" data-id="${data.id}">
                            <i class="bx bx-trash me-1"></i>
                        </button>
                    `;
                }
            }
        ],
        order: [[1, 'asc']],
        drawCallback: function() {
            $('.user-profile-image').css({
                'width': '40px',
                'height': '40px',
                'border-radius': '50%',
                'object-fit': 'cover'
            });
        }
    });

    function refreshUsersTable() {
        usersTable.ajax.reload();
    }

    $('#add_profile_image').change(function() {
        previewImage(this, '#add_image_preview');
    });

    $('#edit_profile_image').change(function() {
        previewImage(this, '#edit_image_preview');
    });

    function previewImage(input, previewElement) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $(previewElement).attr('src', e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    $('#addUserForm').submit(function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        $.ajax({
            url: '/user/api/add_client_user/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.status === 'success') {
                    $('#addUserModal').modal('hide');
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: `${response.message} (Username: ${response.username})`
                    });
                    $('#addUserForm')[0].reset();
                    $('#add_image_preview').attr('src', '/static/user_image/default.png');
                    refreshUsersTable();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message
                    });
                }
            },
            error: function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while adding the user. Please try again.'
                });
            }
        });
    });

    $(document).on('click', '.edit-user', function() {
        const userData = usersTable.row($(this).closest('tr')).data();
        $('#edit_user_id').val(userData.id);
        $('#edit_username').val(userData.username);
        $('#edit_email').val(userData.email);
        $('#edit_full_name').val(userData.full_name);
        $('#edit_phone_number').val(userData.phone_number);
        $('#edit_address').val(userData.address);
        $('#edit_status').val(userData.is_active.toString());
        $('#edit_image_preview').attr('src', userData.profile_image);
        $('#edit_role').val('');
        $('#editUserModal').modal('show');
    });

    $('#editUserForm').submit(function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        $.ajax({
            url: '/user/api/edit_client_user/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.status === 'success') {
                    $('#editUserModal').modal('hide');
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message
                    });
                    refreshUsersTable();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message
                    });
                }
            },
            error: function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while updating the user. Please try again.'
                });
            }
        });
    });

    $(document).on('click', '.delete-user', function() {
        const userId = $(this).data('id');
        const userData = usersTable.row($(this).closest('tr')).data();
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete the user "${userData.full_name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/user/api/delete_client_user/',
                    type: 'POST',
                    data: JSON.stringify({ user_id: userId }),
                    contentType: 'application/json',
                    dataType: 'json',
                    success: function(response) {
                        if (response.status === 'success') {
                            Swal.fire({
                                icon: 'success',
                                title: 'Deleted!',
                                text: response.message
                            });
                            refreshUsersTable();
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: response.message
                            });
                        }
                    },
                    error: function() {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'An error occurred while deleting the user. Please try again.'
                        });
                    }
                });
            }
        });
    });

    $('#addUserModal').on('hidden.bs.modal', function() {
        $('#addUserForm')[0].reset();
        $('#add_image_preview').attr('src', '/static/user_image/default.png');
    });

    $('#editUserModal').on('hidden.bs.modal', function() {
        $('#editUserForm')[0].reset();
    });

    $('#toggleEditPassword').on('click', function() {
        const passwordField = $('#edit_password');
        const icon = $('#editPasswordIcon');
        const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', type);
    
        // Toggle icon class
        icon.toggleClass('fa-eye fa-eye-slash');
    });

    $('#toggleAddPassword').on('click', function() {
        const passwordField = $('#add_password');
        const icon = $('#addPasswordIcon');
        const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', type);
        icon.toggleClass('fa-eye fa-eye-slash');
    });
});