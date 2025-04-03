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
                    return `
                        <div class="dropdown">
                            <button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                <i class="bx bx-dots-vertical-rounded"></i>
                            </button>
                            <div class="dropdown-menu">
                                <a class="dropdown-item" href="javascript:void(0);">
                                    <i class="bx bx-edit-alt me-1"></i> Edit
                                </a>
                                <a class="dropdown-item" href="javascript:void(0);">
                                    <i class="bx bx-trash me-1"></i> Delete
                                </a>
                            </div>
                        </div>
                    `;
                }
            }
        ]
    });
    
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
});