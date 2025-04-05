$(document).ready(function() {
    // Fetch stone name and type name from data attributes
    var stoneName = $("#detail-data").data("stone-name");
    var typeName = $("#detail-data").data("type-name");

    console.log("Stone Name:", stoneName);
    console.log("Type Name:", typeName);

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
                data: null,
                render: function(data, type, row) {
                    // Debug why id is undefined
                    console.log("Row data in render:", row);
                    
                    // Fallback to using an object property that definitely exists if id is undefined
                    const id = row.id || 'missing-id';
                    
                    return `
                        <div class="d-flex gap-3">
                           <a class="edit-detail" href="javascript:void(0);" data-detail-id="${id}">
                                <i class="bx bx-edit-alt me-1 text-secondary"></i>
                            </a>
                            <a class="delete-detail" href="javascript:void(0);" data-detail-id="${id}">
                                <i class="bx bx-trash me-1 text-secondary"></i>
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
                Swal.fire('Success', 'Detail added successfully!', 'success');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                Swal.fire('Error', 'Failed to add Detail.', 'error');
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
            Swal.fire('Error', 'Cannot identify the detail to edit.', 'error');
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
                Swal.fire('Error', 'Failed to fetch detail data.', 'error');
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
                Swal.fire('Success', 'Detail updated successfully!', 'success');
            },
            error: function(xhr, status, error) {
                console.error("Error:", error);
                Swal.fire('Error', 'Failed to update Detail.', 'error');
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
            Swal.fire('Error', 'Cannot identify the detail to delete.', 'error');
            return;
        }
        
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'btn-primary',
            cancelButtonColor: 'btn-secondary',
            confirmButtonText: 'Yes'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    type: 'DELETE',
                    url: `/delete-stone-type-detail/${detailId}/`,
                    success: function(response) {
                        // Reload the DataTable
                        dataTable.ajax.reload();
                        
                        // Show success message
                        Swal.fire('Deleted!', 'Detail has been deleted.', 'success');
                    },
                    error: function(xhr, status, error) {
                        console.error("Error:", error);
                        Swal.fire('Error', 'Failed to delete Detail.', 'error');
                    }
                });
            }
        });
    });
});