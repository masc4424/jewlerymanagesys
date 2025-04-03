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
                            <a class=" edit-stone" href="javascript:void(0);" data-id="${row.id}" data-name="${row.stone_name}" data-status="${row.status}">
                                <i class="bx bx-edit-alt me-1 text-secondary"></i>
                            </a>
                            <a class=" delete-stone" href="javascript:void(0);" data-id="${row.id}" data-name="${row.stone_name}">
                                <i class="bx bx-trash me-1 text-secondary"></i>
                            </a>
                        </div>
                    `;
                }
            }
        ]
    });
    
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
                    toastr.success('Stone added successfully!');
                    
                    // Reset the form
                    $('#createStoneForm')[0].reset();
                } else {
                    toastr.error('Error adding stone: ' + response.message);
                }
            },
            error: function(xhr) {
                toastr.error('Error adding stone. Please try again.');
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
                    toastr.success('Stone updated successfully!');
                } else {
                    toastr.error('Error updating stone: ' + response.message);
                }
            },
            error: function(xhr) {
                toastr.error('Error updating stone. Please try again.');
            }
        });
    });
    
    // Delete Stone Confirmation
    $(document).on('click', '.delete-stone', function() {
        const stoneId = $(this).data('id');
        const stoneName = $(this).data('name');
        
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete ${stoneName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'btn-primary',
            cancelButtonColor: 'btn-secondary',
            confirmButtonText: 'Yes',
        }).then((result) => {
            if (result.isConfirmed) {
                // Proceed with delete
                $.ajax({
                    url: '/delete-stone/',
                    type: 'POST',
                    data: {
                        stone_id: stoneId,
                        csrfmiddlewaretoken: getCookie('csrftoken')
                    },
                    success: function(response) {
                        if (response.status === 'success') {
                            // Refresh the DataTable
                            $('#stoneTable').DataTable().ajax.reload();
                            
                            // Show success message
                            Swal.fire(
                                'Deleted!',
                                'Stone has been deleted.',
                                'success'
                            );
                        } else {
                            Swal.fire(
                                'Error!',
                                'Failed to delete stone: ' + response.message,
                                'error'
                            );
                        }
                    },
                    error: function(xhr) {
                        Swal.fire(
                            'Error!',
                            'An error occurred while deleting the stone.',
                            'error'
                        );
                    }
                });
            }
        });
    });
    
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
});