$(document).ready(function() {
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
                            <button class="btn btn-sm edit-btn p-0" data-id="${data.id}" data-name="${data.name}">
                            <i class="bx bx-edit"></i>
                            </button>
                            <button class="btn btn-sm delete-btn p-1" data-id="${data.id}">
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
            
                    // Show success message
                    Swal.fire({
                        title: 'Success!',
                        text: 'Jewelry Type created successfully',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
            
                    // Get the DataTable instance
                    let table = $('#jewelryTable').DataTable();
            
                    // Add new row dynamically
                    table.row.add({
                        "name": response.jewelry_type_name,
                        "model_count": 0,  // Assuming new type has no models initially
                        "id": response.jewelry_type_id
                    }).draw(false); // Draw the table without resetting pagination
                } else {
                    // Show error message
                    Swal.fire({
                        title: 'Error!',
                        text: response.error || 'Failed to create jewelry type',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
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
                    Swal.fire('Success!', 'Jewelry Type updated successfully', 'success');
                    $('#jewelryTable').DataTable().ajax.reload();
                } else {
                    Swal.fire('Error!', response.error || 'Failed to update jewelry type', 'error');
                }
            }
        });
    });

    // Delete Jewelry Type
    $(document).on('click', '.delete-btn', function() {
        const id = $(this).data('id');

        Swal.fire({
            title: 'Are you sure?',
            text: 'This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel',
            backdrop: true 
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/delete_jewelry_type/${id}/`,
                    type: 'DELETE',
                    data: { _token: $('meta[name="csrf-token"]').attr('content') },
                    success: function(response) {
                        if (response.success) {
                            Swal.fire('Deleted!', 'Jewelry Type has been deleted.', 'success');
                            $('#jewelryTable').DataTable().ajax.reload();
                        } else {
                            Swal.fire('Error!', response.error || 'Failed to delete jewelry type', 'error');
                        }
                    }
                });
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