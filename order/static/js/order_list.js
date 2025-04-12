$(document).ready(function() {
    $.ajax({
        url: "/orders_view/",
        type: "GET",
        success: function(data) {
            // Group orders by order_unique_id
            const groupedOrders = {};
            
            data.forEach(order => {
                if (!groupedOrders[order.order_unique_id]) {
                    groupedOrders[order.order_unique_id] = {
                        orders: [],
                        totalModels: new Set(),
                        totalPieces: 0,
                        totalMRP: 0,
                        totalSellingPrice: 0,
                        delivered: true, // Assume delivered until we find one that's not
                        firstOrder: null
                    };
                }
                
                groupedOrders[order.order_unique_id].orders.push(order);
                groupedOrders[order.order_unique_id].totalModels.add(order.model_id);
                groupedOrders[order.order_unique_id].totalPieces += order.no_of_pieces;
                groupedOrders[order.order_unique_id].totalMRP += parseFloat(order.mrp) * order.no_of_pieces;
                groupedOrders[order.order_unique_id].totalSellingPrice += order.selling_price * order.no_of_pieces;
                
                // If any order in the group is not delivered, mark the whole group as not delivered
                if (!order.is_delivered) {
                    groupedOrders[order.order_unique_id].delivered = false;
                }
                
                // Store the first order for display purposes
                if (!groupedOrders[order.order_unique_id].firstOrder) {
                    groupedOrders[order.order_unique_id].firstOrder = order;
                }
            });
            
            // Convert to array for DataTables
            const tableData = Object.values(groupedOrders).map((group, index) => {
                const firstOrder = group.firstOrder;
                
                return {
                    id: index + 1,
                    client_name: firstOrder.client_name,
                    item_type: group.totalModels.size, // Number of unique models as "type"
                    status: group.delivered ? "Delivered" : "Not delivered",
                    models: group.totalModels.size,
                    pieces: group.totalPieces,
                    priceDetails: {
                        totalMRP: group.totalMRP.toFixed(2),
                        totalSellingPrice: group.totalSellingPrice.toFixed(2)
                    },
                    date_of_order: firstOrder.date_of_order,
                    est_delivery_date: firstOrder.est_delivery_date,
                    contact_no: firstOrder.contact_no,
                    order_unique_id: firstOrder.order_unique_id,
                    originalOrders: group.orders
                };
            });
            
            initializeDataTable(tableData);
        },
        error: function(xhr, status, error) {
            console.error("Error fetching orders:", error);
        }
    });
    
    function initializeDataTable(data) {
        $('#usersTable').DataTable({
            data: data,
            columns: [
                { 
                    data: null,
                    defaultContent: '',
                    orderable: false,
                    render: function (data, type, row, meta) {
                        return '<input type="checkbox" class="order-checkbox">';
                    }
                },
                { data: "id" },
                { data: "client_name" },
                { data: "item_type" },
                { 
                    data: "status",
                    render: function(data) {
                        return data === "Delivered" ? 
                            '<span class="badge bg-success">Delivered</span>' : 
                            '<span class="badge bg-warning">Not delivered</span>';
                    }
                },
                { 
                    data: "models",
                    render: function(data, type, row) {
                        return `<a href="#" class="view-models" data-unique-id="${row.order_unique_id}">${data} <i class='bx bx-chevron-right'></i></a>`;
                    }
                },
                { 
                    data: "pieces",
                    render: function(data, type, row) {
                        return `<a href="#" class="view-pieces" data-unique-id="${row.order_unique_id}">${data} <i class='bx bx-chevron-right'></i></a>`;
                    }
                },
                { 
                    data: "priceDetails",
                    render: function(data, type, row) {
                        return `<a href="#" class="view-price" data-unique-id="${row.order_unique_id}">View <i class='bx bx-chevron-right'></i></a>`;
                    }
                },
                { data: "date_of_order" },
                { data: "est_delivery_date" },
                { data: "contact_no" },
                { 
                    data: null,
                    render: function(data, type, row) {
                        let deliveryAction = row.status === "Delivered" ? 
                            `<li><a class="dropdown-item mark-delivered" href="#" data-unique-id="${row.order_unique_id}" data-status="delivered">Mark as Not Delivered</a></li>` : 
                            `<li><a class="dropdown-item mark-delivered" href="#" data-unique-id="${row.order_unique_id}" data-status="not_delivered">Mark as Delivered</a></li>`;
                
                        let actions = `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-icon" type="button" id="actionDropdown${row.id}" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                                    <i class="bx bx-dots-vertical-rounded"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="actionDropdown${row.id}">
                                    <li><a class="dropdown-item d-none" href="/edit_order/${row.order_unique_id}">Edit</a></li>
                                    <li><a class="dropdown-item d-none" href="/view_order/${row.order_unique_id}">View Details</a></li>
                                    <li><hr class="dropdown-divider d-none"></li>
                                    ${deliveryAction}
                                    <li><a class="dropdown-item add-to-repeat" href="#" data-unique-id="${row.order_unique_id}">Add to Repeat orders</a></li>
                                    <li><a class="dropdown-item report-defective" href="#" data-unique-id="${row.order_unique_id}">Report Defective</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger delete-order" href="#" data-unique-id="${row.order_unique_id}">Delete</a></li>
                                </ul>
                            </div>
                        `;
                        return actions;
                    }
                }
            ],
            order: [[1, 'asc']],
            dom: 'Bfrtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf', 'print'
            ]
        });
        
        // Event listeners for the detail views
        $('#usersTable').on('click', '.view-models', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            showModelsDetails(uniqueId, data);
        });
        
        $('#usersTable').on('click', '.view-pieces', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            showPiecesDetails(uniqueId, data);
        });
        
        $('#usersTable').on('click', '.view-price', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            showPriceDetails(uniqueId, data);
        });
        
        $('#usersTable').on('click', '.mark-delivered', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            markAsDelivered(uniqueId);
        });
        
        $('#usersTable').on('click', '.add-to-repeat', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            addToRepeatOrders(uniqueId);
        });
        
        $('#usersTable').on('click', '.delete-order', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            deleteOrder(uniqueId);
        });

        $('#usersTable').on('click', '.report-defective', function(e) {
            e.preventDefault();
            const uniqueId = $(this).data('unique-id');
            showDefectiveOrderModal(uniqueId);
        });
    }

    // Define the modal function for reporting defective orders
    function showDefectiveOrderModal(uniqueId) {
        // Find order details for display
        const table = $('#usersTable').DataTable();
        let orderData = null;
        
        table.rows().every(function() {
            if (this.data().order_unique_id === uniqueId) {
                orderData = this.data();
                return false; // Break the loop
            }
        });
        
        if (!orderData) return;
        
        // Create and show modal
        const modalHtml = `
            <div class="modal fade" id="defectiveOrderModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Report Defective Order - ${uniqueId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="defectiveOrderForm" enctype="multipart/form-data">
                                <input type="hidden" name="order_unique_id" value="${uniqueId}">
                                <input type="hidden" name="csrfmiddlewaretoken" value="${$('input[name=csrfmiddlewaretoken]').val()}">
                                
                                <div class="mb-3">
                                    <label for="defective_pieces" class="form-label">Number of Defective Pieces</label>
                                    <input type="number" class="form-control" id="defective_pieces" name="defective_pieces" 
                                        min="1" max="${orderData.pieces}" required>
                                    <div class="form-text">Total order pieces: ${orderData.pieces}</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="issue_description" class="form-label">Issue Description</label>
                                    <textarea class="form-control" id="issue_description" name="issue_description" 
                                        rows="3" required></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="defect_image" class="form-label">Upload Image (Optional)</label>
                                    <input type="file" class="form-control" id="defect_image" name="defect_image" 
                                        accept="image/*">
                                </div>
                                
                                <div class="preview-container mt-3 d-none">
                                    <p>Image Preview:</p>
                                    <img id="imagePreview" class="img-fluid" style="max-height: 200px;" />
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="submitDefectiveOrder">Submit Report</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        $('#defectiveOrderModal').remove();
        $('body').append(modalHtml);
        
        // Set up image preview
        $('#defect_image').on('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    $('#imagePreview').attr('src', e.target.result);
                    $('.preview-container').removeClass('d-none');
                }
                reader.readAsDataURL(file);
            } else {
                $('.preview-container').addClass('d-none');
            }
        });
        
        // Handle form submission
        $('#submitDefectiveOrder').on('click', function() {
            const form = $('#defectiveOrderForm')[0];
            const formData = new FormData(form);
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            $.ajax({
                url: "/add_defective_order/",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        bootstrap.Modal.getInstance(document.getElementById('defectiveOrderModal')).hide();
                        alert("Defective order reported successfully!");
                    } else {
                        alert("Error: " + response.error);
                    }
                },
                error: function(xhr, status, error) {
                    alert("An error occurred while reporting the defective order: " + error);
                }
            });
        });
        
        const defectiveModal = new bootstrap.Modal(document.getElementById('defectiveOrderModal'));
        defectiveModal.show();
    }
    
    // Define modal display functions
    function showModelsDetails(uniqueId, allData) {
        const orderGroup = allData.find(order => order.order_unique_id === uniqueId);
        if (!orderGroup) return;
        
        let modelDetails = '';
        const uniqueModels = {};
        
        orderGroup.originalOrders.forEach(order => {
            if (!uniqueModels[order.model_id]) {
                uniqueModels[order.model_id] = {
                    model_no: order.model_no,
                    count: 0,
                    img: order.model_img
                };
            }
            uniqueModels[order.model_id].count += order.no_of_pieces;
        });
        
        Object.values(uniqueModels).forEach(model => {
            modelDetails += `
                <div class="d-flex align-items-center mb-3">
                    <img src="${model.img || '/static/img/placeholder.png'}" alt="${model.model_no}" class="model-thumbnail mr-3" style="width: 50px; height: 50px; object-fit: contain;">
                    <div class="ms-3">
                        <h6 class="mb-0">Model: ${model.model_no}</h6>
                        <small>Pieces: ${model.count}</small>
                    </div>
                </div>
            `;
        });
        
        // Create and show modal
        const modalHtml = `
            <div class="modal fade" id="modelsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Models for Order ${uniqueId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${modelDetails}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        $('#modelsModal').remove();
        $('body').append(modalHtml);
        const modelsModal = new bootstrap.Modal(document.getElementById('modelsModal'));
        modelsModal.show();
    }
    
    function showPiecesDetails(uniqueId, allData) {
        const orderGroup = allData.find(order => order.order_unique_id === uniqueId);
        if (!orderGroup) return;
        
        let piecesDetails = '';
        orderGroup.originalOrders.forEach(order => {
            piecesDetails += `
                <div class="mb-3">
                    <h6>Model: ${order.model_no}</h6>
                    <p>Pieces: ${order.no_of_pieces}</p>
                    <hr>
                </div>
            `;
        });
        
        // Create and show modal
        const modalHtml = `
            <div class="modal fade" id="piecesModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Pieces Breakdown for Order ${uniqueId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Total Pieces: ${orderGroup.pieces}</strong></p>
                            <hr>
                            ${piecesDetails}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        $('#piecesModal').remove();
        $('body').append(modalHtml);
        const piecesModal = new bootstrap.Modal(document.getElementById('piecesModal'));
        piecesModal.show();
    }
    
    function showPriceDetails(uniqueId, allData) {
        const orderGroup = allData.find(order => order.order_unique_id === uniqueId);
        if (!orderGroup) return;
        
        let priceDetails = '';
        let totalMRP = 0;
        let totalDiscount = 0;
        let totalSellingPrice = 0;
        
        orderGroup.originalOrders.forEach(order => {
            const itemMRP = parseFloat(order.mrp) * order.no_of_pieces;
            const itemSellingPrice = order.selling_price * order.no_of_pieces;
            const itemDiscount = itemMRP - itemSellingPrice;
            
            totalMRP += itemMRP;
            totalSellingPrice += itemSellingPrice;
            totalDiscount += itemDiscount;
            
            priceDetails += `
                <div class="mb-3">
                    <h6>Model: ${order.model_no} (${order.no_of_pieces} pcs)</h6>
                    <p>MRP: ₹${itemMRP.toFixed(2)}</p>
                    <p>Discount: ${order.discount}% (₹${itemDiscount.toFixed(2)})</p>
                    <p>Selling Price: ₹${itemSellingPrice.toFixed(2)}</p>
                    <hr>
                </div>
            `;
        });
        
        // Create and show modal
        const modalHtml = `
            <div class="modal fade" id="priceModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Price Details for Order ${uniqueId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <h6>Order Summary</h6>
                                <p>Total MRP: ₹${totalMRP.toFixed(2)}</p>
                                <p>Total Discount: ₹${totalDiscount.toFixed(2)}</p>
                                <p>Final Price: ₹${totalSellingPrice.toFixed(2)}</p>
                            </div>
                            <h6>Price Breakdown by Model</h6>
                            ${priceDetails}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        $('#priceModal').remove();
        $('body').append(modalHtml);
        const priceModal = new bootstrap.Modal(document.getElementById('priceModal'));
        priceModal.show();
    }
    
    function markAsDelivered(uniqueId) {
        // Find the current status from the DataTable
        const table = $('#usersTable').DataTable();
        let rowIndex = null;
        
        // Find the row index with the matching order_unique_id
        table.rows().every(function(idx) {
            if (this.data().order_unique_id === uniqueId) {
                rowIndex = idx;
                return false; // Break the loop
            }
        });
        
        if (rowIndex === null) return;
        
        const rowData = table.row(rowIndex).data();
        const currentStatus = rowData.status;
        const isCurrentlyDelivered = currentStatus === "Delivered";
        
        const actionText = isCurrentlyDelivered ? "not delivered" : "delivered";
        const newStatus = isCurrentlyDelivered ? "Not delivered" : "Delivered";
        
        if (confirm(`Mark order ${uniqueId} as ${actionText}?`)) {
            // AJAX request to toggle delivery status
            $.ajax({
                url: "/mark_order_delivered/",
                type: "POST",
                data: {
                    order_unique_id: uniqueId,
                    is_delivered: !isCurrentlyDelivered,  // Toggle the current status
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function(response) {
                    if (response.success) {
                        // Update the row data's status
                        rowData.status = newStatus;
                        
                        // Update the status cell with proper badge
                        const statusHTML = newStatus === "Delivered" ? 
                            '<span class="badge bg-success">Delivered</span>' : 
                            '<span class="badge bg-warning">Not delivered</span>';
                        
                        // Update the dropdown menu action
                        const deliveryAction = newStatus === "Delivered" ? 
                            `<li><a class="dropdown-item mark-delivered" href="#" data-unique-id="${uniqueId}" data-status="delivered">Mark as Not Delivered</a></li>` : 
                            `<li><a class="dropdown-item mark-delivered" href="#" data-unique-id="${uniqueId}" data-status="not_delivered">Mark as Delivered</a></li>`;
                        
                        // Update the DataTable row data
                        table.row(rowIndex).data(rowData).draw(false);
                        
                        // Now manually update the cell HTML since DataTables won't fully re-render
                        $(table.row(rowIndex).node()).find('td:eq(4)').html(statusHTML);
                        
                        // Find and replace the delivery action menu item
                        const dropdownMenu = $(table.row(rowIndex).node()).find('.dropdown-menu');
                        dropdownMenu.find('.mark-delivered').parent().replaceWith(deliveryAction);
                        
                        alert(`Order marked as ${actionText} successfully!`);
                    } else {
                        alert("Error: " + response.error);
                    }
                },
                error: function() {
                    alert(`An error occurred while marking the order as ${actionText}.`);
                }
            });
        }
    }
    
    function addToRepeatOrders(uniqueId) {
        if (confirm(`Add order ${uniqueId} to repeat orders?`)) {
            // AJAX request to add to repeat orders
            $.ajax({
                url: "/add_to_repeat_orders/",
                type: "POST",
                data: {
                    order_unique_id: uniqueId,
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function(response) {
                    if (response.success) {
                        alert("Order added to repeat orders successfully!");
                    } else {
                        alert("Error: " + response.error);
                    }
                },
                error: function() {
                    alert("An error occurred while adding the order to repeat orders.");
                }
            });
        }
    }
    
    function deleteOrder(uniqueId) {
        if (confirm(`Are you sure you want to delete order ${uniqueId}? This action cannot be undone.`)) {
            // AJAX request to delete order
            $.ajax({
                url: "/delete_order/",  // Make sure this matches your urls.py
                type: "POST",
                data: {
                    order_unique_id: uniqueId,
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function(response) {
                    if (response.success) {
                        // Reload the table
                        $('#usersTable').DataTable().ajax.reload();
                        alert("Order deleted successfully!");
                    } else {
                        alert("Error: " + response.error);
                    }
                },
                error: function() {
                    alert("An error occurred while deleting the order.");
                }
            });
        }
    }
    
    // Handling the "New Order" button
    $("#new_order").on("click", function(event) {
        event.preventDefault();
        window.location.href = "/add_order";
    });
    
    // Add to Repeat Orders button for batch operations
    $("#add_to_repeat_orders").on("click", function(event) {
        event.preventDefault();
        const selectedOrders = [];
        
        $('.order-checkbox:checked').each(function() {
            const rowData = $('#usersTable').DataTable().row($(this).closest('tr')).data();
            selectedOrders.push(rowData.order_unique_id);
        });
        
        if (selectedOrders.length === 0) {
            alert("Please select at least one order.");
            return;
        }
        
        // AJAX request to add multiple orders to repeat orders
        $.ajax({
            url: "/add_multiple_to_repeat_orders/",
            type: "POST",
            data: {
                order_unique_ids: selectedOrders,
                csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function(response) {
                if (response.success) {
                    alert(`${selectedOrders.length} orders added to repeat orders successfully!`);
                } else {
                    alert("Error: " + response.error);
                }
            },
            error: function() {
                alert("An error occurred while adding orders to repeat orders.");
            }
        });
    });
});