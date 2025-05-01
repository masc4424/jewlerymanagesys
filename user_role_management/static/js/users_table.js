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
        url: "/user/get_users/",
        method: "GET",
        success: function (response) {
            let users = response.data;
            let tbody = $("#usersTable tbody");
            tbody.empty(); // Clear existing table rows

            users.forEach((user, index) => {
                // Generate color based on user ID - this creates consistent colors for each user
                const color = getUserColor(user.id);
                
                // Create profile display - either image or initials
                let profileDisplay;
                if (user.has_image && user.profile_image) {
                    // Use actual profile image if available
                    profileDisplay = `<img src="${user.profile_image}" alt="${user.name}" class="rounded-circle me-2"
                        data-bs-toggle="modal" data-bs-target="#profileImageModal"
                        data-image="${user.profile_image}" style="width: 50px; height: 50px; object-fit: cover; cursor: pointer;">`;
                } else {
                    // Use initials with background color
                    profileDisplay = `<div class="rounded-circle me-2 d-flex align-items-center justify-content-center"
                        style="width: 50px; height: 50px; background-color: ${color}; color: white; font-weight: bold; cursor: pointer;"
                        data-bs-toggle="modal" data-bs-target="#initialsModal" 
                        data-initials="${user.initials}" data-color="${color}" data-name="${user.name}">
                        ${user.initials}
                    </div>`;
                }

                // Create profile image HTML with name
                let profileImageHTML = `
                    <div class="d-flex align-items-center">
                        ${profileDisplay}
                        <span>${user.name}</span>
                    </div>
                `;

                // Construct Created/Updated by info
                let trackingInfo = `Created by: ${user.created_by}`;
                if (user.updated_by && user.updated_by !== user.created_by) {
                    trackingInfo += `<br>Updated by: ${user.updated_by}`;
                }

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
                    <td>${profileImageHTML}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${trackingInfo}</td>
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

// Function to generate a consistent color based on user ID
function getUserColor(userId) {
    // List of visually distinct colors
    const colors = [
        "#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e",
        "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50",
        "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6",
        "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"
    ];
    
    // Use modulo to ensure the ID maps to a color in our array
    const colorIndex = parseInt(userId) % colors.length;
    return colors[colorIndex];
}

// Dynamically generate both modals - one for profile images, one for initials
const modalsHTML = `
    <!-- Profile Image Modal -->
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

    <!-- Initials Modal -->
    <div class="modal fade" id="initialsModal" tabindex="-1" aria-labelledby="initialsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="initialsModalLabel">User Profile</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
                    <div id="initialsFullView" class="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
                        style="width: 100px; height: 100px; font-size: 2rem; font-weight: bold;">
                    </div>
                    <h4 id="initialsUserName"></h4>
                </div>
            </div>
        </div>
    </div>
`;
$("body").append(modalsHTML);

// Open profile image modal when clicked
$("#usersTable").on("click", "img[data-bs-toggle='modal']", function () {
    const imageSrc = $(this).data("image");
    $("#profileImageFullView").attr("src", imageSrc);
});

// Open initials modal when clicked
$("#usersTable").on("click", "div[data-bs-toggle='modal']", function () {
    const initials = $(this).data("initials");
    const color = $(this).data("color");
    const name = $(this).data("name");
    
    $("#initialsFullView").text(initials);
    $("#initialsFullView").css("background-color", color);
    $("#initialsFullView").css("color", "white");
    $("#initialsUserName").text(name);
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
