// ✅ Get CSRF token from cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

$(document).ready(function () {

    // ✅ Open Edit Modal on Metal Card Click
    $(document).on('click', '.edit-btn', function () {
        const metalId = $(this).data('id');

        $.ajax({
            url: `/api/metals/${metalId}/`,
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    const metal = response.data;

                    // Populate modal form
                    $('#editMetalId').val(metal.id);
                    $('#editMetalUniqueId').val(metal.metal_unique_id);
                    $('#editMetalName').val(metal.name);
                    $('#editTotalAvailableWeight').val(metal.total_available_weight);
                    $('#editUnit').val(metal.unit);
                    $('#editThresholdLimit').val(metal.threshold_limit);
                    $('#editThresholdUnit').val(metal.threshold_unit);

                    // Show modal
                    $('#editMetalModal').modal('show');
                } else {
                    Swal.fire('Error', 'Failed to load metal data.', 'error');
                }
            },
            error: function () {
                Swal.fire('Error', 'An error occurred while fetching metal details.', 'error');
            }
        });
    });

    // ✅ Submit Metal Update
    $(document).on('click', '#updateMetalBtn', function () {
        const metalId = $('#editMetalId').val();

        const formData = {
            metal_unique_id: $('#editMetalUniqueId').val(),
            name: $('#editMetalName').val(),
            total_available_weight: $('#editTotalAvailableWeight').val(),
            unit: $('#editUnit').val(),
            threshold_limit: $('#editThresholdLimit').val(),
            threshold_unit: $('#editThresholdUnit').val()
        };

        $.ajax({
            url: `/api/metals/${metalId}/update/`,
            method: 'POST',  // Use PUT if your API expects it
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(formData),
            success: function (response) {
                $('#editMetalModal').modal('hide');

                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Metal updated successfully!',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    location.reload(); // ✅ Reload page after confirmation
                });
            },
            error: function (xhr) {
                let errorMsg = 'Error updating metal.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                Swal.fire('Error', errorMsg, 'error');
            }
        });
    });

});
