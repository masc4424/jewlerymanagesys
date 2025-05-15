$(document).ready(function () {
    // When client changes, fetch models
    $('#clientSelect').change(function () {
        let clientId = $(this).val();
        $('#modelsContainer').empty();

        if (!clientId) return;

        $.get(`/client/${clientId}/models/`, function (data) {
            data.models.forEach(function (model) {
                let card = `
                    <div class="col-md-3 mb-3">
                        <div class="card h-100 shadow-sm" id="card-${model.id}">
                            <div class="position-relative">
                                <span class="badge bg-secondary position-absolute top-0 start-0 m-2">${model.status_name}</span>
                                <span class="badge bg-dark position-absolute top-0 end-0 m-2">${model.length}X${model.breadth}</span>
                                <img src="${model.image}" class="card-img-top" alt="${model.model_no}"
                                    style="height: 180px; object-fit: cover;">
                            </div>
                            <div class="card-body p-2">
                                <div class="row align-items-center">
                                    <div class="col-6">
                                        <h6 class="card-title mb-0">${model.model_no}</h6>
                                        <small class="text-muted">Weight: ${model.weight}</small>
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label mb-1 small">Color:</label>
                                        <select class="form-select form-select-sm color-select" data-model-id="${model.id}">
                                            ${model.colors.map(c => `<option value="${c.id}">${c.color}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>

                                <div class="row mt-2">
                                    <div class="col-12 text-center">
                                        <div class="counter-section d-none" data-model-id="${model.id}">
                                            <div class="d-flex justify-content-center align-items-center gap-2">
                                                <button class="btn btn-outline-secondary btn-sm decrement-btn" type="button" data-model-id="${model.id}">−</button>
                                                <span class="px-2 quantity-input" data-model-id="${model.id}">1</span>
                                                <button class="btn btn-outline-secondary btn-sm increment-btn" type="button" data-model-id="${model.id}">+</button>
                                            </div>
                                        </div>
                                        <button class="btn btn-sm btn-primary mt-2 select-btn" data-model-id="${model.id}">Add to Cart</button>
                                        <input class="form-check-input model-check d-none" type="checkbox" data-model-id="${model.id}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                $('#modelsContainer').append(card);
            });
        });
    });

    // Handle select button click
    $('#modelsContainer').on('click', '.select-btn', function () {
        let modelId = $(this).data('model-id');

        $(this).addClass('d-none');
        $(`.counter-section[data-model-id="${modelId}"]`).removeClass('d-none');
        $(`.quantity-input[data-model-id="${modelId}"]`).text(1);
        $(`.model-check[data-model-id="${modelId}"]`).prop('checked', true);
    });

    // Increment button
    $('#modelsContainer').on('click', '.increment-btn', function () {
        let modelId = $(this).data('model-id');
        let input = $(`.quantity-input[data-model-id="${modelId}"]`);
        let currentVal = parseInt(input.text()) || 1;
        input.text(currentVal + 1);
    });

    // Decrement button
    $('#modelsContainer').on('click', '.decrement-btn', function () {
        let modelId = $(this).data('model-id');
        let input = $(`.quantity-input[data-model-id="${modelId}"]`);
        let currentVal = parseInt(input.text()) || 1;

        if (currentVal > 1) {
            input.text(currentVal - 1);
        } else {
            input.text(1);
            $(`.counter-section[data-model-id="${modelId}"]`).addClass('d-none');
            $(`.select-btn[data-model-id="${modelId}"]`).removeClass('d-none');
            $(`.model-check[data-model-id="${modelId}"]`).prop('checked', false);
        }
    });

    // Submit Order
    $('#submitOrderBtn').click(function () {
        let clientId = $('#clientSelect').val();
        if (!clientId) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Client',
                text: 'Please select a client.'
            });
            return;
        }

        let orders = [];

        $('.model-check:checked').each(function () {
            let modelId = $(this).data('model-id');
            let colorId = $(`.color-select[data-model-id="${modelId}"]`).val();
            let quantity = $(`.quantity-input[data-model-id="${modelId}"]`).text();

            orders.push({
                model_id: modelId,
                color_id: colorId,
                quantity: quantity
            });
        });

        if (orders.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Models Selected',
                text: 'Please select at least one model.'
            });
            return;
        }

        $.ajax({
            url: '/orders/create/',
            method: 'POST',
            headers: {
                'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val()
            },
            contentType: 'application/json',
            data: JSON.stringify({
                client_id: clientId,
                orders: orders
            }),
            success: function (response) {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Created',
                    text: response.message || 'Redirecting...',
                    showConfirmButton: false,
                    timer: 2000
                });

                // Fix z-index issue using JS
                setTimeout(() => {
                    $('.swal2-container').css('z-index', '9999');
                }, 50);

                setTimeout(() => {
                    window.location.href = '/order_list';
                }, 2000);
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error creating orders.'
                });

                // Fix z-index in error modal too
                setTimeout(() => {
                    $('.swal2-container').css('z-index', '9999');
                }, 50);
            }
        });
    });
});
