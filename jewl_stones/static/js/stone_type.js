$(document).ready(function() {
    // Fetch stone name from data attribute
    var stoneName = $("#stone-data").data("stone-name");

    console.log("Stone Name:", stoneName);  // Debugging: Ensure stoneName is correct

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
                           <a class=" edit-stone-type" href="javascript:void(0);" data-type-name="${row.type_name}">
                                    <i class="bx bx-edit-alt me-1 text-secondary"></i> 
                            </a>
                            <a class="delete-stone-type" href="javascript:void(0);" data-type-name="${row.type_name}">
                                <i class="bx bx-trash me-1 text-secondary"></i> 
                            </a>
                        </div>
                        
                    `;
                }
            }
        ]
    });
    
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
                Swal.fire('Success', 'Stone Type added successfully!', 'success');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                Swal.fire('Error', 'Failed to add Stone Type.', 'error');
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
                Swal.fire('Success', 'Stone Type updated successfully!', 'success');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                Swal.fire('Error', 'Failed to update Stone Type.', 'error');
            }
        });
    });
    
    // Delete Stone Type
    $(document).on('click', '.delete-stone-type', function() {
        var typeName = $(this).data('type-name');
        
        // Confirm before deleting
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete the stone type "${typeName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'btn-primary',
            cancelButtonColor: 'btn-secondary',
            confirmButtonText: 'Yes'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'POST',
                    url: '/delete-stone-type/',
                    data: JSON.stringify({
                        stone_name: stoneName,
                        type_name: typeName
                    }),
                    contentType: 'application/json',
                    success: function(response) {
                        // Reload the table
                        dataTable.ajax.reload();
                        
                        // Show success message
                        Swal.fire('Deleted!', 'Stone Type has been deleted.', 'success');
                    },
                    error: function(xhr, status, error) {
                        console.error("Error:", error);
                        Swal.fire('Error', 'Failed to delete Stone Type.', 'error');
                    }
                });
            }
        });
    });
});