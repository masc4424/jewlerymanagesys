$(document).ready(function() {
    // Make sure the table exists in the DOM before initializing
    if (!$('#repeatedOrdersTable').length) {
        console.error('Table #repeatedOrdersTable not found in DOM');
        return;
    }
    
    // Add image viewer modal to the DOM
    $('body').append(`
        <div class="modal fade" id="imageViewerModal" tabindex="-1" aria-labelledby="imageViewerModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="imageViewerModalLabel">Model Image Viewer</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body d-flex flex-column align-items-center justify-content-center">
                        <div class="image-info mb-2 text-center">
                            <span class="badge bg-info me-2" id="imageColorInfo">Color: N/A</span>
                            <span class="badge bg-secondary" id="imageDimensionsInfo">Dimensions: Calculating...</span>
                        </div>
                        <div class="controls mb-2">
                            <button class="btn btn-primary zoom-in me-2"><i class="fas fa-search-plus"></i> Zoom In</button>
                            <button class="btn btn-primary zoom-out me-2"><i class="fas fa-search-minus"></i> Zoom Out</button>
                            <button class="btn btn-secondary reset-zoom"><i class="fas fa-undo"></i> Reset</button>
                        </div>
                        <div class="image-container position-relative" style="overflow: hidden; height: 75vh; width: 90%; display: flex; justify-content: center; align-items: center;">
                            <img id="zoomableImage" src="" alt="Model Image" style="transform-origin: center; transition: transform 0.3s ease; max-height: 100%; max-width: 100%; cursor: move;">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    try {
        // Initialize DataTable with proper error handling
        var table = $('#repeatedOrdersTable').DataTable({
            ajax: {
                url: '/api/repeated-orders/',
                dataSrc: 'data',
                error: function(xhr, error, thrown) {
                    console.error('Ajax error:', error, thrown);
                }
            },
            columns: [
                { data: null, render: function(data, type, row, meta) {
                    return meta.row + 1; // Sr. No. column (auto-incremented)
                }},
                { data: "client_name" }, // Client column
                { data: null, render: function(data, type, row) {
                    // Model column with image - made clickable with color data attribute
                    return `
                        <div class="d-flex align-items-center">
                            <img src="${row.model_img}" alt="${row.model_no}" class="rounded-circle model-thumbnail-img me-2 clickable-image" 
                                width="40" height="40" data-img-src="${row.model_img}" 
                                data-model-no="${row.model_no}" data-color="${row.color_name || row.color || 'N/A'}"
                                data-length="${row.lenght || row.length || 'N/A'}" data-breadth="${row.breadth || 'N/A'}"
                                style="cursor: pointer;">
                            <span>${row.model_no}</span>
                        </div>
                    `;
                }},
                {
                    data: "delivered",
                    render: function(data, type, row) {
                        if (data) {
                            return '<span class="badge bg-success">Delivered</span>';
                        } else {
                            return '<span class="badge bg-warning text-dark">Not Delivered</span>';
                        }
                    }
                }, // Delivery Status column
                { data: null, render: function(data, type, row) {
                    // New Model Status column
                    // Use status_id to determine if status is set
                    if (row.status_id === null) {
                        return '<span class="badge bg-warning">Not Set</span>';
                    } else {
                        return '<span class="badge bg-success">' + row.status_name + '</span>';
                    }
                }},
                { data: null, render: function(data, type, row) {
                    return `${data.quantity} / ${data.color_name}`; // Qty / Colour combined
                }},
                { data: "weight", render: function(data) {
                    return data ? data + ' g' : ''; // Weight column with 'g' suffix
                }}, 
                { data: null, render: function(data, type, row) {
                    // Action buttons
                    return `
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-primary update-status" 
                                data-id="${data.id}" data-bs-toggle="modal" data-bs-target="#updateStatusModal">
                                Update Status
                            </button>
                        </div>
                    `;
                }}
            ],
            dom: 'Bfrtip',
            buttons: [
                'copy', 'excel', 'pdf', 'print'
            ],
            // Add responsive features
            responsive: true,
            // Add proper initialization options
            initComplete: function() {
                console.log('DataTable initialized successfully');
            }
        });
        
        // Image viewer functionality
        let currentScale = 1;
        const scaleStep = 0.2;
        const minScale = 0.5;
        const maxScale = 3;
        
        // Variables for drag functionality
        let isDragging = false;
        let startX, startY, translateX = 0, translateY = 0;
        let lastTranslateX = 0, lastTranslateY = 0;
        
        // Handle clicking on images in the table
        $('#repeatedOrdersTable').on('click', '.clickable-image', function() {
            const imgSrc = $(this).data('img-src');
            const modelNo = $(this).data('model-no');
            const color = $(this).data('color');
            const length = $(this).data('length');
            const breadth = $(this).data('breadth');
            
            // Update modal with image and title
            $('#zoomableImage').attr('src', imgSrc);
            $('#imageViewerModalLabel').text(`Model ${modelNo}`);
            
            // Reset zoom and drag to default state
            resetZoom();
            
            // Update color information
            $('#imageColorInfo').text(`Color: ${color}`);
            
            // Update dimensions information using the length and breadth
            $('#imageDimensionsInfo').text(`Dimensions: ${length} × ${breadth} cm`);
            
            // Open the modal
            const imageModal = new bootstrap.Modal(document.getElementById('imageViewerModal'));
            imageModal.show();
        });
        
        // Zoom in functionality
        $('.zoom-in').click(function() {
            if (currentScale < maxScale) {
                currentScale += scaleStep;
                updateZoom();
            }
        });
        
        // Zoom out functionality
        $('.zoom-out').click(function() {
            if (currentScale > minScale) {
                currentScale -= scaleStep;
                updateZoom();
                
                // If zooming out to 1 or less, reset position
                if (currentScale <= 1) {
                    resetPosition();
                }
            }
        });
        
        // Reset zoom functionality
        $('.reset-zoom').click(function() {
            resetZoom();
        });
        
        // Update zoom level and apply any existing translation
        function updateZoom() {
            $('#zoomableImage').css('transform', `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`);
            
            // Toggle draggable cursor based on zoom level
            if (currentScale > 1) {
                $('#zoomableImage').css('cursor', 'move');
            } else {
                $('#zoomableImage').css('cursor', 'default');
                // Only reset position if we're not already in resetPosition function
                if (translateX !== 0 || translateY !== 0) {
                    translateX = 0;
                    translateY = 0;
                    lastTranslateX = 0;
                    lastTranslateY = 0;
                    // Apply the transform directly here instead of calling updateZoom again
                    $('#zoomableImage').css('transform', `scale(${currentScale}) translate(0px, 0px)`);
                }
            }
        }
        
        // Reset position (no translation)
        function resetPosition() {
            translateX = 0;
            translateY = 0;
            lastTranslateX = 0;
            lastTranslateY = 0;
            // Apply the transform directly here instead of calling updateZoom
            $('#zoomableImage').css('transform', `scale(${currentScale}) translate(0px, 0px)`);
        }
        
        // Reset zoom to default (1)
        function resetZoom() {
            currentScale = 1;
            resetPosition();
        }
        
        // Drag functionality for the image
        $('#zoomableImage').on('mousedown', function(e) {
            if (currentScale <= 1) return; // Only allow dragging when zoomed in
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // Disable transition during drag for smoother movement
            $(this).css('transition', 'none');
            
            e.preventDefault();
        });
        
        $(document).on('mousemove', function(e) {
            if (!isDragging) return;
            
            // Calculate how much the mouse has moved
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Update the translation values
            translateX = lastTranslateX + dx / currentScale;
            translateY = lastTranslateY + dy / currentScale;
            
            // Apply the new transformation
            $('#zoomableImage').css('transform', `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`);
        });
        
        $(document).on('mouseup mouseleave', function() {
            if (!isDragging) return;
            
            isDragging = false;
            lastTranslateX = translateX;
            lastTranslateY = translateY;
            
            // Re-enable transition
            $('#zoomableImage').css('transition', 'transform 0.3s ease');
        });
        
        // When modal closes, reset zoom
        $('#imageViewerModal').on('hidden.bs.modal', function() {
            resetZoom();
        });
        
        // Load statuses when modal is opened
        $('#updateStatusModal').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget);
            var orderId = button.data('id');
            $('#order_id').val(orderId);
            
            // Fetch order details
            $.ajax({
                url: `/api/repeated-orders/${orderId}/`,
                type: 'GET',
                success: function(response) {
                    // Populate the form
                    $('#status_id').val(response.status_id);
                    $('#quantity_delivered').val(response.quantity_delivered);
                    $('#est_delivery_date').val(response.est_delivery_date);
                    $('#delivered').prop('checked', response.delivered);
                    
                    // Load statuses for dropdown
                    loadStatuses(response.status_id);
                },
                error: function(xhr) {
                    console.error('Error fetching order details', xhr);
                    alert('Error fetching order details');
                }
            });
        });
        
        // Function to load statuses for dropdown
        function loadStatuses(selectedStatusId) {
            $.ajax({
                url: '/api/model-statuses/',
                type: 'GET',
                success: function(response) {
                    var dropdown = $('#status_id');
                    dropdown.empty();
                    
                    $.each(response.data, function(i, status) {
                        dropdown.append($('<option></option>')
                            .attr('value', status.id)
                            .text(status.name));
                    });
                    
                    if (selectedStatusId) {
                        dropdown.val(selectedStatusId);
                    }
                },
                error: function(xhr) {
                    console.error('Error loading statuses', xhr);
                }
            });
        }
        
        // Handle save button click
        $('#saveStatusBtn').click(function() {
            var formData = {
                order_id: $('#order_id').val(),
                status_id: $('#status_id').val(),
                quantity_delivered: $('#quantity_delivered').val(),
                est_delivery_date: $('#est_delivery_date').val(),
                delivered: $('#delivered').is(':checked')
            };
            
            $.ajax({
                url: '/api/update-repeated-order-status/',
                type: 'POST',
                data: JSON.stringify(formData),
                contentType: 'application/json',
                headers: {
                    'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val()
                },
                success: function(response) {
                    $('#updateStatusModal').modal('hide');
                    table.ajax.reload();
                    // Show success message
                    alert('Status updated successfully');
                },
                error: function(xhr) {
                    console.error('Error updating status', xhr);
                    alert('Error updating status: ' + JSON.parse(xhr.responseText).message);
                }
            });
        });
    } catch(error) {
        console.error('Error initializing DataTable:', error);
    }
});