$(document).ready(function () {
    // Initialize DataTable
    var metalTable = $('#metalTable').DataTable({
        processing: true,
        serverSide: false,
        ajax: {
            url: '/api/metals/',
            dataSrc: 'data'
        },
        columns: [
            { data: 'sr_no' },
            { data: 'name' },
            { data: 'in_stock' },
            { data: 'todays_rate' },
            { data: 'threshold' },
            {
                data: null,
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-info add-rate-btn" data-id="${row.id}" data-name="${row.name}">
                                <i class="bx bx-rupee"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-btn" data-id="${row.id}">
                                <i class="bx bx-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${row.id}" data-name="${row.name}">
                                <i class="bx bx-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        order: [[0, 'asc']],
        initComplete: function () {
            // Format current date (e.g., "4th April, 2025")
            const today = new Date();
            const day = today.getDate();
            const month = today.toLocaleString('default', { month: 'long' });
            const year = today.getFullYear();
    
            // Add suffix to day
            const getDaySuffix = (d) => {
                if (d > 3 && d < 21) return 'th';
                switch (d % 10) {
                    case 1: return 'st';
                    case 2: return 'nd';
                    case 3: return 'rd';
                    default: return 'th';
                }
            };
    
            const formattedDate = `${day}${getDaySuffix(day)} ${month}, ${year}`;
    
            // Update the header for 'Todays Rate'
            $('#metalTable thead th').eq(3).html(`Todays Rate <small class="text">(${formattedDate})</small>`);
        }
    });

    // Generate Metal ID when modal opens
    $('#addMetalModal').on('show.bs.modal', function () {
        // Generate a unique ID for the metal
        const timestamp = new Date().getTime();
        const randomNum = Math.floor(Math.random() * 1000);
        const metalId = `MTL-${timestamp}-${randomNum}`;
        
        // Set the generated ID in the form field
        $('#metalUniqueId').val(metalId);
    });

    // Handle Add Metal button click
    $('#addMetal').on('click', function () {
        // Open modal or redirect to add metal form
        $('#addMetalModal').modal('show');
    });

    // Handle Add Rate button click
    $(document).on('click', '.add-rate-btn', function () {
        var id = $(this).data('id');
        var name = $(this).data('name');

        // Open modal or redirect to add rate form
        $('#addRateModal').modal('show');
        $('#rateMetalId').val(id);
        $('#rateMetalName').text(name);
    });

    // Pre-fill edit form when edit button is clicked
    $(document).on('click', '.edit-btn', function () {
        var id = $(this).data('id');

        $.ajax({
            url: `/api/metals/${id}/`,
            method: 'GET',
            success: function (response) {
                if (response.success) {
                    const metal = response.data;

                    // Here you would either redirect to an edit page 
                    // or populate and open an edit modal
                    // For this example, we'll assume you have an edit modal similar to the add modal
                    $('#editMetalId').val(metal.id);
                    $('#editMetalUniqueId').val(metal.metal_unique_id);
                    $('#editMetalName').val(metal.name);
                    $('#editTotalAvailableWeight').val(metal.total_available_weight);
                    $('#editUnit').val(metal.unit);
                    $('#editThresholdLimit').val(metal.threshold_limit);
                    $('#editThresholdUnit').val(metal.threshold_unit);

                    $('#editMetalModal').modal('show');
                }
            },
            error: function () {
                alert('Error fetching metal details. Please try again.');
            }
        });
    });

    // Handle Save Metal button click
    $(document).on('click', '#saveMetalBtn', function () {
        // Generate the metal ID at submission time
        const timestamp = new Date().getTime();
        const randomNum = Math.floor(Math.random() * 1000);
        const metalId = `MTL-${timestamp}-${randomNum}`;
        
        // Create a data object instead of using form.serialize()
        const formData = {
            metal_unique_id: metalId,
            name: $('#metalName').val(),
            total_available_weight: $('#totalAvailableWeight').val(),
            unit: $('#unit').val(),
            threshold_limit: $('#thresholdLimit').val(),
            threshold_unit: $('#thresholdUnit').val()
        };
        
        $.ajax({
            url: '/api/metals/add/',
            method: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(response) {
                if(response.success) {
                    $('#addMetalModal').modal('hide');
                    // Refresh the metal list
                    metalTable.ajax.reload();
                    alert('Metal added successfully');
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(xhr) {
                alert('Error adding metal. Please try again.');
            }
        });
    });

    $('#saveRateBtn').on('click', function () {
        const formData = {
            metal_id: $('#rateMetalId').val(),
            weight: $('#rateWeight').val(),
            unit: $('#rateUnit').val(),
            currency: $('#rateCurrency').val(),
            rate: $('#rate').val()
        };

        $.ajax({
            url: '/api/rates/add/',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            headers: {
                'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function (response) {
                if (response.success) {
                    $('#addRateModal').modal('hide');
                    $('#addRateForm')[0].reset();
                    if (typeof metalTable !== 'undefined') {
                        metalTable.ajax.reload(null, false); // Reload DataTable if available
                    }
                    alert(response.message);
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.message || 'Something went wrong!';
                alert('Error: ' + errorMsg);
            }
        });
    });

    // Handle Update Metal form submission
    $(document).on('click', '#updateMetalBtn', function () {
        var metalId = $('#editMetalId').val();
        var formData = {
            metal_unique_id: $('#editMetalUniqueId').val(),
            name: $('#editMetalName').val(),
            total_available_weight: $('#editTotalAvailableWeight').val(),
            unit: $('#editUnit').val(),
            threshold_limit: $('#editThresholdLimit').val(),
            threshold_unit: $('#editThresholdUnit').val()
        };

        $.ajax({
            url: `/api/metals/${metalId}/update/`,
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(formData),
            success: function (response) {
                // Close modal and refresh table
                $('#editMetalModal').modal('hide');
                metalTable.ajax.reload();
                alert('Metal updated successfully!');
            },
            error: function (xhr) {
                let errorMsg = 'Error updating metal.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                alert(errorMsg);
            }
        });
    });

    // Handle Delete button click
    $(document).on('click', '.delete-btn', function () {
        var id = $(this).data('id');
        var name = $(this).data('name');

        if (confirm(`Are you sure you want to delete ${name}?`)) {
            // Send AJAX request to delete
            $.ajax({
                url: `/api/metals/${id}/delete/`,
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                success: function (response) {
                    // Refresh the table
                    metalTable.ajax.reload();
                    // Show success message
                    alert('Metal deleted successfully!');
                },
                error: function (xhr) {
                    alert('Error deleting metal. Please try again.');
                }
            });
        }
    });

    // Helper function to get CSRF token
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