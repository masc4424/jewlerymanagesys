$(document).ready(function () {
    // Fix for tab highlighting
    $('.nav-link').on('click', function (e) {
        // Remove active class from all tabs
        $('.nav-link').removeClass('active');
        // Add active class to clicked tab
        $(this).addClass('active');
    });
    
    // Bootstrap 5 tab event handler (alternative approach)
    $('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
        // Remove active class from all tabs
        $('.nav-link').removeClass('active');
        // Add active class to the active tab
        $(e.target).addClass('active');
    });
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
                let readyToDeliverHtml = '';
                let othersHtml = '';
                let readyToDeliverCount = 0;
                let othersCount = 0;

                models.forEach((model, index) => {
                    // Check if model has a delivered order
                    const isReadyToDeliver = model.order && model.order.is_delivered;
                    
                    // Generate the card HTML
                    const cardHtml = generateModelCard(model);
                    
                    // Add to the appropriate tab
                    if (isReadyToDeliver) {
                        readyToDeliverHtml += cardHtml;
                        readyToDeliverCount++;
                    } else {
                        othersHtml += cardHtml;
                        othersCount++;
                    }
                });

                // Update the DOM with generated HTML
                $('#ready-to-deliver-cards').html(readyToDeliverHtml);
                $('#others-cards').html(othersHtml);
                
                // Show/hide empty states
                if (readyToDeliverCount === 0) {
                    $('#ready-to-deliver-empty').removeClass('d-none');
                } else {
                    $('#ready-to-deliver-empty').addClass('d-none');
                }
                
                if (othersCount === 0) {
                    $('#others-empty').removeClass('d-none');
                } else {
                    $('#others-empty').addClass('d-none');
                }
                
                // Attach event listeners AFTER adding the HTML to the DOM
                $('.color-select').on('change', function() {
                    const modelId = $(this).data('model-id');
                    const selectedColor = $(this).val();
                    checkOrderForColor(modelId, selectedColor);
                });
                
                // Initial check for each model's default color
                models.forEach((model) => {
                    const defaultColor = $(`#color-select-${model.id}`).val();
                    if (defaultColor) {
                        checkOrderForColor(model.id, defaultColor);
                    }
                });
                
                // Add the image modal to the page if it doesn't exist
                if ($('#imageZoomModal').length === 0) {
                    addImageZoomModal();
                    initializeImageZoom();
                }
            } else {
                showAlert('warning', response.message);
            }
        },
        error: function (xhr, status, error) {
            console.error('Error:', error);
            showAlert('danger', `Error: ${error}`);
        }
    });
}

