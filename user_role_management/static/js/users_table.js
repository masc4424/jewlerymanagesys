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

        $('#createUserModal').on('shown.bs.modal', function () {
            generateRandomUsername();
        });
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

function generateRandomUsername() {
    const prefix = "user";
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    const username = `${prefix}${randomNum}`;
    $("#createUsername").val(username);
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
        url: "/user/get_users/", // Adjust the URL to your API endpoint
        method: "GET",
        success: function (response) {
            let users = response.data;
            let tbody = $("#usersTable tbody");
            tbody.empty(); // Clear existing table rows

            users.forEach((user, index) => {
                let profileImage = user.profile_image ? user.profile_image : '/static/user_image/avatar-default.png';
                
                // Create profile image HTML
                let profileImageHTML = `
                    <img src="${profileImage}" alt="Profile Image" class="img-fluid rounded-circle" 
                         data-bs-toggle="modal" data-bs-target="#profileImageModal" 
                         data-image="${profileImage}" style="width: 50px; height: 50px; object-fit: cover; cursor: pointer;">
                `;

                let actionButtons = `
                    <button class="btn btn-sm btn-outline-primary edit-user-btn" data-id="${user.id}" onclick="fetchUserDetails(${user.id})">
                        <i class="bx bx-edit-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${user.id}" data-name="${user.name}">
                        <i class="bx bx-trash"></i>
                    </button>
                `;

                let row = `<tr>
                    <td>${index + 1}</td>
                    <td>${profileImageHTML} ${user.name}</td>
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

// Dynamically generate the modal HTML for profile image display
const modalHTML = `
    <div class="modal fade" id="profileImageModal" tabindex="-1" aria-labelledby="profileImageModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="profileImageModalLabel">Profile Image</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <img id="profileImageFullView" src="" alt="Profile Image" class="img-fluid w-100">
                </div>
            </div>
        </div>
    </div>
`;
// Append the modal to the body
$("body").append(modalHTML);

// Open modal when a profile image is clicked
$("#usersTable").on("click", "img[data-bs-toggle='modal']", function () {
    const imageSrc = $(this).data("image");
    $("#profileImageFullView").attr("src", imageSrc);
});

// Fetch User Details and Open Edit Modal
function fetchUserDetails(userId) {
    $.ajax({
        url: `/user/edit-user/${userId}/`,
        method: "GET",
        success: function (user) {
            // Set hidden user ID
            $("#editUserId").val(user.id);
            
            // Set form fields
            $("#editFirstName").val(user.first_name);
            $("#editLastName").val(user.last_name);
            $("#editEmail").val(user.email);
            $("#editPhoneNumber").val(user.phone_number);

            // Set profile image
            if (user.profile_image) {
                $("#editProfileImagePreview").attr("src", user.profile_image);
            } else {
                $("#editProfileImagePreview").attr("src", "{% static 'user_image/default.png' %}");
            }

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
    // Create a new FormData object manually - don't rely on form
    let formData = new FormData();
    let userId = $("#editUserId").val();

    // Explicitly add each form field to ensure data is sent
    formData.append("first_name", $("#editFirstName").val());
    formData.append("last_name", $("#editLastName").val());
    formData.append("email", $("#editEmail").val());
    formData.append("phone_number", $("#editPhoneNumber").val());
    formData.append("role", $("#editUserRole").val());
    
    // Add the profile image if it exists
    const profileImageInput = $("#editProfileImage")[0];
    if (profileImageInput.files.length > 0) {
        formData.append("profile_image", profileImageInput.files[0]);
    }
    
    // Debug: log form data to console
    console.log("Form data being sent:");
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    $.ajax({
        url: `/user/edit-user/${userId}/`,
        method: "POST",
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            $("#editUserModal").modal("hide");
            fetchUsers(); // Refresh table
            alert("User updated successfully!");
        },
        error: function (xhr) {
            console.error("Error updating user:", xhr.responseText);
            alert("Failed to update user: " + (xhr.responseJSON?.error || "Unknown error"));
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
