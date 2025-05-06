$(document).ready(function () {
    $.ajax({
        url: '/api/client/models/',
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.status === 'success') {
                const models = response.data;
                let cardsHtml = '';

                models.forEach((model, index) => {
                    cardsHtml += `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100">
                                <div class="position-relative">
                                    <span class="badge bg-secondary position-absolute top-0 start-0 m-2">${model.status_name}</span>
                                    <img src="${model.model_img}" class="card-img-top" alt="${model.model_no}">
                                    <div class="position-absolute bottom-0 start-50 translate-middle-x bg-dark text-white small px-2 py-1 rounded">
                                        ${model.length}x${model.breadth}cm
                                    </div>
                                </div>
                                <div class="card-body text-center">
                                    <h5 class="card-title">${model.model_no}</h5>
                                    <p class="card-text">${model.jewelry_type_name} • ${model.weight}gm</p>
                                    
                                    <div id="cart-controls-${index}" class="d-none">
                                        <div class="d-flex justify-content-center align-items-center gap-2 mb-2">
                                            <button class="btn btn-outline-secondary btn-sm" onclick="decrementQty(${index})">-</button>
                                            <span id="qty-${index}">1</span>
                                            <button class="btn btn-outline-secondary btn-sm" onclick="incrementQty(${index})">+</button>
                                        </div>
                                    </div>

                                    <button class="btn btn-primary btn-sm" onclick="showCartControls(${index})" id="add-btn-${index}">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });

                $('#model-cards').html(cardsHtml);
            } else {
                $('#response-container').html(`<div class="alert alert-warning">${response.message}</div>`);
            }
        },
        error: function (xhr, status, error) {
            console.error('Error:', error);
            $('#response-container').html(`<div class="alert alert-danger">Error: ${error}</div>`);
        }
    });
});

// Show cart controls and hide "Add to Cart" button
window.showCartControls = function (index) {
    $(`#cart-controls-${index}`).removeClass('d-none');
    $(`#add-btn-${index}`).addClass('d-none');
};

// Increase quantity
window.incrementQty = function (index) {
    let qty = parseInt($(`#qty-${index}`).text());
    $(`#qty-${index}`).text(qty + 1);
};

// Decrease quantity
window.decrementQty = function (index) {
    let qty = parseInt($(`#qty-${index}`).text());
    if (qty > 1) {
        $(`#qty-${index}`).text(qty - 1);
    }
};
