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