$(document).ready(function() {
    // Store the DataTable instance in a variable to access it later
    const modelTable = $('#modelTable').DataTable({
        ajax: {
            url: `/get_model_data/${jewelry_type_name}/`, 
            dataSrc: 'data'
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr No.
                }
            },
            { data: 'model_no' },
            { data: 'length' },
            { data: 'breadth' },
            { data: 'weight' },
            {
                data: 'model_no', // Using model_no for the image path
                render: function(model_no, type, row) {
                    // const imageSrc = `/static/model_img/${model_no}.png`;
                    const timestamp = new Date().getTime();
                    const imageSrc = `/static/model_img/${model_no}.png?t=${timestamp}`;
                    return `<a href="javascript:void(0);" 
                               onclick="showImage('${imageSrc}', '${model_no}')"
                                data-id="${row.id}"
                                data-model_no="${model_no}">
                                View &gt; 
                            </a>`;
                }
            },
            {
                data: 'model_no',
                render: function(model_no) {
                    return `<a href="/product/${model_no}/" title="View Material">
                                <i class="bx bx-show"></i> &gt; 
                            </a>`;
                }
            },
            { data: 'no_of_pieces' },
            {
                data: null,
                render: function(data) {
                    return `
                        <div class="dropdown">
                            <button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                <i class="bx bx-dots-vertical-rounded"></i>
                            </button>
                            <div class="dropdown-menu">
                                <a class="dropdown-item edit-model-btn" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#editModelModal" 
                                    data-model-id="${data.id}">
                                    <i class="bx bx-edit-alt me-1"></i> Edit
                                </a>

                                <a class="dropdown-item delete-model-btn" href="javascript:void(0);" data-model-id="${data.id}">
                                    <i class="bx bx-trash me-1"></i> Delete
                                </a>
                            </div>
                        </div>
                    `;
                }
            }
        ]
    });
    
    // Form submission for creating new model
    $('#createModelForm').on('submit', function(e) {
        e.preventDefault();
        
        // Create FormData object to handle file uploads
        const formData = new FormData(this);
        
        $.ajax({
            url: '/create_model/',
            type: 'POST',
            data: formData,
            processData: false,  // Important for FormData
            contentType: false,  // Important for FormData
            success: function(response) {
                console.log('Success response:', response);
                
                // Explicitly hide the modal using Bootstrap's modal method
                const createModalElement = document.getElementById('createModelModal');
                const createModal = bootstrap.Modal.getInstance(createModalElement);
                createModal.hide();
                
                // Or alternatively use jQuery
                // $('#createModelModal').modal('hide');
                
                // Reset the form
                $('#createModelForm')[0].reset();
                
                // Refresh the DataTable
                modelTable.ajax.reload();
                
                // Show success toast or alert
                Swal.fire({
                    title: 'Success!',
                    text: response.message || 'Model created successfully',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            },
            error: function(xhr, status, error) {
                console.error('Error:', xhr, status, error);
                
                // Show error message
                Swal.fire({
                    title: 'Error!',
                    text: xhr.responseJSON?.error || 'Failed to create model',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    });
    // Fetch model data when clicking the Edit button
    $(document).on('click', '.edit-model-btn', function() {
        let modelId = $(this).data('model-id');
        console.log("modelId", modelId)
        console.log("Edit button clicked!");
        $('#editModelModal').modal('show');

        $.ajax({
            url: `/get_model/${modelId}/`,
            type: 'GET',
            success: function(response) {
                $('#edit_model_id').val(response.id);
                $('#edit_model_no').val(response.model_no);
                $('#edit_length').val(response.length);
                $('#edit_breadth').val(response.breadth);
                $('#edit_weight').val(response.weight);
                
            },
            error: function(xhr) {
                Swal.fire({
                    title: 'Error!',
                    text: xhr.responseJSON?.error || 'Failed to fetch model data',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    });

    // Submit Edit Form
    $('#editModelForm').on('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        $.ajax({
            url: '/edit_model/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                $('#editModelModal').modal('hide');
                $('#editModelForm')[0].reset();
                // modelTable.ajax.reload();
                modelTable.ajax.reload(null, true);

                Swal.fire({
                    title: 'Success!',
                    text: response.message || 'Model updated successfully',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            },
            error: function(xhr) {
                Swal.fire({
                    title: 'Error!',
                    text: xhr.responseJSON?.error || 'Failed to update model',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    });
    $(document).on('click', '.delete-model-btn', function() {
        console.log('delete button clicked');
        let modelId = $(this).data('model-id');
    
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/delete_model/${modelId}/`,
                    type: 'DELETE',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')  // Fetch CSRF token for Django
                    },
                    success: function(response) {
                        Swal.fire('Deleted!', response.message, 'success');
                        modelTable.ajax.reload();
                    },
                    error: function(xhr) {
                        Swal.fire('Error!', xhr.responseJSON?.error || 'Failed to delete model', 'error');
                    }
                });
            }
        });
    });
    
    // Function to fetch CSRF Token from Cookies (Django requirement)
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            let cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
});

function showImage(imageSrc, modelNo) {
    $('#modalImage').attr('src', imageSrc);
    $('#imageModalLabel').text(`Model No: ${modelNo}`); // Set the model number in the modal heading
    $('#imageModal').modal('show');
}
