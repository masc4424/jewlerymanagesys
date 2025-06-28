from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from user_role_management.models import *

@login_required(login_url='login_auth')
def user_table(request):
    users = User.objects.all()
    roles = Role.objects.all()
    context = {
        'users': users,
        'roles': roles
    }
    return render(request, 'users_table.html', context)

@login_required(login_url='login_auth')
def role_list(request):
    return render(request, 'role_management_table.html')

@login_required(login_url='login_auth')
def client_users(request):
    users = User.objects.all()
    roles = Role.objects.all()
    context = {
        'users': users,
        'roles': roles
    }
    return render(request, 'client_users.html', context)