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
                
                // For now assume all are not delivered (you'll need to add this field to your model)
                groupedOrders[order.order_unique_id].delivered = false;
                
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
                        let actions = `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-icon" type="button" id="actionDropdown${row.id}" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bx bx-dots-vertical-rounded"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="actionDropdown${row.id}">
                                    <li><a class="dropdown-item" href="/edit_order/${row.order_unique_id}">Edit</a></li>
                                    <li><a class="dropdown-item" href="/view_order/${row.order_unique_id}">View Details</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item mark-delivered" href="#" data-unique-id="${row.order_unique_id}">Mark as delivered</a></li>
                                    <li><a class="dropdown-item add-to-repeat" href="#" data-unique-id="${row.order_unique_id}">Add to Repeat orders</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger delete-order" href="#" data-unique-id="${row.order_unique_id}">Delete</a></li>
                                </ul>
                            </div>
                        `;
                        return actions;
                    }
                }
            ],
            scrollX: true,
            fixedColumns: {
                leftColumns: 2
            },
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
        if (confirm(`Mark order ${uniqueId} as delivered?`)) {
            // AJAX request to mark as delivered
            $.ajax({
                url: "/mark_order_delivered/",
                type: "POST",
                data: {
                    order_unique_id: uniqueId,
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function(response) {
                    if (response.success) {
                        // Reload the table
                        $('#usersTable').DataTable().ajax.reload();
                        alert("Order marked as delivered successfully!");
                    } else {
                        alert("Error: " + response.error);
                    }
                },
                error: function() {
                    alert("An error occurred while marking the order as delivered.");
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
                url: "/delete_order/",
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