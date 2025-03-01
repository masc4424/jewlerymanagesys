$(document).ready(function () {
    if ($("#usersTable").length) {
        fetchUsers();
    }

    // Handle Edit User Form Submission
    $("#editUserForm").submit(function (event) {
        event.preventDefault();
        updateUser();
    });

    // Handle Delete User
    $("#usersTable").on("click", ".delete-user-btn", function () {
        let userId = $(this).data("id");
        let userName = $(this).data("name");
        deleteUser(userId, userName);
    });

    // Reset form on modal close
    $("#editUserModal").on("hidden.bs.modal", function () {
        $("#editUserForm")[0].reset();
        $("#editProfileImagePreview").attr("src", "{% static 'user_image/default.png' %}");
    });
});

// Fetch and Populate Users Table
function fetchUsers() {
    $.ajax({
        url: "/user/get_users/",
        method: "GET",
        success: function (response) {
            let users = response.data;
            let tbody = $("#usersTable tbody");
            tbody.empty();

            users.forEach((user, index) => {
                let actionButtons = `
                    <button class="btn btn-sm btn-primary edit-user-btn" data-id="${user.id}" onclick="fetchUserDetails(${user.id})"><box-icon name='edit-alt'></box-icon></button>
                    <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}" data-name="${user.name}"><box-icon name='trash' ></box-icon></button>
                `;

                let row = `<tr>
                    <td>${index + 1}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${actionButtons}</td>
                </tr>`;

                tbody.append(row);
            });
        },
        error: function (xhr) {
            console.error("Error fetching users:", xhr.responseText);
            alert("Failed to load users.");
        }
    });
}

// Fetch User Details and Open Edit Modal
function fetchUserDetails(userId) {
    $.ajax({
        url: `/user/edit-user/${userId}/`,
        method: "GET",
        success: function (user) {
            $("#editUserId").val(user.id);
            $("#editFirstName").val(user.first_name);
            $("#editLastName").val(user.last_name);
            $("#editEmail").val(user.email);
            $("#editPhoneNumber").val(user.phone_number);

            // Get static base URL from hidden input field
            let staticUrl = $("#staticUrl").val(); 
            let profileImage = user.profile_image || `${staticUrl}${user.id}.png`;

            $("#editProfileImagePreview").attr("src", profileImage);

            // Populate role dropdown
            let roleDropdown = $("#editUserRole").empty();
            user.all_roles.forEach(role => {
                roleDropdown.append(`<option value="${role.id}" ${role.id === user.role_id ? "selected" : ""}>${role.role_name}</option>`);
            });

            $("#editUserModal").modal("show");
        },
        error: function (xhr) {
            console.error("Error fetching user details:", xhr.responseText);
            alert("Failed to load user details.");
        }
    });
}

// Update User
function updateUser() {
    let formData = new FormData($("#editUserForm")[0]);
    let userId = $("#editUserId").val();

    $.ajax({
        url: `/user/edit-user/${userId}/`,
        method: "POST",
        data: formData,
        contentType: false,
        processData: false,
        success: function () {
            $("#editUserModal").modal("hide");
            fetchUsers(); // Refresh table
            alert("User updated successfully!");
        },
        error: function (xhr) {
            console.error("Error updating user:", xhr.responseText);
            alert("Failed to update user.");
        }
    });
}

// Delete User
function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return;

    $.ajax({
        url: "/user/delete-user/",
        method: "DELETE",
        contentType: "application/json",
        data: JSON.stringify({ user_id: userId }),
        success: function () {
            fetchUsers();
            alert("User deleted successfully!");
        },
        error: function (xhr) {
            console.error("Error deleting user:", xhr.responseText);
            alert("Failed to delete user.");
        }
    });
}
