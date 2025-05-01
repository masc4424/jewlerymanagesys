from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from user_role_management.models import *

@csrf_exempt
def login_api(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        # Authenticate user
        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            login(request, user)
                        # Check user role for redirection
            try:
                user_role = UserRole.objects.get(user=user)
                role = user_role.role
                
                # Redirect based on role
                if role.role_unique_id == "CLIENT":
                    return redirect('client_dashboard')
                else:
                    # For other roles like admin, staff, etc.
                    return redirect('dashboard')
            except UserRole.DoesNotExist:
                # If no role assigned, redirect to default dashboard
                return redirect('dashboard')
        else:
            messages.error(request, 'Invalid email or password')
            return render(request, 'loginauth.html')
    
    return render(request, 'loginauth.html')

def logout_api(request):
    logout(request)
    return redirect('login_auth')  # Redirect back to login page