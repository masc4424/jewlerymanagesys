$(document).ready(function () {
    $('#changePasswordForm').submit(function (e) {
        e.preventDefault();

        let new_password = $('#new_password').val();
        let confirm_password = $('#confirm_password').val();
        let csrf_token = $('input[name=csrfmiddlewaretoken]').val();

        $('#passwordError').addClass('d-none');
        $('#passwordSuccess').addClass('d-none');

        if (new_password !== confirm_password) {
            $('#passwordError').text("Passwords do not match.").removeClass('d-none');
            return;
        }

        $.ajax({
            type: 'POST',
            url: '/change-password/',  // Make sure this name matches your URL pattern
            data: {
                'new_password': new_password,
                'csrfmiddlewaretoken': csrf_token
            },
            success: function (response) {
                $('#passwordSuccess').text(response.message).removeClass('d-none');
                $('#changePasswordForm')[0].reset();
            },
            error: function (xhr) {
                $('#passwordError').text(xhr.responseJSON.error || 'Something went wrong.').removeClass('d-none');
            }
        });
    });
});
