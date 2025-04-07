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

    // Handle Create User Form Submission
    $("#createUserForm").submit(function (event) {
        event.preventDefault();
        createUser();
    });

    // Reset form on modal close
    $("#createUserModal").on("hidden.bs.modal", function () {
        $("#createUserForm")[0].reset();
    });

    $("#createUserModal").on("shown.bs.modal", function () {
        fetchRoles();
    });

    // Handle profile image preview for create user
    $("#createProfileImage").change(function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $("#createProfileImagePreview").attr('src', e.target.result);
            }
            reader.readAsDataURL(file);
        }
    });
    
    // Make the profile image container clickable
    $(".profile-image-container").click(function() {
        $("#createProfileImage").click();
    });
    
    // Add hover effect for the image container
    $(".profile-image-container").hover(
        function() {
            $(this).find(".image-upload-overlay").css("opacity", "1");
        },
        function() {
            $(this).find(".image-upload-overlay").css("opacity", "0");
        }
    );

        // Handle profile image preview for edit user
        $("#editProfileImage").change(function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    $("#editProfileImagePreview").attr('src', e.target.result);
                }
                reader.readAsDataURL(file);
            }
        });
        
        // Make the edit profile image container clickable
        $("#editUserModal .profile-image-container").click(function() {
            $("#editProfileImage").click();
        });
        
        // Add hover effect for the edit image container
        $("#editUserModal .profile-image-container").hover(
            function() {
                $(this).find(".image-upload-overlay").css("opacity", "1");
            },
            function() {
                $(this).find(".image-upload-overlay").css("opacity", "0");
            }
        );
});

function fetchRoles() {
    let roleDropdown = $("#createUserRole");

    // Fetch roles only if not loaded
    if (roleDropdown.children("option").length === 1) {
        $.get("/user/get-roles/", function (data) {
            roleDropdown.empty().append('<option value="">Select Role</option>');
            data.roles.forEach(function (role) {
                roleDropdown.append(`<option role_id="${role.id}" value="${role.role_unique_id}">${role.role_name}</option>`);
            });
        });
    }
}

function createUser() {
    // Create a new FormData object
    let formData = new FormData();
    
    // Get values from each field individually
    const username = $("#createUsername").val();
    const fullName = $("#createFullName").val();
    const email = $("#createEmail").val();
    const phoneNumber = $("#createPhoneNumber").val();
    const roleUniqueId = $("#createUserRole option:selected").attr("role_id");
    const password = $("#createPassword").val();
    
    // Add each field to the FormData object
    formData.append("username", username);
    formData.append("name", fullName);
    formData.append("email", email);
    formData.append("phone_number", phoneNumber);
    formData.append("role_unique_id", roleUniqueId);
    
    // Only add password if it's not empty
    if (password) {
        formData.append("password", password);
    }
    
    // Handle file upload separately
    const profileImage = $("#createProfileImage")[0].files[0];
    if (profileImage) {
        formData.append("profile_image", profileImage);
    }
    
    // Log the form data for debugging (optional)
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    $.ajax({
        url: "/user/create-user/",
        method: "POST",
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            $("#createUserModal").modal("hide");
            fetchUsers(); // Refresh table
            alert("User created successfully!");
        },
        error: function (xhr) {
            console.error("Error creating user:", xhr.responseText);
            alert("Failed to create user.");
        }
    });
}

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
                    <button class="btn btn-sm btn-primary edit-user-btn" data-id="${user.id}" onclick="fetchUserDetails(${user.id})"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}" data-name="${user.name}"><i class="fa-solid fa-trash"></i></button>
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
