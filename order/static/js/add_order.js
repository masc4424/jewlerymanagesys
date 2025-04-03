$(document).ready(function () {
    $("#submitOrder").on("click", function (e) {
        e.preventDefault();

        // Collect form data
        let clientName = $("#createUsername").val();
        let contactNo = $("#createFullName").val();
        let modelId = $("#model_no").val();
        let colorId = $("#model_color").val();
        let noOfPieces = $("#pieces_1").val();
        let dateOfOrder = $("#dateOfOrder").val();
        let estDeliveryDate = $("#estDeliveryDate").val();
        let mrp = $("#mrp").val();
        let discount = $("#discount").val() || 0;  // Default discount to 0 if not provided

        // Validate form data
        if (!clientName || !contactNo || !modelId || !colorId || !noOfPieces || !dateOfOrder || !estDeliveryDate || !mrp) {
            alert("Please fill in all required fields.");
            return;
        }

        // Create JSON data
        let orderData = {
            client_name: clientName,
            contact_no: contactNo,
            model: modelId,
            color: colorId,
            no_of_pieces: noOfPieces,
            date_of_order: dateOfOrder,
            est_delivery_date: estDeliveryDate,
            mrp: mrp,
            discount: discount
        };

        // AJAX request
        $.ajax({
            url: "/order_add/", // Ensure this matches your Django URL pattern
            type: "POST",
            data: JSON.stringify(orderData),
            contentType: "application/json",
            dataType: "json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-CSRFToken", getCSRFToken());
            },
            success: function (response) {
                alert("Order created successfully! Order ID: " + response.order_id);
                location.reload(); // Refresh page or redirect as needed
            },
            error: function (xhr) {
                alert("Error: " + xhr.responseJSON.error);
            }
        });
    });

    // Function to get CSRF token from cookies
    function getCSRFToken() {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            let cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim();
                if (cookie.startsWith("csrftoken=")) {
                    cookieValue = cookie.substring("csrftoken=".length, cookie.length);
                    break;
                }
            }
        }
        return cookieValue;
    }
});