function generateModelCard(model) {
    // Check if order exists AND is delivered to show Re-order button
    const hasDeliveredOrder = model.order && model.order.order_id && model.order.is_delivered;
    
    return `
        <div class="col-md-3 mb-3">
            <div class="card h-100 shadow-sm" id="model-${model.id}">
                <div class="position-relative">
                    <span class="badge bg-secondary position-absolute top-0 start-0 m-2">${model.status_name}</span>
                    <span class="badge bg-dark position-absolute top-0 end-0 m-2">${model.length}x${model.breadth}cm</span>
                    <img src="${model.model_img}" class="card-img-top cursor-pointer" alt="${model.model_no}" 
                         style="height: 180px; object-fit: cover;" 
                         onclick="openImageModal('${model.model_img}', '${model.model_no}', '${model.jewelry_type_name}', '${model.weight}', '${model.length}', '${model.breadth}')">
                </div>
                <div class="card-body p-2">
                    <div class="row align-items-center">
                        <!-- Left side: Model info -->
                        <div class="col-6">
                            <h6 class="card-title mb-0">${model.model_no}</h6>
                            <small class="text-muted">${model.jewelry_type_name} &bull; </small>
                            <small class="text-muted">${model.weight}gm</small>
                        </div>
                        
                        <!-- Right side: Color dropdown with label -->
                        <div class="col-6">
                            <label for="color-select-${model.id}" class="form-label mb-1 small">Color:</label>
                            <select id="color-select-${model.id}" class="form-select form-select-sm color-select" data-model-id="${model.id}" data-order-id="${model.order ? model.order.order_id : ''}">
                                ${model.colors.map(color => `<option value="${color.id}">${color.color}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Center: Add button and controls -->
                    <div class="row mt-2">
                        <div class="col-12 text-center">
                            <div id="cart-controls-${model.id}" class="d-none">
                                <div class="d-flex justify-content-center align-items-center gap-2">
                                    <button class="btn btn-outline-secondary btn-sm" onclick="decrementQty(${model.id})">-</button>
                                    <span id="qty-${model.id}">1</span>
                                    <button class="btn btn-outline-secondary btn-sm" onclick="incrementQty(${model.id})">+</button>
                                    <button class="btn btn-success btn-sm ms-2" onclick="addToCart(${model.id})" title="Add to Cart">
                                        <i class="fa-solid fa-cart-shopping"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Re-order button: Will be visible only if there's a delivered order -->
                            ${hasDeliveredOrder ? `
                                <button class="btn btn-success btn-md" onclick="showCartControls(${model.id})" id="add-btn-${model.id}">
                                    Re-order <i class="fa-solid fa-rotate-right"></i>
                                </button>
                            ` : `
                                <button class="btn btn-secondary btn-sm" disabled id="add-btn-${model.id}">
                                    ${model.order ? 'In Progress' : 'No Order Available'}
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function addImageZoomModal() {
    $('body').append(`
        <div class="modal fade" id="imageZoomModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-fullscreen">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="imageModalTitle">Image Preview</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center position-relative">
                        <!-- Display model details: Dimension, Jewelry Type, Weight -->
                        <div id="model-details" class="mb-3">
                            <p id="model-info" class="mb-0"></p>
                        </div>
                        <!-- Moved zoom controls to the top -->
                        <div class="zoom-controls mt-3">
                            <button class="btn btn-outline-secondary btn-sm me-2" id="zoomOut">
                                <i class="fa-solid fa-search-minus"></i> Zoom Out
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" id="zoomIn">
                                <i class="fa-solid fa-search-plus"></i> Zoom In
                            </button>
                            <button class="btn btn-outline-secondary btn-sm ms-2" id="resetZoom">
                                <i class="fa-solid fa-arrows-rotate"></i> Reset
                            </button>
                        </div>

                        <div class="zoom-container" style="overflow: auto; width: 100%; height: 80vh; display: flex; justify-content: center; align-items: center;">
                           <img id="zoomImage" src="" alt="Model Preview"
                                style="max-width: 100%; max-height: 75vh; object-fit: contain; transform: scale(1); transition: transform 0.2s;">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

function checkOrderForColor(modelId, selectedColor) {
    // Make sure model ID is properly passed as a number
    modelId = parseInt(modelId);
    
    // Add console logging for debugging
    console.log(`Checking order for model ${modelId} with color ${selectedColor}`);
    
    // Ensure the URL is correct with numeric model ID
    $.ajax({
        url: `/api/client/models/${modelId}/order/`,
        type: 'GET',
        data: { color: selectedColor },
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        success: function (response) {
            console.log('Response:', response);
            if (response.status === 'success' && response.data && response.data.order_exists && response.data.is_delivered) {
                // Order exists AND is delivered
                $(`#add-btn-${modelId}`).prop('disabled', false);
                $(`#add-btn-${modelId}`).removeClass('btn-secondary').addClass('btn-success');
                $(`#add-btn-${modelId}`).html('Re-order <i class="fa-solid fa-rotate-right"></i>');
            } else if (response.status === 'success' && response.data && response.data.order_exists) {
                // Order exists but not delivered
                $(`#add-btn-${modelId}`).prop('disabled', true);
                $(`#add-btn-${modelId}`).removeClass('btn-success').addClass('btn-secondary');
                $(`#add-btn-${modelId}`).text('In Progress');
            } else {
                // No order exists
                $(`#add-btn-${modelId}`).prop('disabled', true);
                $(`#add-btn-${modelId}`).removeClass('btn-success').addClass('btn-secondary');
                $(`#add-btn-${modelId}`).text('No Order for this Color');
            }
        },
        error: function (xhr, status, error) {
            console.error('Error checking order:', xhr.status, xhr.responseText);
            $(`#add-btn-${modelId}`).prop('disabled', true);
            $(`#add-btn-${modelId}`).removeClass('btn-success').addClass('btn-secondary');
            $(`#add-btn-${modelId}`).text('Error Checking Order');
        }
    });
}
// Function to open the image modal
function openImageModal(imageUrl, modelName, jewelryType, weight, length, breadth) {
    $('#imageModalTitle').text(modelName);
    $('#zoomImage').attr('src', imageUrl);
    $('#zoomImage').css('transform', 'scale(1)');

    // Set all info in one line
    $('#model-info').text(`${length}x${breadth} cm | ${jewelryType} | ${weight} gm`);

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('imageZoomModal'));
    modal.show();
}


// Initialize zoom functionality for the image modal
function initializeImageZoom() {
    let scale = 1;
    const scaleStep = 0.25;
    const maxScale = 3;
    const minScale = 0.5;

    const $zoomImage = $('#zoomImage');
    const $zoomContainer = $('.zoom-container');

    // Ensure correct transform origin
    $zoomImage.css('transform-origin', 'top left');

    // Disable default image dragging
    $zoomImage.on('dragstart', function (e) {
        e.preventDefault();
    });

    // Zoom in
    $('#zoomIn').on('click', function () {
        if (scale < maxScale) {
            scale += scaleStep;
            updateZoom();
        }
    });

    // Zoom out
    $('#zoomOut').on('click', function () {
        if (scale > minScale) {
            scale -= scaleStep;
            updateZoom();
        }
    });

    // Reset zoom
    function resetZoom() {
        scale = 1;
        updateZoom();
        $zoomContainer.scrollLeft(0);
        $zoomContainer.scrollTop(0);
    }

    $('#resetZoom').on('click', resetZoom);
    $('#imageZoomModal').on('hidden.bs.modal', resetZoom);

    // Update image zoom scale
    function updateZoom() {
        $zoomImage.css('transform', `scale(${scale})`);
    }

    // Drag-to-scroll logic
    let isDragging = false;
    let startX = 0, startY = 0;
    let scrollLeft = 0, scrollTop = 0;

    $zoomContainer.on('mousedown', function (e) {
        if (scale > 1) {
            isDragging = true;
            $zoomContainer.css('cursor', 'grabbing');
            startX = e.clientX;
            startY = e.clientY;
            scrollLeft = $zoomContainer.scrollLeft();
            scrollTop = $zoomContainer.scrollTop();
            e.preventDefault(); // Prevent image selection
        }
    });

    $(document).on('mousemove', function (e) {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        $zoomContainer.scrollLeft(scrollLeft - dx);
        $zoomContainer.scrollTop(scrollTop - dy);
    });

    $(document).on('mouseup', function () {
        isDragging = false;
        $zoomContainer.css('cursor', scale > 1 ? 'grab' : 'default');
    });

    // Optional: double-click to toggle zoom
    $zoomImage.on('dblclick', function () {
        if (scale === 1) {
            scale = 2;
        } else {
            resetZoom();
            return;
        }
        updateZoom();
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
    let selectedColor = $(`#color-select-${modelId}`).val(); // Get selected color
    let orderId = $(`#color-select-${modelId}`).data('order-id');

    console.log(`Adding model ID ${modelId} to cart with quantity ${qty} and color ${selectedColor}`);

    // Send AJAX request to add item to cart
    $.ajax({
        url: '/add-to-cart/',
        type: 'POST',
        data: {
            'model_id': modelId,
            'quantity': qty,
            'color': selectedColor, // Send color
            'order_id': orderId,
            'csrfmiddlewaretoken': getCsrfToken()
        },
        success: function(response) {
            if (response.status === 'success') {
                $('#response-container').html(`
                    <div class="alert alert-success alert-dismissible fade show" role="alert" id="success-alert">
                        ${response.message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `);

                setTimeout(() => {
                    $('#success-alert').alert('close');
                }, 5000);

                updateCartCount();

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
                $('#cart-count').text(response.total_quantity + ' items');
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
let currentOrderId = null;

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
                    // Store the order_id globally for future use
                    currentOrderId = response.items[0].order_id;

                    cartHtml = `
                        <div class="list-group">
                            ${response.items.map(item => `

                                <div class="list-group-item py-3 mb-3 shadow-sm rounded">
                                    <div class="d-flex align-items-center gap-3">
                                        <img src="${item.image}" alt="${item.model_no}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;">
                                        <div class="flex-grow-1">
                                            <h6 class="mb-1">${item.model_no}</h6>
                                            <small class="text-muted d-block">${item.jewelry_type_name} • ${item.weight}gm</small>
                                            <small class="text-secondary d-block">Color: ${item.color || 'N/A'}</small>
                                            <small class="text-secondary d-none">Order ID: ${item.order_id}</small>
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
                            <button class="btn btn-primary" onclick="proceedToCheckout()">Confirm Order</button>
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
    if (!currentOrderId) {
        showToast('Order ID is missing!', 'error');
        return;
    }

    $.ajax({
        url: '/create-repeated-order/',
        type: 'POST',
        data: JSON.stringify({ order_id: currentOrderId }),
        contentType: 'application/json',
        headers: {
            'X-CSRFToken': getCSRFToken(),
        },
        success: function(response) {
            if (response.status === 'success') {
                showToast('Repeated order created successfully!', 'success');
                
                // Close the modal (if it's open)
                let modalElement = document.getElementById('clientSideModal');
                if (modalElement) {
                    let modal = bootstrap.Offcanvas.getInstance(modalElement);
                    modal.hide();
                }

                // Update cart count
                updateCartCount();
            } else {
                showToast(response.message || 'Failed to create repeated order.', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
            showToast('Something went wrong. Please try again.', 'error');
        }
    });
}


function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

function showToast(message, type = 'info') {
    const toastId = `toast-${Date.now()}`;
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`;
    $('#toast-container').append(toastHTML);
    const toastElement = new bootstrap.Toast(document.getElementById(toastId));
    toastElement.show();
}