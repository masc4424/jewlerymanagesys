from django.shortcuts import render
from product_inv.models import *
from user_role_management.models import *
import logging
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
# Initialize logger
log = logging.getLogger(__name__)

@login_required(login_url='login_auth')
def order_list(request):
    # Fetch all statuses from ModelStatus table
    statuses = ModelStatus.objects.all()
    context = {
        'statuses': statuses
    }
    return render(request, 'order_list.html', context)

@login_required(login_url='login_auth')
def add_order(request):
    try:
        client_role = Role.objects.get(role_name='Client')
        clients = User.objects.filter(userrole__role=client_role).distinct()
    except Role.DoesNotExist:
        clients = User.objects.none()
    return render(request, 'add_order.html', {'clients': clients})

@login_required(login_url='login_auth')
def defective_order(request):
    return render(request, 'defective_order.html')

@login_required(login_url='login_auth')
def repeted_order(request):
    return render(request, 'repeted_order.html')

@login_required(login_url='login_auth')
def invoice_list(request):
    return render(request, 'invoice_list.html')

@login_required(login_url='login_auth')
def invoice_add(request):
    return render(request,'invoice_add.html')

@login_required(login_url='login_auth')
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

@login_required(login_url='login_auth')
def add_to_cart_side_view(request, client_id):
    if request.method == "GET" and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        client = get_object_or_404(User, id=client_id)

        html = render(request, 'add_to_cart_side.html', {
            'client': client,
        }).content.decode('utf-8')

        return JsonResponse({'status': 'success', 'html': html})

    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)