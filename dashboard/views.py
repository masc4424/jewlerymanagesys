from django.shortcuts import render
from user_role_management.models import *
from django.contrib.auth.decorators import login_required

@login_required(login_url='login')
def dashboard_render(request):
    userprofile = UserProfile.objects.get(user=request.user)

    try:
        user_role = UserRole.objects.get(user=request.user)
        role_name = user_role.role.role_name
    except UserRole.DoesNotExist:
        role_name = "Guest"  # or some default like 'Guest'

    return render(request, 'dashboard.html', {
        'userprofile': userprofile,
        'role_name': role_name
    })

@login_required(login_url='login')
def dashboard_client_render(request):
    userprofile = UserProfile.objects.get(user=request.user)

    try:
        user_role = UserRole.objects.get(user=request.user)
        role_name = user_role.role.role_name
        role_u_id = user_role.role.role_unique_id
    except UserRole.DoesNotExist:
        role_name = "Guest"  # or some default like 'Guest'

    # Add this to make the role info available for the sidebar
    user_with_role = request.user
    user_with_role.role_name = role_name  # Attach role_name directly to user object

    return render(request, 'client_dashboard.html', {
        'userprofile': userprofile,
        'role_name': role_name,
        'role_unique_id': role_u_id,
        'user': user_with_role  # Pass the enhanced user object to the template
    })