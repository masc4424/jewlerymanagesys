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
          
            // {
            //     data: 'model_no',
            //     render: function(model_no, type, row) {
            //         const timestamp = new Date().getTime();
            //         const imageSrc = `/static/model_img/${model_no}.png?t=${timestamp}`;
            //         return `<a href="javascript:void(0);" 
            //                    onclick="showImage('${imageSrc}', '${model_no}')"
            //                    data-id="${row.id}"
            //                    data-model_no="${model_no}">
            //                    View &gt; 
            //                 </a>`;
            //     }
            // },
            {
                data: 'model_no',
                render: function(model_no, type, row) {
                    const timestamp = new Date().getTime();
                    const imageSrc = `/static/model_img/${model_no}.png?t=${timestamp}`;
                    
                    return `
                        <a href="javascript:void(0);" onclick="showImage('${imageSrc}', '${model_no}')" 
                           data-id="${row.id}" data-model_no="${model_no}" class="d-flex gap-2">
                            <img src="${imageSrc}" alt="Model Image" class="img-thumbnail" 
                                 style="width: 40px; height: 40px; object-fit: cover;" /> 
                        </a>
                    `;
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
                let existingImageSrc = `/static/model_img/${response.model_no}.png`;
                $('#editImagePreview').attr('src', existingImageSrc).removeClass('d-none');
                $('#edit_colors').val([]);
                console.log("Colors from response:", response.colors);
                if (response.colors && Array.isArray(response.colors)) {
                    $.each(response.colors, function(index, colorValue) {
                        console.log("Setting color:", colorValue);
                        $('#edit_colors option[value="' + colorValue + '"]').prop('selected', true);
                    });
                    
                    // If using Select2, refresh it
                    if ($.fn.select2) {
                        $('#edit_colors').trigger('change');
                    }
                } else {
                    console.error("Colors not found in response or not an array");
                }
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
        console.log("Form data being submitted:");
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
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
            confirmButtonColor: 'btn-primary',
            cancelButtonColor: 'btn-secondary',
            confirmButtonText: 'Yes'
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

  
    $('#edit_model_img').on('change', function () {
        let file = this.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function (e) {
                $('#editImagePreview').attr('src', e.target.result).removeClass('d-none');
            };
            reader.readAsDataURL(file);
        } else {
            $('#editImagePreview').addClass('d-none');
        }
    });
    
});

function showImage(imageSrc, modelNo) {
    $('#modalImage').attr('src', imageSrc);
    $('#imageModalLabel').text(`Model No: ${modelNo}`); // Set the model number in the modal heading
    $('#imageModal').modal('show');
}
