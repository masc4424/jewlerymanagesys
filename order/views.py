from django.shortcuts import render
from product_inv.models import *
from user_role_management.models import *
import logging
# Initialize logger
log = logging.getLogger(__name__)

def order_list(request):
    # Fetch all statuses from ModelStatus table
    statuses = ModelStatus.objects.all()
    context = {
        'statuses': statuses
    }
    return render(request, 'order_list.html', context)

def add_order(request):
    try:
        client_role = Role.objects.get(role_name='Client')
        clients = User.objects.filter(userrole__role=client_role).distinct()
    except Role.DoesNotExist:
        clients = User.objects.none()
    return render(request, 'add_order.html', {'clients': clients})

def defective_order(request):
    return render(request, 'defective_order.html')

def repeted_order(request):
    return render(request, 'repeted_order.html')

def invoice_list(request):
    return render(request, 'invoice_list.html')

def invoice_add(request):
    return render(request,'invoice_add.html')

def client_order_list(request):
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

    return render(request,'client_order_list.html', {
        'userprofile': userprofile,
        'role_name': role_name,
        'role_unique_id': role_u_id,
        'user': user_with_role
    })