$(document).ready(function() {
    // Fetch stone name and type name from data attributes
    var stoneName = $("#detail-data").data("stone-name");
    var typeName = $("#detail-data").data("type-name");

    console.log("Stone Name:", stoneName);
    console.log("Type Name:", typeName);

    var dataTable = $('#detailTable').DataTable({
        ajax: {
            url: `/get-stone-type-detail-data/?stone_name=${encodeURIComponent(stoneName)}&type_name=${encodeURIComponent(typeName)}`,
            dataSrc: 'data'
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr No.
                }
            },
            { data: 'length' },
            { data: 'breadth' },
            { data: 'weight' },
            { data: 'rate' },
            {
                data: null,
                render: function() {
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
                Swal.fire('Success', 'Detail added successfully!', 'success');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                Swal.fire('Error', 'Failed to add Detail.', 'error');
            }
        });
    });
});