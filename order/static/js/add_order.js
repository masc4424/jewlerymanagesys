$(document).ready(function () {
    // When client changes, fetch models
    $('#clientSelect').change(function () {
        let clientId = $(this).val();
        $('#modelsContainer').empty();

        if (!clientId) return;

        $.get(`/api/client-models/${clientId}/`, function (data) {
            data.models.forEach(function (model) {
                let card = `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100" id="card-${model.id}">
                            <img src="${model.image}" class="card-img-top" alt="${model.model_no}">
                            <div class="card-body">
                                <h5 class="card-title">${model.model_no}</h5>
                                <p class="card-text">Weight: ${model.weight}</p>
                                <label class="form-label">Color</label>
                                <select class="form-select color-select mb-2" data-model-id="${model.id}">
                                    ${model.colors.map(c => `<option value="${c.id}">${c.color}</option>`).join('')}
                                </select>

                                <div class="counter-section d-none" data-model-id="${model.id}">
                                    <label class="form-label">Quantity</label>
                                    <div class="input-group mb-2">
                                        <button class="btn btn-outline-secondary decrement-btn" type="button" data-model-id="${model.id}">−</button>
                                        <input type="text" class="form-control text-center quantity-input" data-model-id="${model.id}" value="1" readonly>
                                        <button class="btn btn-outline-secondary increment-btn" type="button" data-model-id="${model.id}">+</button>
                                    </div>
                                </div>

                                <button class="btn btn-primary select-btn" data-model-id="${model.id}">Select</button>

                                <input class="form-check-input model-check d-none" type="checkbox" data-model-id="${model.id}" checked>
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

        // Mark selected
        $(this).addClass('d-none'); // Hide select button
        $(`.counter-section[data-model-id="${modelId}"]`).removeClass('d-none'); // Show counter
        $(`.quantity-input[data-model-id="${modelId}"]`).val(1); // Set quantity to 1
        $(`.model-check[data-model-id="${modelId}"]`).prop('checked', true); // Check checkbox
    });

    // Increment button
    $('#modelsContainer').on('click', '.increment-btn', function () {
        let modelId = $(this).data('model-id');
        let input = $(`.quantity-input[data-model-id="${modelId}"]`);
        let currentVal = parseInt(input.val()) || 1;
        input.val(currentVal + 1);
    });

    // Decrement button
    $('#modelsContainer').on('click', '.decrement-btn', function () {
        let modelId = $(this).data('model-id');
        let input = $(`.quantity-input[data-model-id="${modelId}"]`);
        let currentVal = parseInt(input.val()) || 1;

        if (currentVal > 1) {
            input.val(currentVal - 1);
        } else {
            // Deselect logic
            input.val(1); // reset value
            $(`.counter-section[data-model-id="${modelId}"]`).addClass('d-none'); // hide counter
            $(`.select-btn[data-model-id="${modelId}"]`).removeClass('d-none'); // show select button
            $(`.model-check[data-model-id="${modelId}"]`).prop('checked', false); // uncheck
        }
    });

    // Submit Order
    $('#submitOrderBtn').click(function () {
        let clientId = $('#clientSelect').val();
        if (!clientId) {
            alert("Please select a client.");
            return;
        }

        let orders = [];

        $('.model-check:checked').each(function () {
            let modelId = $(this).data('model-id');
            let colorId = $(`.color-select[data-model-id="${modelId}"]`).val();
            let quantity = $(`.quantity-input[data-model-id="${modelId}"]`).val();

            orders.push({
                model_id: modelId,
                color_id: colorId,
                quantity: quantity
            });
        });

        if (orders.length === 0) {
            alert("Please select at least one model.");
            return;
        }

        $.ajax({
            url: '/api/create-orders/',
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
                alert(response.message || "Order created successfully.");
                location.reload();
            },
            error: function () {
                alert("Error creating orders.");
            }
        });
    });
});
