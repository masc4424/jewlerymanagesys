$(document).ready(function() {
    $('#usersTable').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": "/orders_view/",
            "type": "GET",
            "dataSrc": ""
        },
        "columns": [
            { "data": "id" },  
            { "data": "client_name" },
            { "data": "model_id" },
            { "data": "model_no" },
            { "data": "no_of_pieces" },
            { "data": "date_of_order" },
            { "data": "est_delivery_date" },
            { "data": "contact_no" },
            { "data": "mrp" },
            { "data": "selling_price" },
            { "data": "discount" },
            { "data": "color_id" },  
            { 
                "data": "id",
                "render": function(data, type, row) {
                    return `<button class="btn btn-sm btn-primary">Edit</button>
                            <button class="btn btn-sm btn-danger">Delete</button>`;
                }
            }
        ],
        "scrollX": true,
        "fixedColumns": {
            leftColumns: 0
        }
    });

    $("#new_order").on("click", function(event) {
        event.preventDefault();
        window.location.href = "/add_order";
    });
});