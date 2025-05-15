$(document).ready(function() {
    $('#repeatedOrdersTable').DataTable({
        ajax: {
            url: '/api/repeated-orders/',  // Adjust based on your URL config
            dataSrc: 'data'
        },
        columns: [
            { title: "Model No", data: "model_no" },
            { title: "Image", data: "model_img", render: img => `<img src="${img}" width="50"/>` },
            { title: "Status", data: "status" },
            { title: "Jewelry Type", data: "jewelry_type" },
            { title: "Quantity", data: "quantity" },
            { title: "Color", data: "color" },
            { title: "Order Date", data: "order_date" },
            { title: "Estimated Delivery", data: "estimated_delivery" },
            { title: "Weight", data: "weight" }
        ]
    });
});
