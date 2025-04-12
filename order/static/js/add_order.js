$(document).ready(function() {
    // Generate a random 4-digit number
    const orderNumber = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    // Set the generated number as data-item-order for the original order item
    $('#order-item-card').attr('data-item-order', orderNumber);
    
    // Counter to create unique IDs for new items
    let itemCounter = 1;
    
    // Original order item card
    const originalOrderItem = $('#order-item-card');
    
    // Add the mt-4 class to the original card (margin-top: 1.5rem)
    originalOrderItem.addClass('mt-4');
    
    // Handle Add Item button click
    $('#add-item-order').on('click', function() {
        // Increment the counter
        itemCounter++;
        
        // Clone the original order item
        const newItem = originalOrderItem.clone();
        
        // Update IDs and other attributes to make them unique
        newItem.attr('id', 'order-item-card-' + itemCounter);
        newItem.attr('data-item-id', itemCounter);
        // Keep the same order number for all items
        newItem.attr('data-item-order', orderNumber);
        
        // Ensure the new item has proper spacing
        newItem.addClass('mt-4');
        
        // Update IDs of child elements
        newItem.find('#itemType').attr('id', 'itemType_' + itemCounter);
        newItem.find('#model_no').attr('id', 'model_no_' + itemCounter);
        newItem.find('#sameColor').attr('id', 'sameColor_' + itemCounter)
            .attr('checked', true) // Ensure checkbox is checked in the new item
            .next('label').attr('for', 'sameColor_' + itemCounter);
        newItem.find('#model_color').attr('id', 'model_color_' + itemCounter);
        newItem.find('#pieces_1').attr('id', 'pieces_' + itemCounter);
        newItem.find('#mrp').attr('id', 'mrp_' + itemCounter).val('');
        newItem.find('#discount').attr('id', 'discount_' + itemCounter).val('0');
        
        // Clear input values
        newItem.find('input[type="number"]').val('');
        newItem.find('select').val('');
        
        // Set discount back to default 0
        newItem.find('#discount_' + itemCounter).val('0');
        
        // Add the new item after the last order-item
        $('.order-item:last').after(newItem);
        
        // Enable remove functionality for the close button of the new item
        setupCloseButton(newItem);
    });
    
    // Setup close button functionality for the original item
    setupCloseButton(originalOrderItem);
    
    // Function to set up close button functionality
    function setupCloseButton(item) {
        item.find('.btn-close').on('click', function() {
            // Don't remove if it's the only item left
            if ($('.order-item').length > 1) {
                item.remove();
            } else {
                alert('At least one order item must remain.');
            }
        });
    }
    
    // Setup for the "Add Color" button
    $(document).on('click', '.btn-sm.btn-secondary', function() {
        const orderItem = $(this).closest('.order-item');
        const colorRows = orderItem.find('.color-row');
        const lastColorRow = colorRows.last();
        const newColorRow = lastColorRow.clone();
        const newIndex = colorRows.length + 1;
        
        // Update IDs in the new color row
        newColorRow.find('.color-select').attr('id', 'model_color_' + orderItem.attr('data-item-id') + '_' + newIndex).val('');
        newColorRow.find('.pieces-input').attr('id', 'pieces_' + orderItem.attr('data-item-id') + '_' + newIndex).val('');
        
        // Insert after the last color row
        lastColorRow.after(newColorRow);
        
        // Setup the remove color button for the new row
        setupRemoveColorButton(newColorRow);
    });
    
    // Setup for existing remove color buttons
    $('.remove-color').each(function() {
        setupRemoveColorButton($(this).closest('.color-row'));
    });
    
    // Function to set up remove color button functionality
    function setupRemoveColorButton(colorRow) {
        colorRow.find('.remove-color').on('click', function() {
            const parentOrderItem = $(this).closest('.order-item');
            const colorRows = parentOrderItem.find('.color-row');
            
            // Don't remove if it's the only color row
            if (colorRows.length > 1) {
                colorRow.remove();
            } else {
                alert('At least one color row must remain.');
            }
        });
    }
    
    // Handle the "Same Color" checkbox
    $(document).on('change', 'input[id^="sameColor"]', function() {
        const orderItem = $(this).closest('.order-item');
        const colorRows = orderItem.find('.color-row');
        const addColorBtn = orderItem.find('.btn-sm.btn-secondary');
        
        if (this.checked) {
            // If checked, keep only the first color row, hide add button
            if (colorRows.length > 1) {
                colorRows.not(':first').remove();
            }
            addColorBtn.hide();
        } else {
            // If unchecked, show add button
            addColorBtn.show();
        }
    });
    
    // Initialize "Same Color" checkbox state
    $('input[id^="sameColor"]').each(function() {
        const orderItem = $(this).closest('.order-item');
        const addColorBtn = orderItem.find('.btn-sm.btn-secondary');
        
        if (this.checked) {
            addColorBtn.hide();
        } else {
            addColorBtn.show();
        }
    });

    function submitOrder() {
        // Create an array to hold all order items
        const orderItems = [];
    
        // Loop through each order item card
        $('.order-item').each(function() {
            const orderItem = $(this);
            const itemData = {
                model: orderItem.find('select[name="model"]').val(),
                color: orderItem.find('.color-select').val(),
                no_of_pieces: orderItem.find('.pieces-input').val(),
                mrp: orderItem.find('input[name="mrp"]').val(),
                discount: orderItem.find('input[name="discount"]').val()
            };
    
            // Push the item data to the orderItems array
            orderItems.push(itemData);
        });

        const orderItemOrder = $('.card.order-item').data('item-order');
    
        // Gather customer details
        const customerDetails = {
            client_name: $('#createUsername').val(),
            contact_no: $('#createFullName').val(),
            address: $('#customerAddress').val(),
            date_of_order: $('#dateOfOrder').val(),
            est_delivery_date: $('#estDeliveryDate').val(),
            order_number: orderNumber, // Include the generated order number
            item_order: orderItemOrder,
            items: orderItems // Include the order items in the request
        };
    
        // Make the API call to create the order
        $.ajax({
            url: '/orders/add/', // Your API endpoint
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(customerDetails),
            success: function(response) {
                // Update for multiple orders
                if (response.orders && response.orders.length > 0) {
                    let message = 'Order(s) created successfully!\n';
                    response.orders.forEach(function(order) {
                        message += `Order ID: ${order.order_id}, Unique ID: ${order.order_unique_id}\n`;
                    });
                    alert(message);
                    window.location.href = '/order_list';
                } else {
                    alert('Order created but no order details returned.');
                }
            },
        });
    }
    
    // Attach the submitOrder function to the submit button
    $('#submitOrder').on('click', function(event) {
        event.preventDefault(); // Prevent the default form submission
        submitOrder(); // Call the function to submit the order
    });

    $('#itemType').change(function() {
        const selectedTypeId = $(this).val();
        const modelNoSelect = $('#model_no');
        
        // Clear the current options in the model dropdown
        modelNoSelect.empty().append('<option value="">Select Model</option>');
        
        // If a valid type is selected, fetch the models
        if (selectedTypeId) {
            // Show loading indication (optional)
            modelNoSelect.prop('disabled', true);
            
            // Fetch models for the selected jewelry type using your existing endpoint
            $.ajax({
                url: `/get-models-by-type/${selectedTypeId}/`,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    // Populate the models dropdown
                    $.each(data.models, function(index, model) {
                        const option = $('<option></option>')
                            .val(model.id)
                            .text(model.model_no)
                            .data('length', model.length)
                            .data('breadth', model.breadth)
                            .data('weight', model.weight)
                            .data('imageUrl', model.model_img);
                        
                        modelNoSelect.append(option);
                    });
                    
                    // Enable the select
                    modelNoSelect.prop('disabled', false);
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching models:', error);
                    modelNoSelect.prop('disabled', false);
                }
            });
        }
    });

    $('#model_no').change(function() {
        const selectedModelId = $(this).val();
        const colorSelect = $('#model_color');
        
        // Clear the current options in the color dropdown
        colorSelect.empty().append('<option value="">Select Color</option>');
        
        // If a valid model is selected, fetch the colors
        if (selectedModelId) {
            // Show loading indication (optional)
            colorSelect.prop('disabled', true);
            
            // Fetch colors for the selected model
            $.ajax({
                url: `/get-model-color/${selectedModelId}/`,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    // Populate the colors dropdown
                    $.each(data.colors, function(index, color) {
                        const option = $('<option></option>')
                            .val(color.id)
                            .text(color.name);
                        
                        colorSelect.append(option);
                    });
                    
                    // Enable the select
                    colorSelect.prop('disabled', false);
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching colors:', error);
                    colorSelect.prop('disabled', false);
                }
            });
        }
    });
});