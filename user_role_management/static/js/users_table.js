$(document).ready(function () {
    if ($("#usersTable").length) {
        fetchUsers();
    }
});

function fetchUsers() {
    $.ajax({
        url: "/user/get_users/", // Adjust the URL to your Django API
        method: "GET",
        success: function (response) {
            let users = response.data;
            let tbody = $("#usersTable tbody");
            tbody.empty(); // Clear existing rows

            users.forEach((user, index) => {
                let actionButtons = `<button class="btn btn-sm btn-primary">Edit</button> 
                                     <button class="btn btn-sm btn-danger">Delete</button>`;

                let row = `<tr>
                    <td>${index + 1}</td>
                    <td>${user.name}</td>  <!-- Updated from username to name -->
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${actionButtons}</td>
                </tr>`;
                
                tbody.append(row);
            });
        },
        error: function (xhr, status, error) {
            console.error("Error fetching users:", error);
        }
    });
}
