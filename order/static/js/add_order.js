$(document).ready(function () {
    let allModels = []; // Store all models for client-side filtering
    let filteredModels = []; // Store filtered models
    let currentPage = 1;
    const itemsPerPage = 8;

    // When client changes, fetch models and cart count
    $('#clientSelect').change(function () {
        let clientId = $(this).val();
        $('#modelsContainer').empty();
        $('#paginationContainer').empty();
        $('#searchResultCount').addClass('d-none');
        
        // Clear search
        $('#searchInput').val('');
        currentPage = 1;

        // Show or hide Go to Cart button
        if (clientId) {
            $('#goToCartBtn')
                .removeClass('d-none')
                .attr('href', `/cart/${clientId}/`);
        } else {
            $('#goToCartBtn')
                .addClass('d-none')
                .attr('href', '#');
            // reset badge
            $('#cartItemCount').text('0');
            allModels = [];
            filteredModels = [];
            return;
        }

        // Fetch current cart item count
        $.ajax({
            url: `/cart/count/${clientId}/`,
            method: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: function (response) {
                if (response.status === 'success') {
                    $('#cartItemCount').text(response.total_quantity);
                } else {
                    $('#cartItemCount').text('0');
                }
            },
            error: function () {
                $('#cartItemCount').text('0');
            }
        });

        // Fetch models
        $.get(`/client/${clientId}/models/`, function (data) {
            allModels = data.models;
            filteredModels = [...allModels]; // Initially show all models
            displayModels();
        });
    });

    // Search functionality
    $('#searchInput').on('input', function() {
        const searchTerm = $(this).val().toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredModels = [...allModels];
        } else {
            filteredModels = allModels.filter(model => {
                return (
                    model.model_no.toLowerCase().includes(searchTerm) ||
                    model.status_name.toLowerCase().includes(searchTerm) ||
                    model.weight.toString().toLowerCase().includes(searchTerm) ||
                    model.colors.some(color => color.color.toLowerCase().includes(searchTerm))
                );
            });
        }
        
        currentPage = 1; // Reset to first page
        displayModels();
    });

    // Clear search
    $('#clearSearch').click(function() {
        $('#searchInput').val('');
        filteredModels = [...allModels];
        currentPage = 1;
        displayModels();
    });

    // Function to display models with pagination
    function displayModels() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const modelsToShow = filteredModels.slice(startIndex, endIndex);
        
        // Update search result count
        updateSearchResultCount();
        
        // Clear container
        $('#modelsContainer').empty();
        
        if (modelsToShow.length === 0) {
            $('#modelsContainer').html(`
                <div class="col-12 text-center py-5">
                    <i class="fa fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No models found</h5>
                    <p class="text-muted">Try adjusting your search criteria</p>
                </div>
            `);
            $('#paginationContainer').empty();
            return;
        }
        
        // Display models
        modelsToShow.forEach(function (model) {
            let card = `
                <div class="col-md-3 mb-3">
                    <div class="card h-100 shadow-sm" id="card-${model.id}">
                        <div class="position-relative">
                            <span class="badge bg-secondary position-absolute top-0 start-0 m-2">${model.status_name}</span>
                            <span class="badge bg-dark position-absolute top-0 end-0 m-2">${model.length}X${model.breadth}</span>
                            <img src="${model.image}" class="card-img-top" alt="${model.model_no}" style="height: 180px; object-fit: cover;">
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
                                            <button class="btn btn-success btn-sm ms-2 cart-btn" type="button">
                                                <i class="fa fa-shopping-cart"></i>
                                            </button>
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
        
        // Display pagination
        displayPagination();
    }

    // Function to update search result count
    function updateSearchResultCount() {
        const searchTerm = $('#searchInput').val().trim();
        const resultCount = $('#searchResultCount');
        
        if (searchTerm !== '') {
            resultCount.removeClass('d-none').html(`
                Found <strong>${filteredModels.length}</strong> model(s) matching "<em>${searchTerm}</em>"
            `);
        } else {
            resultCount.addClass('d-none');
        }
    }

    // Function to display pagination
    function displayPagination() {
        const totalPages = Math.ceil(filteredModels.length / itemsPerPage);
        
        if (totalPages <= 1) {
            $('#paginationContainer').empty();
            return;
        }
        
        let paginationHtml = '<nav aria-label="Page navigation"><ul class="pagination justify-content-center">';
        
        // Previous button
        paginationHtml += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
            </li>
        `;
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page and ellipsis
        if (startPage > 1) {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Last page and ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
        }
        
        // Next button
        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
            </li>
        `;
        
        paginationHtml += '</ul></nav>';
        
        $('#paginationContainer').html(paginationHtml);
    }

    // Handle pagination clicks
    $(document).on('click', '.page-link', function(e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        
        if (page && page !== currentPage && page >= 1 && page <= Math.ceil(filteredModels.length / itemsPerPage)) {
            currentPage = page;
            displayModels();
            
            // Scroll to top of models container
            $('html, body').animate({
                scrollTop: $('#modelsContainer').offset().top - 100
            }, 500);
        }
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

    // Handle Add to Cart button inside the counter-section
    $('#modelsContainer').on('click', '.cart-btn', function () {
        let modelId = $(this).closest('.card').attr('id').split('-')[1];
        let colorId = $(`.color-select[data-model-id="${modelId}"]`).val();
        let quantity = parseInt($(`.quantity-input[data-model-id="${modelId}"]`).text()) || 1;
        
        // Get the client ID from the select dropdown
        let clientId = $('#clientSelect').val();
        
        if (!clientId) {
            Swal.fire('Error', 'Please select a client first', 'warning');
            return;
        }

        $.ajax({
            url: '/cart/add/',
            method: 'POST',
            headers: { 'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val() },
            contentType: 'application/json',
            data: JSON.stringify({ 
                model_id: modelId, 
                color_id: colorId, 
                quantity: quantity,
                client_id: clientId
            }),
            success: function (response) {
                if (response.status === 'success') {
                    Swal.fire({ icon: 'success', title: 'Added to Cart', timer: 1500, showConfirmButton: false });
                    
                    // Update the cart badge with the total quantity from the response
                    if (response.total_quantity !== undefined) {
                        $('#cartItemCount').text(response.total_quantity);
                    } else {
                        // Fallback to the old method if total_quantity is not provided
                        let count = parseInt($('#cartItemCount').text()) || 0;
                        $('#cartItemCount').text(count + quantity);
                    }
                } else {
                    Swal.fire('Error', response.message || 'Could not add to cart.', 'error');
                }
            },
            error: function () {
                Swal.fire('Error', 'Server error while adding to cart.', 'error');
            }
        });
    });

    // Submit Order
    $('#submitOrderBtn').click(function () {
        let clientId = $('#clientSelect').val();
        if (!clientId) {
            Swal.fire({ icon: 'warning', title: 'Missing Client', text: 'Please select a client.' });
            return;
        }

        let orders = [];
        $('.model-check:checked').each(function () {
            let modelId = $(this).data('model-id');
            let colorId = $(`.color-select[data-model-id="${modelId}"]`).val();
            let quantity = $(`.quantity-input[data-model-id="${modelId}"]`).text();
            orders.push({ model_id: modelId, color_id: colorId, quantity: quantity });
        });

        if (orders.length === 0) {
            Swal.fire({ icon: 'warning', title: 'No Models Selected', text: 'Please select at least one model.' });
            return;
        }

        $.ajax({
            url: '/orders/create/',
            method: 'POST',
            headers: { 'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val() },
            contentType: 'application/json',
            data: JSON.stringify({ client_id: clientId, orders: orders }),
            success: function (response) {
                Swal.fire({ icon: 'success', title: 'Order Created', text: response.message || 'Redirecting...', showConfirmButton: false, timer: 2000 });
                setTimeout(() => { window.location.href = '/order_list'; }, 2000);
            },
            error: function () {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Error creating orders.' });
            }
        });
    });

    // FIXED: Cart quantity update - Consistent data attribute usage
    $(document).on('click', '.cart-quantity-btn', function () {
        const cartItemId = $(this).data('cart-item-id');
        const action = $(this).data('action');
        const clientId = $('#clientIdHidden').val();
        const quantitySpan = $(`#cart-quantity-${cartItemId}`);
        const currentQuantity = parseInt(quantitySpan.text());
        
        // Optimistic UI update
        if (action === 'increase') {
            quantitySpan.text(currentQuantity + 1);
        } else if (action === 'decrease' && currentQuantity > 1) {
            quantitySpan.text(currentQuantity - 1);
        }

        $.ajax({
            url: `/api/cart/update_quantity/`,
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            contentType: 'application/json',
            data: JSON.stringify({ item_id: cartItemId, action: action }),
            success: function (response) {
                if (response.success) {
                    if (response.quantity) {
                        quantitySpan.text(response.quantity);
                    }
                    updateCartCount(clientId);
                } else {
                    quantitySpan.text(currentQuantity);
                    Swal.fire('Error', response.message || 'Could not update quantity.', 'error');
                }
            },
            error: function() {
                quantitySpan.text(currentQuantity);
                Swal.fire('Error', 'Server error while updating quantity.', 'error');
            }
        });
    });

    // FIXED: Delete cart item - Use correct data attribute
    $(document).on('click', '.delete-cart-item-btn', function () {
        const cartItemId = $(this).data('cart-item-id');
        const clientId = $('#clientIdHidden').val();
        const itemElement = $(this).closest('.list-group-item');
        
        if (itemElement.length === 0) {
            console.error('Could not find parent element to remove');
            return;
        }
        
        itemElement.fadeOut(300);

        $.ajax({
            url: `/api/cart/delete/${cartItemId}/`,
            method: 'POST',
            data: { csrfmiddlewaretoken: getCookie('csrftoken') },
            success: function(response) {
                itemElement.remove();
                
                const remainingItems = $('#cartItemsContainer .list-group-item:visible').length;
                
                if (remainingItems === 0) {
                    $('#cartItemsContainer').html('<p class="text-center">Your cart is empty.</p>');
                    $('#proceedToOrderBtn').remove();
                }
                
                updateCartCount(clientId);
            },
            error: function() {
                itemElement.fadeIn(300);
                Swal.fire('Error', 'Failed to remove item from cart.', 'error');
            }
        });
    });

    // Improved goToCartBtn click handler
    $('#goToCartBtn').click(function (e) {
        e.preventDefault();
        let clientId = $('#clientSelect').val();
        
        $('.offcanvas').each(function() {
            const offcanvasInstance = bootstrap.Offcanvas.getInstance(this);
            if (offcanvasInstance) {
                offcanvasInstance.hide();
            }
        });
        
        $('#clientSideModalTemp, #clientSideModal').remove();
        $('.modal-backdrop, .offcanvas-backdrop').remove();
        $('body').removeClass('modal-open offcanvas-open');
        
        $.ajax({
            url: `/ajax/cart/${clientId}/`,
            method: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            beforeSend: function () {
                $('body').append(`
                    <div class="offcanvas offcanvas-end" tabindex="-1" id="clientSideModalTemp">
                        <div class="offcanvas-header">
                            <h5 class="offcanvas-title">Loading...</h5>
                            <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas"></button>
                        </div>
                        <div class="offcanvas-body text-center">
                            <div class="spinner-border text-primary" role="status"></div>
                        </div>
                    </div>
                `);
                
                const tempModal = new bootstrap.Offcanvas(document.getElementById('clientSideModalTemp'));
                tempModal.show();
            },
            success: function (response) {
                const tempModalEl = document.getElementById('clientSideModalTemp');
                const tempModalInstance = bootstrap.Offcanvas.getInstance(tempModalEl);
                if (tempModalInstance) {
                    tempModalInstance.hide();
                }
                $('#clientSideModalTemp').remove();
                $('.offcanvas-backdrop').remove();
                
                $('body').append(response.html);
                const modal = new bootstrap.Offcanvas(document.getElementById('clientSideModal'));
                modal.show();

                $.get(`/api/cart/${clientId}/`, function (cartData) {
                    let cartHtml = '';
                    if (cartData.items && cartData.items.length > 0) {
                        cartData.items.forEach(item => {
                            cartHtml += `
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
                                                <button class="btn btn-outline-secondary cart-quantity-btn" type="button" 
                                                        data-cart-item-id="${item.id}" data-action="decrease">-</button>
                                                <span class="input-group-text bg-light" id="cart-quantity-${item.id}">${item.quantity}</span>
                                                <button class="btn btn-outline-secondary cart-quantity-btn" type="button" 
                                                        data-cart-item-id="${item.id}" data-action="increase">+</button>
                                            </div>
                                            <button class="btn btn-outline-danger btn-sm delete-cart-item-btn" data-cart-item-id="${item.id}">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });

                        cartHtml += `
                            <button class="btn btn-success w-100 mt-3" id="proceedToOrderBtn">
                                Proceed to Order
                            </button>
                        `;
                    } else {
                        cartHtml = `<p class="text-center">Your cart is empty.</p>`;
                    }

                    $('#modal-content-body').html(`
                        <input type="hidden" name="client_id" id="clientIdHidden" value="${clientId}">
                        <div id="cartItemsContainer">${cartHtml}</div>
                    `);
                });
            },
            error: function () {
                const tempModalEl = document.getElementById('clientSideModalTemp');
                const tempModalInstance = bootstrap.Offcanvas.getInstance(tempModalEl);
                if (tempModalInstance) {
                    tempModalInstance.hide();
                }
                $('#clientSideModalTemp').remove();
                $('.offcanvas-backdrop').remove();
                
                Swal.fire('Error', 'Could not load the cart.', 'error');
            }
        });
    });

    // Proceed to Order
    $(document).on('click', '#proceedToOrderBtn', function () {
        const clientId = $('#clientIdHidden').val();

        $.ajax({
            url: '/api/cart/proceed/',
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            contentType: 'application/json',
            data: JSON.stringify({ client_id: clientId }),
            success: function (response) {
                if (response.success) {
                    Swal.fire('Success', 'Order placed successfully!', 'success');
                    $('#goToCartBtn').trigger('click');
                    updateCartCount(clientId);
                }
            }
        });
    });

    // Update cart item count
    function updateCartCount(clientId) {
        $.ajax({
            url: `/cart/count/${clientId}/`,
            method: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: function (response) {
                if (response.status === 'success') {
                    $('#cartItemCount').text(response.total_quantity);
                } else {
                    $.get(`/api/cart/${clientId}/`, function (response) {
                        const totalItems = response.items ? response.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) : 0;
                        $('#cartItemCount').text(totalItems);
                    });
                }
            },
            error: function () {
                $.get(`/api/cart/${clientId}/`, function (response) {
                    const totalItems = response.items ? response.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) : 0;
                    $('#cartItemCount').text(totalItems);
                });
            }
        });
    }

    // CSRF token helper
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = $.trim(cookies[i]);
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});