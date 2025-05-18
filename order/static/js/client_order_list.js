$(document).ready(function() {
    const csrfToken = $('input[name="csrfmiddlewaretoken"]').val();
    
    // Define DataTable common settings
    const commonSettings = {
        processing: true,
        dom: 'Bfrtip',
        buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        responsive: true,
        autoWidth: false,
        order: [[5, 'desc']], // Order by date descending
        columns: [
            { 
                title: 'Model', 
                data: null,
                render: function(data, type, row) {
                    return `<div class="d-flex align-items-center">
                        ${row.model_img ? 
                          `<img src="${row.model_img}" alt="Model" class="me-2 rounded table-img model-image-clickable" data-img-src="${row.model_img}">` : 
                          '<span class="badge bg-secondary me-2">No Image</span>'}
                        <strong>${row.model_no}</strong>
                    </div>`;
                }
            },
            { 
                title: 'Delivery Status', 
                data: 'status',
                render: function(data) {
                    const statusMap = {
                        'Pending':'warning',
                        'CADE': 'secondary',
                        'WAX SETTING': 'info',
                        'CASTING': 'primary',
                        'FILLING': 'warning',
                        'POLISHING': 'secondary',
                        'SETTING': 'info',
                        'PLATING': 'primary',
                        'QC-POST PLATING': 'warning',
                        'READY TO DELIVER': 'success',
                        'RE SETTING': 'secondary',
                        'FINISHED': 'success',
                        'RETURNED': 'warning',
                        'DEFECTIVE': 'danger',
                        'Delivered': 'success'
                    };

                    if (!data) {
                        return `<span class="badge bg-warning">In Progress</span>`;
                    }

                    const badgeClass = statusMap[data] || 'light';
                    return `<span class="badge bg-${badgeClass}">${data}</span>`;
                }
            },
            { title: 'Jewelry Type', data: 'jewelry_type' },
            { title: 'Quantity', data: 'quantity' },
            { title: 'Color', data: 'color' },
            { 
                title: 'Order Date', 
                data: 'order_date',
                render: data => new Date(data).toLocaleDateString()
            },
            { 
                title: 'Est. Delivery', 
                data: 'est_delivery_date',
                render: data => data ? new Date(data).toLocaleDateString() : 'Not set'
            },
            { title: 'Weight/Set', data: 'weight' },
            {
                title: 'Actions',
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    if (row.is_repeated) {
                        return `
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li><button class="dropdown-item return-order" data-id="${row.id}" data-repeated="true">Return</button></li>
                                    <li><button class="dropdown-item cancel-order" data-id="${row.id}">Cancel Order</button></li>
                                </ul>
                            </div>`;
                    } else if (!row.is_approved) {
                        return `
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li><button class="dropdown-item allow-order" data-id="${row.id}">Approve</button></li>
                                    <li><button class="dropdown-item deny-order" data-id="${row.id}">Deny</button></li>
                                    <li><button class="dropdown-item return-order" data-id="${row.id}" data-repeated="false">Return</button></li>
                                </ul>
                            </div>`;
                    } else {
                        return `
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li><button class="dropdown-item return-order" data-id="${row.id}" data-repeated="false">Return</button></li>
                                </ul>
                            </div>`;
                    }
                }
            }
        ]
    };

    // Initialize My Orders DataTable
    const myOrdersTable = $('#myOrdersTable').DataTable({
        ...commonSettings,
        ajax: {
            url: '/api/client/orders/',
            dataSrc: function(json) {
                // Filter out repeated orders and returned/defective orders
                return json.data.filter(order => !order.is_repeated && 
                    !['RETURNED', 'DEFECTIVE'].includes(order.status));
            }
        }
    });

    // Initialize Reorders DataTable
    const reordersTable = $('#reordersTable').DataTable({
        ...commonSettings,
        ajax: {
            url: '/api/client/orders/',
            dataSrc: function(json) {
                // Filter only repeated orders
                return json.data.filter(order => order.is_repeated && 
                    !['RETURNED', 'DEFECTIVE'].includes(order.status));
            }
        }
    });

    // Initialize Returns DataTable
    const returnsTable = $('#returnsTable').DataTable({
        ...commonSettings,
        ajax: {
            url: '/api/client/orders/',
            dataSrc: function(json) {
                // Filter orders with status RETURNED or DEFECTIVE
                return json.data.filter(order => 
                    ['RETURNED', 'DEFECTIVE'].includes(order.status));
            }
        },
        columns: [
            { 
                title: 'Model', 
                data: null,
                render: function(data, type, row) {
                    return `<div class="d-flex align-items-center">
                        ${row.model_img ? 
                          `<img src="${row.model_img}" alt="Model" class="me-2 rounded table-img model-image-clickable" data-img-src="${row.model_img}">` : 
                          '<span class="badge bg-secondary me-2">No Image</span>'}
                        <strong>${row.model_no}</strong>
                    </div>`;
                }
            },
            { 
                title: 'Status', 
                data: 'status',
                render: function(data) {
                    const badgeClass = data === 'DEFECTIVE' ? 'danger' : 'warning';
                    return `<span class="badge bg-${badgeClass}">${data}</span>`;
                }
            },
            { title: 'Jewelry Type', data: 'jewelry_type' },
            { title: 'Quantity', data: 'quantity' },
            { title: 'Color', data: 'color' },
            { 
                title: 'Order Date', 
                data: 'order_date',
                render: data => new Date(data).toLocaleDateString()
            },
            { 
                title: 'Return Date', 
                data: 'return_date',
                render: data => data ? new Date(data).toLocaleDateString() : 'N/A'
            },
            { 
                title: 'Affected Pieces', 
                data: 'return_pieces',
                render: data => data || 'N/A'
            },
            {
                title: 'Details',
                data: null,
                orderable: false,
                render: function(data, type, row) {
                    return `<button class="btn btn-sm btn-outline-info detail-btn">Details</button>`;
                }
            }
        ]
    });

    // Add image modal HTML to the document
    if ($('#imageModal').length === 0) {
        $('body').append(`
            <div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-fullscreen">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="imageModalLabel">Model Image</h5>
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
                            <div class="zoom-container" style="overflow: hidden; position: relative; height: 70vh; border: 1px solid #ddd;">
                                <div class="image-wrapper" style="position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
                                    <img id="modalImage" src="" alt="Model Preview" 
                                        style="max-width: 100%; max-height: 100%; transform-origin: center; transition: transform 0.2s; display: block;">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        initializeImageZoom();
    }

    // Style for clickable images
    $('<style>')
        .text('.model-image-clickable { cursor: pointer; transition: transform 0.2s; } .model-image-clickable:hover { transform: scale(1.1); }')
        .appendTo('head');

    // Handle click on model images in any table
    $(document).on('click', '.model-image-clickable', function(e) {
        e.stopPropagation(); // Prevent row click events
        const imgSrc = $(this).data('img-src');
        $('#modalImage').attr('src', imgSrc);
        
        // Get model number from the table cell
        const modelNo = $(this).closest('div').find('strong').text();
        $('#imageModalLabel').text(`Model: ${modelNo}`);
        
        const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
        imageModal.show();
    });

    // My Orders Tab Filters
    $('#my-orders .filter-btn').on('click', function() {
        const filterValue = $(this).data('filter');
        
        // Update active button
        $('#my-orders .filter-btn').removeClass('active');
        $(this).addClass('active');
        
        $.fn.dataTable.ext.search.pop();
        
        if (filterValue === 'approved') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = myOrdersTable.row(dataIndex).data();
                    return order.is_approved === true;
                }
            );
        } else if (filterValue === 'not-approved') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = myOrdersTable.row(dataIndex).data();
                    return order.is_approved === false;
                }
            );
        }
        
        myOrdersTable.draw();
    });

    // Reorders Tab Filters
    $('#reorders .filter-btn').on('click', function() {
        const filterValue = $(this).data('filter');
        
        // Update active button
        $('#reorders .filter-btn').removeClass('active');
        $(this).addClass('active');
        
        $.fn.dataTable.ext.search.pop();
        
        if (filterValue !== 'all-reorders') {
            const status = filterValue.replace('status-', '').replace(/-/g, ' ').toUpperCase();
            
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = reordersTable.row(dataIndex).data();
                    return order.status === status;
                }
            );
        }
        
        reordersTable.draw();
    });

    // Returns Tab Filters
    $('#returns .filter-btn').on('click', function() {
        const filterValue = $(this).data('filter');
        
        // Update active button
        $('#returns .filter-btn').removeClass('active');
        $(this).addClass('active');
        
        $.fn.dataTable.ext.search.pop();
        
        if (filterValue === 'defective') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = returnsTable.row(dataIndex).data();
                    return order.status === 'DEFECTIVE';
                }
            );
        } else if (filterValue === 'returned') {
            $.fn.dataTable.ext.search.push(
                function(settings, data, dataIndex) {
                    const order = returnsTable.row(dataIndex).data();
                    return order.status === 'RETURNED' && !order.status.includes('DEFECTIVE');
                }
            );
        }
        
        returnsTable.draw();
    });

    // Add new column for return info in returns table
    returnsTable.on('draw', function() {
        // Add return information to rows
        $('#returnsTable tbody tr').each(function() {
            const rowData = returnsTable.row(this).data();
            if (rowData.return_reason) {
                const returnInfo = $(`
                    <tr class="return-details bg-light">
                        <td colspan="9">
                            <div class="p-2">
                                <h6 class="mb-1">Return Information</h6>
                                <p class="mb-1"><strong>Reason:</strong> ${rowData.return_reason}</p>
                                <p class="mb-1"><strong>Date:</strong> ${new Date(rowData.return_date).toLocaleDateString()}</p>
                                <p class="mb-0"><strong>Pieces affected:</strong> ${rowData.return_pieces}</p>
                            </div>
                        </td>
                    </tr>
                `);
                $(this).after(returnInfo);
            }
        });
    });

    // Handle click on Details button in returns table
    $('#returnsTable').on('click', '.detail-btn', function(e) {
        e.stopPropagation();
        const tr = $(this).closest('tr');
        const row = returnsTable.row(tr);
        const data = row.data();
        
        Swal.fire({
            title: `Return Details: ${data.model_no}`,
            html: `
                <div class="text-start">
                    <p><strong>Status:</strong> ${data.status}</p>
                    <p><strong>Return Reason:</strong> ${data.return_reason || 'Not specified'}</p>
                    <p><strong>Return Date:</strong> ${data.return_date ? new Date(data.return_date).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Affected Pieces:</strong> ${data.return_pieces || 'Not specified'}</p>
                    <p><strong>Original Order Date:</strong> ${new Date(data.order_date).toLocaleDateString()}</p>
                    <p><strong>Order Type:</strong> ${data.is_repeated ? 'Reorder' : 'Original Order'}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Close'
        });
    });

    // Add clickable row expansion to view return details
    $('#returnsTable tbody').on('click', 'tr:not(.return-details)', function() {
        const rowData = returnsTable.row(this).data();
        if (rowData.return_reason) {
            const nextRow = $(this).next();
            if (nextRow.hasClass('return-details')) {
                nextRow.toggle();
            }
        }
    });

    // Reload tables when switching tabs to ensure data is fresh
    $('a[data-bs-toggle="tab"]').on('shown.bs.tab', function(e) {
        const target = $(e.target).attr("href");
        if (target === "#my-orders") {
            myOrdersTable.ajax.reload();
        } else if (target === "#reorders") {
            reordersTable.ajax.reload();
        } else if (target === "#returns") {
            returnsTable.ajax.reload();
        }
    });
    
    // Order Approval with Swal confirmation
    $(document).on('click', '.allow-order', function() {
        const orderId = $(this).data('id');
        
        Swal.fire({
            title: 'Approve this order?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, approve it!',
            cancelButtonText: 'No, cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/api/orders/${orderId}/approve/`,
                    type: 'POST',
                    headers: { 'X-CSRFToken': csrfToken },
                    success: function() {
                        showAlert('Order approved successfully', 'success');
                        refreshAllTables();
                    },
                    error: function(xhr) {
                        showAlert(`Error: ${xhr.responseText || 'Could not approve order'}`, 'danger');
                    }
                });
            }
        });
    });

    // Deny Order
    $(document).on('click', '.deny-order', function() {
        $('#denyOrderId').val($(this).data('id'));
        $('#denyOrderModal').modal('show');
    });

    // Return Order
    $(document).on('click', '.return-order', function() {
        $('#returnOrderId').val($(this).data('id'));
        $('#isRepeatedOrder').val($(this).data('repeated'));
        $('#returnOrderModal').modal('show');
    });

    // Cancel Repeated Order with Swal confirmation
    $(document).on('click', '.cancel-order', function() {
        const orderId = $(this).data('id');
        
        Swal.fire({
            title: 'Cancel this repeated order?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel it!',
            cancelButtonText: 'No, keep it'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/api/repeated-orders/${orderId}/cancel/`,
                    type: 'POST',
                    headers: { 'X-CSRFToken': csrfToken },
                    success: function() {
                        showAlert('Order cancelled successfully', 'success');
                        refreshAllTables();
                    },
                    error: function(xhr) {
                        showAlert(`Error: ${xhr.responseText || 'Could not cancel order'}`, 'danger');
                    }
                });
            }
        });
    });

    // Submit Deny Order Form
    $('#denyOrderForm').on('submit', function(e) {
        e.preventDefault();
        
        const orderId = $('#denyOrderId').val();
        const formData = new FormData(this);
        
        $.ajax({
            url: `/api/orders/${orderId}/deny/`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'X-CSRFToken': csrfToken },
            success: function() {
                $('#denyOrderModal').modal('hide');
                $('#denyOrderForm')[0].reset();
                showAlert('Order denied successfully', 'success');
                refreshAllTables();
            },
            error: function(xhr) {
                showAlert(`Error: ${xhr.responseText || 'Could not deny order'}`, 'danger');
            }
        });
    });

    // Submit Return Order Form
    $('#returnOrderForm').on('submit', function(e) {
        e.preventDefault();
        
        const orderId = $('#returnOrderId').val();
        const isRepeated = $('#isRepeatedOrder').val() === 'true';
        const formData = new FormData(this);
        
        formData.append('is_repeated', isRepeated);
        
        const endpoint = isRepeated ? 
            `/api/repeated-orders/${orderId}/return/` : 
            `/api/orders/${orderId}/return/`;
        
        $.ajax({
            url: endpoint,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'X-CSRFToken': csrfToken },
            success: function() {
                $('#returnOrderModal').modal('hide');
                $('#returnOrderForm')[0].reset();
                showAlert('Order marked for return successfully', 'success');
                refreshAllTables();
            },
            error: function(xhr) {
                showAlert(`Error: ${xhr.responseText || 'Could not return order'}`, 'danger');
            }
        });
    });

    // Function to update order statistics
    function updateOrderStats(data) {
        const activeOrders = data.filter(order => 
            !['RETURNED', 'DEFECTIVE', 'FINISHED'].includes(order.status) && !order.is_repeated).length;
        
        const reorders = data.filter(order => order.is_repeated && 
            !['RETURNED', 'DEFECTIVE'].includes(order.status)).length;
        
        const returns = data.filter(order => 
            ['RETURNED', 'DEFECTIVE'].includes(order.status)).length;
        
        const pendingApproval = data.filter(order => 
            !order.is_approved && !order.is_repeated).length;
        
        $('#activeOrdersCount').text(activeOrders);
        $('#reordersCount').text(reorders);
        $('#returnsCount').text(returns);
        $('#pendingApprovalCount').text(pendingApproval);
    }

    // Update statistics on initial load and table reload
    $.ajax({
        url: '/api/client/orders/',
        success: function(response) {
            updateOrderStats(response.data);
        }
    });

    // Helper function to refresh all tables
    function refreshAllTables() {
        myOrdersTable.ajax.reload();
        reordersTable.ajax.reload();
        returnsTable.ajax.reload();
        
        // Update statistics after table reload
        $.ajax({
            url: '/api/client/orders/',
            success: function(response) {
                updateOrderStats(response.data);
            }
        });
    }
    
    // Alert helper function using Bootstrap Toast
    function showAlert(message, type = 'info') {
        const alertHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        if (!$('#alertContainer').length) {
            $('body').append('<div id="alertContainer" class="position-fixed top-0 end-0 p-3" style="z-index: 1055;"></div>');
        }
        
        const toast = $(alertHtml);
        $('#alertContainer').append(toast);
        
        const bsToast = new bootstrap.Toast(toast[0], {
            autohide: true,
            delay: 5000
        });
        bsToast.show();
    }

    function openImageModal(imageUrl, modelName, jewelryType, weight, length, breadth) {
        $('#imageModalLabel').text(modelName);
        $('#modalImage').attr('src', imageUrl);
        $('#modalImage').css('transform', 'scale(1)');
    
        // Set all info in one line
        $('#model-info').text(`${length}x${breadth} cm | ${jewelryType} | ${weight} gm`);
    
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('imageModal'));
        modal.show();
    }
    
    // Initialize zoom functionality for the image modal
    function initializeImageZoom() {
        let scale = 1;
        const scaleStep = 0.25;
        const maxScale = 3;
        const minScale = 0.5;
    
        const $modalImage = $('#modalImage');
        const $zoomContainer = $('.zoom-container');
        const $imageWrapper = $('.image-wrapper');
    
        // Disable default image dragging
        $modalImage.on('dragstart', function (e) {
            e.preventDefault();
        });
    
        // Zoom in
        $('#zoomIn').on('click', function () {
            console.log('Zoom in clicked, current scale:', scale);
            if (scale < maxScale) {
                scale += scaleStep;
                updateZoom();
            }
        });
    
        // Zoom out
        $('#zoomOut').on('click', function () {
            console.log('Zoom out clicked, current scale:', scale);
            if (scale > minScale) {
                scale -= scaleStep;
                updateZoom();
            }
        });
    
        // Reset zoom
        function resetZoom() {
            console.log('Reset zoom called');
            scale = 1;
            updateZoom();
            $imageWrapper.css({
                'transform': 'translate(0px, 0px)'
            });
        }
    
        $('#resetZoom').on('click', resetZoom);
        $('#imageModal').on('hidden.bs.modal', resetZoom);
    
        // Update image zoom scale
        function updateZoom() {
            console.log('Updating zoom to scale:', scale);
            $modalImage.css('transform', `scale(${scale})`);
            
            // Update cursor based on zoom level
            if (scale > 1) {
                $zoomContainer.css('cursor', 'grab');
            } else {
                $zoomContainer.css('cursor', 'default');
            }
        }
    
        // Improved drag-to-move logic
        let isDragging = false;
        let startX = 0, startY = 0;
        let currentX = 0, currentY = 0;
    
        $zoomContainer.on('mousedown', function (e) {
            if (scale > 1) {
                isDragging = true;
                $zoomContainer.css('cursor', 'grabbing');
                
                // Get current transform values
                const transform = $imageWrapper.css('transform');
                const matrix = transform.match(/matrix\([^)]+\)/);
                if (matrix) {
                    const values = matrix[0].slice(7, -1).split(',');
                    currentX = parseFloat(values[4]) || 0;
                    currentY = parseFloat(values[5]) || 0;
                }
                
                startX = e.clientX - currentX;
                startY = e.clientY - currentY;
                e.preventDefault();
            }
        });
    
        $(document).on('mousemove', function (e) {
            if (!isDragging || scale <= 1) return;
            e.preventDefault();
            
            currentX = e.clientX - startX;
            currentY = e.clientY - startY;
            
            // Apply boundaries to prevent dragging too far
            const containerWidth = $zoomContainer.width();
            const containerHeight = $zoomContainer.height();
            const imageWidth = $modalImage.width() * scale;
            const imageHeight = $modalImage.height() * scale;
            
            const maxX = Math.max(0, (imageWidth - containerWidth) / 2);
            const maxY = Math.max(0, (imageHeight - containerHeight) / 2);
            
            currentX = Math.min(maxX, Math.max(-maxX, currentX));
            currentY = Math.min(maxY, Math.max(-maxY, currentY));
            
            $imageWrapper.css('transform', `translate(${currentX}px, ${currentY}px)`);
        });
    
        $(document).on('mouseup', function () {
            if (isDragging) {
                isDragging = false;
                $zoomContainer.css('cursor', scale > 1 ? 'grab' : 'default');
            }
        });
    
        // Optional: double-click to toggle zoom
        $modalImage.on('dblclick', function () {
            if (scale === 1) {
                scale = 2;
            } else {
                resetZoom();
                return;
            }
            updateZoom();
        });
    
        // Mouse wheel zoom (optional enhancement)
        $zoomContainer.on('wheel', function(e) {
            e.preventDefault();
            const delta = e.originalEvent.deltaY;
            
            if (delta > 0 && scale > minScale) {
                // Scroll down - zoom out
                scale -= scaleStep;
                updateZoom();
            } else if (delta < 0 && scale < maxScale) {
                // Scroll up - zoom in
                scale += scaleStep;
                updateZoom();
            }
        });
    
        // Touch support for mobile
        let touchStartX = 0, touchStartY = 0;
        
        $zoomContainer.on('touchstart', function(e) {
            if (scale > 1) {
                const touch = e.originalEvent.touches[0];
                
                // Get current transform values
                const transform = $imageWrapper.css('transform');
                const matrix = transform.match(/matrix\([^)]+\)/);
                if (matrix) {
                    const values = matrix[0].slice(7, -1).split(',');
                    currentX = parseFloat(values[4]) || 0;
                    currentY = parseFloat(values[5]) || 0;
                }
                
                touchStartX = touch.clientX - currentX;
                touchStartY = touch.clientY - currentY;
            }
        });
        
        $zoomContainer.on('touchmove', function(e) {
            if (scale > 1) {
                e.preventDefault();
                const touch = e.originalEvent.touches[0];
                
                currentX = touch.clientX - touchStartX;
                currentY = touch.clientY - touchStartY;
                
                // Apply boundaries
                const containerWidth = $zoomContainer.width();
                const containerHeight = $zoomContainer.height();
                const imageWidth = $modalImage.width() * scale;
                const imageHeight = $modalImage.height() * scale;
                
                const maxX = Math.max(0, (imageWidth - containerWidth) / 2);
                const maxY = Math.max(0, (imageHeight - containerHeight) / 2);
                
                currentX = Math.min(maxX, Math.max(-maxX, currentX));
                currentY = Math.min(maxY, Math.max(-maxY, currentY));
                
                $imageWrapper.css('transform', `translate(${currentX}px, ${currentY}px)`);
            }
        });
    }
});