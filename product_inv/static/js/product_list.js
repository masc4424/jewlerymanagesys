$(document).ready(function() {
    // Create toast container on page load
    createToastContainer();
    const cacheBuster = new Date().getTime();
    
    // Store the DataTable instance in a variable to access it later
    const modelTable = $('#modelTable').DataTable({
        ajax: {
            url: `/get_model_data/${jewelry_type_name}/`, 
            dataSrc: 'data',
            cache: false 
        },
        columns: [
            { 
                data: null,
                render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr No.
                }
            },
            {
                data: 'clients',
                render: function(data) {
                    return data === 'N/A' ? 'N/A' : data;
                }
            },
           
            {
                data: 'model_no',
                render: function(model_no, type, row) {
                    const cacheBuster = new Date().getTime();
                    // const imageSrc = `/static/model_img/${model_no}.png?t=${cacheBuster}`;
                    const imageSrc = `/static/${row.model_img}?t=${cacheBuster}`;

                    const length = row.length || 0;
                    const breadth = row.breadth || 0;
                    const weight = row.weight || 0;
                   
                
                    return `
                        <div class="text-center">
                            <img src="${imageSrc}" alt="${model_no}" 
                                 class="img-thumbnail preview-img mb-1 ms-3 rounded-circle"
                                 style="width: 35px; height: 35px; object-fit: cover; cursor: pointer;"
                                 onclick="openModelImageModal('${imageSrc}', '${model_no}', ${length}, ${breadth}, ${weight}, '${jewelry_type_name}')">
                            <div class="me-5">${model_no}</div>
                        </div>
                    `;
                }
                
            },
            
            
            
            // { data: 'model_no' },
            {
                data: 'status_name',
                render: function(data) {
                  return data ? data : 'N/A';
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
                data: 'is_active',
                render: function(data) {
                    if (data === 'Y') {
                        return '<span class="badge bg-label-success">Active</span>';
                    } else {
                        return '<span class="badge bg-label-danger">Inactive</span>';
                    }
                }
            },
            // {
            //     data: 'model_no',
            //     render: function(model_no, type, row) {
            //         const timestamp = new Date().getTime();
            //         const imageSrc = `/static/model_img/${model_no}.png?t=${timestamp}`;
                    
            //         return `
            //             <a href="javascript:void(0);" onclick="showImage('${imageSrc}', '${model_no}')" 
            //                data-id="${row.id}" data-model_no="${model_no}" class="d-flex gap-2">
            //                 <img src="${imageSrc}" alt="Model Image" class="img-thumbnail" 
            //                      style="width: 40px; height: 40px; object-fit: cover;" /> 
            //             </a>
            //         `;
            //     }
            // },
            
            {
                data: 'model_no',
                render: function(model_no) {
                    return `<a href="/product/${model_no}/?_=${cacheBuster}" title="View Material">
                                <i class="bx bx-show"></i> &gt; 
                            </a>`;
                }
            },
           
            // {
            //     data: 'status_name',
            //     render: function(data) {
            //       if (!data) return '<span class="badge bg-secondary">N/A</span>';
                  
            //       // Use exact status values from the database
            //       let badgeClass = 'bg-info';
                  
            //       switch(data) {
            //         case 'CAGE':
            //           badgeClass = 'bg-secondary';
            //           break;
            //         case 'WAX SETTING':
            //           badgeClass = 'bg-warning';
            //           break;
            //         case 'CASTING':
            //           badgeClass = 'bg-primary';
            //           break;
            //         case 'FILING':
            //           badgeClass = 'bg-info';
            //           break;
            //         case 'POLISHING':
            //           badgeClass = 'bg-light text-dark';
            //           break;
            //         case 'SETTING':
            //           badgeClass = 'bg-warning';
            //           break;
            //         case 'PLATING':
            //           badgeClass = 'bg-info';
            //           break;
            //         case 'QC-POST PLATING':
            //           badgeClass = 'bg-dark';
            //           break;
            //         case 'READY TO DELIVER':
            //           badgeClass = 'bg-success';
            //           break;
            //         case 'RE SETTING':
            //           badgeClass = 'bg-warning';
            //           break;
            //         case 'FINISHED':
            //           badgeClass = 'bg-success';
            //           break;
            //         default:
            //           badgeClass = 'bg-secondary';
            //       }
                  
            //       return `<span class="badge ${badgeClass}">${data}</span>`;
            //     }
            //   },
            // { data: 'no_of_pieces' },
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
                                    href="/edit_model/${jewelry_type_name}/?model_id=${data.id}&_=${cacheBuster}"
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
                showToast('error', xhr.responseJSON?.error || 'Failed to fetch model data');
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
                modelTable.ajax.reload(null, true);

                showToast('success', response.message || 'Model updated successfully');
            },
            error: function(xhr) {
                showToast('error', xhr.responseJSON?.error || 'Failed to update model');
            }
        });
    });
    
    // Create delete confirmation modal
    function createDeleteConfirmModal() {
        if ($('#deleteConfirmModal').length === 0) {
            $('body').append(`
                <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Delete Model</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>Are you sure you want to delete this model?</p>
                                <input type="hidden" id="deleteModelId">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-danger" id="confirmDeleteModelBtn">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        }
    }
    
    // Create modals on init
    createDeleteConfirmModal();
    
    $(document).on('click', '.delete-model-btn', function() {
        console.log('delete button clicked');
        let modelId = $(this).data('model-id');
        
        // Set model ID for deletion
        $('#deleteModelId').val(modelId);
        
        // Show the confirmation modal
        var deleteModal = new bootstrap.Modal($('#deleteConfirmModal')[0]);
        deleteModal.show();
    });
    
    // Confirm delete button handler
    $(document).on('click', '#confirmDeleteModelBtn', function() {
        const modelId = $('#deleteModelId').val();
        
        $.ajax({
            url: `/delete_model/${modelId}/`,
            type: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')  // Fetch CSRF token for Django
            },
            success: function(response) {
                // Close the modal
                var modal = bootstrap.Modal.getInstance($('#deleteConfirmModal')[0]);
                modal.hide();
                
                showToast('success', response.message || 'Model deleted successfully');
                modelTable.ajax.reload();
            },
            error: function(xhr) {
                showToast('error', xhr.responseJSON?.error || 'Failed to delete model');
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

// Function to create toast container
function createToastContainer() {
    // Remove any existing toast container
    if ($('#toastContainer').length > 0) {
        $('#toastContainer').remove();
    }
    
    // Create new toast container with higher z-index and better positioning
    $('body').append(`
        <div id="toastContainer" aria-live="assertive" aria-atomic="true" 
             style="position: fixed; top: 20px; right: 20px; min-width: 300px; z-index: 9999;">
            <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto" id="toastTitle"></strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toastMessage"></div>
            </div>
        </div>
    `);
}

// Function to show toast notifications
function showToast(type, message) {
    // Ensure toast container exists
    if ($('#toastContainer').length === 0) {
        createToastContainer();
    }
    
    var toastEl = $('#liveToast');
    var toastTitle = $('#toastTitle');
    var toastMessage = $('#toastMessage');
    
    // Remove any existing classes
    toastEl.removeClass('bg-success bg-danger bg-warning text-white');
    
    if (type === 'success') {
        toastTitle.text('Success');
        toastEl.addClass('bg-success text-white');
    } else if (type === 'warning') {
        toastTitle.text('Warning');
        toastEl.addClass('bg-warning');
    } else {
        toastTitle.text('Error');
        toastEl.addClass('bg-danger text-white');
    }
    
    toastMessage.text(message);
    
    // Force any existing toast to hide first
    var existingToast = bootstrap.Toast.getInstance(toastEl[0]);
    if (existingToast) {
        existingToast.hide();
    }
    
    // Create and show new toast with options
    var toast = new bootstrap.Toast(toastEl[0], {
        autohide: true,
        delay: 5000,  // Show for 5 seconds
        animation: true
    });
    toast.show();
}
// Modal image preview logic
$(document).on('click', '.preview-img', function () {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");

    modal.style.display = "block";
    modalImg.src = this.src;
    captionText.innerHTML = this.alt;
});

// Close modal when clicking on the close button
document.querySelector(".close").onclick = function () {
    document.getElementById("imageModal").style.display = "none";
};
