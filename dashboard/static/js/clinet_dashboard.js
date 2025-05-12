$(document).ready(function () {
    loadModels();
    updateCartCount();
});

// Load all models via AJAX
function loadModels() {
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
                                    
                                    <div id="cart-controls-${model.id}" class="d-none">
                                        <div class="d-flex justify-content-center align-items-center gap-2 mb-2">
                                            <button class="btn btn-outline-secondary btn-sm" onclick="decrementQty(${model.id})">-</button>
                                            <span id="qty-${model.id}">1</span>
                                            <button class="btn btn-outline-secondary btn-sm" onclick="incrementQty(${model.id})">+</button>
                                            <button class="btn btn-success btn-sm ms-2" onclick="addToCart(${model.id})" title="Add to Cart">
                                                <i class="fa-solid fa-cart-shopping"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <button class="btn btn-primary btn-sm" onclick="showCartControls(${model.id})" id="add-btn-${model.id}">
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
}

// Show cart controls and hide "Add to Cart" button
window.showCartControls = function (modelId) {
    $(`#cart-controls-${modelId}`).removeClass('d-none');
    $(`#add-btn-${modelId}`).addClass('d-none');
};

// Increase quantity
window.incrementQty = function (modelId) {
    let qty = parseInt($(`#qty-${modelId}`).text());
    $(`#qty-${modelId}`).text(qty + 1);
};

// Decrease quantity
window.decrementQty = function (modelId) {
    let qty = parseInt($(`#qty-${modelId}`).text());
    console.log("Current quantity:", qty);
    
    if (qty > 1) {
        $(`#qty-${modelId}`).text(qty - 1);
        console.log("Decreased to:", qty - 1);
    } else {
        console.log("Quantity is 1, returning to Add to Cart state");
        // Hide the quantity controls
        let controlsElement = document.getElementById(`cart-controls-${modelId}`);
        controlsElement.classList.add('d-none');
        
        // Show the Add to Cart button
        let addButton = document.getElementById(`add-btn-${modelId}`);
        addButton.classList.remove('d-none');
        
        // Reset the quantity to 1 for next time
        $(`#qty-${modelId}`).text(1);
    }
};

// Add to cart function
window.addToCart = function (modelId) {
    let qty = parseInt($(`#qty-${modelId}`).text());
    console.log(`Adding model ID ${modelId} to cart with quantity ${qty}`);
    
    // Send AJAX request to add item to cart
    $.ajax({
        url: '/add-to-cart/',
        type: 'POST',
        data: {
            'model_id': modelId,
            'quantity': qty,
            'csrfmiddlewaretoken': getCsrfToken()
        },
        success: function(response) {
            if (response.status === 'success') {
                // Show success message
                $('#response-container').html(`
                    <div class="alert alert-success alert-dismissible fade show" role="alert" id="success-alert">
                        ${response.message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `);

                setTimeout(() => {
                    $('#success-alert').alert('close'); // Bootstrap dismiss
                }, 5000);
                
                // Update cart count in the header
                updateCartCount();
                
                // Reset the UI
                $(`#cart-controls-${modelId}`).addClass('d-none');
                $(`#add-btn-${modelId}`).removeClass('d-none');
                $(`#qty-${modelId}`).text(1);
            } else {
                $('#response-container').html(`
                    <div class="alert alert-warning alert-dismissible fade show" role="alert">
                        ${response.message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
            $('#response-container').html(`
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    Error adding item to cart. Please try again.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `);
        }
    });
};

// Function to get CSRF token
function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// Function to update cart count
function updateCartCount() {
    $.ajax({
        url: '/cart-count/',
        type: 'GET',
        success: function(response) {
            if (response.status === 'success') {
                $('#go-to-cart .badge').text(response.count);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching cart count:', error);
        }
    });
}

// Function to open the cart modal
function openClientSideModal() {
    $.ajax({
        url: '/client/modal/',
        type: 'GET',
        success: function (response) {
            if (response.status === 'success') {
                // Append modal HTML if not already present
                if ($('#clientSideModal').length === 0) {
                    $('body').append(response.html);
                }

                // Show the offcanvas modal using Bootstrap 5
                let modalElement = document.getElementById('clientSideModal');
                let modal = new bootstrap.Offcanvas(modalElement);
                modal.show();
                
                // Load cart items
                loadCartItems();
            }
        },
        error: function (xhr, status, error) {
            console.error('Modal fetch error:', error);
        }
    });
}

// Function to load cart items into the modal
function loadCartItems() {
    $.ajax({
        url: '/cart-items/',
        type: 'GET',
        success: function(response) {
            if (response.status === 'success') {
                let cartHtml = '';
                
                if (response.items.length === 0) {
                    cartHtml = '<div class="text-center py-5"><p>Your cart is empty</p></div>';
                } else {
                    cartHtml = `
                        <div class="list-group">
                            ${response.items.map(item => `
                                <div class="list-group-item">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-1">${item.model_no}</h6>
                                            <small>${item.jewelry_type_name} • ${item.weight}gm</small>
                                        </div>
                                        <div class="d-flex align-items-center">
                                            <div class="input-group input-group-sm me-2" style="width: 100px;">
                                                <button class="btn btn-outline-secondary" type="button" 
                                                        onclick="updateCartItemQty(${item.id}, ${item.quantity - 1})">-</button>
                                                <span class="input-group-text bg-light">${item.quantity}</span>
                                                <button class="btn btn-outline-secondary" type="button"
                                                        onclick="updateCartItemQty(${item.id}, ${item.quantity + 1})">+</button>
                                            </div>
                                            <button class="btn btn-outline-danger btn-sm" onclick="removeCartItem(${item.id})">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="d-grid gap-2 mt-3">
                            <button class="btn btn-primary" onclick="proceedToCheckout()">Proceed to Checkout</button>
                        </div>
                    `;
                }
                
                $('#modal-content-body').html(cartHtml);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading cart items:', error);
            $('#modal-content-body').html('<div class="alert alert-danger">Failed to load cart items</div>');
        }
    });
}

// Function to update cart item quantity
function updateCartItemQty(cartItemId, newQty) {
    if (newQty < 1) {
        removeCartItem(cartItemId);
        return;
    }
    
    $.ajax({
        url: '/update-cart/',
        type: 'POST',
        data: {
            'cart_item_id': cartItemId,
            'quantity': newQty,
            'csrfmiddlewaretoken': getCsrfToken()
        },
        success: function(response) {
            if (response.status === 'success') {
                loadCartItems();
                updateCartCount();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error updating cart item:', error);
        }
    });
}

// Function to remove item from cart
function removeCartItem(cartItemId) {
    $.ajax({
        url: '/remove-from-cart/',
        type: 'POST',
        data: {
            'cart_item_id': cartItemId,
            'csrfmiddlewaretoken': getCsrfToken()
        },
        success: function(response) {
            if (response.status === 'success') {
                loadCartItems();
                updateCartCount();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error removing cart item:', error);
        }
    });
}

// Function to proceed to checkout
function proceedToCheckout() {
    // Implement checkout logic or redirect to checkout page
    window.location.href = '/checkout/';
}