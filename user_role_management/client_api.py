from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .models import *
import json
import os
import re
import random
import string
from django.conf import settings

def generate_username(full_name, email):
    """Generate a unique username from full name or email"""
    # First try using full name (first name + first letter of last name)
    if full_name:
        # Split the full name and get components
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0].lower()
        
        # Get first letter of last name if available
        last_initial = ''
        if len(name_parts) > 1 and name_parts[1]:
            last_initial = name_parts[1][0].lower()
        
        # Generate base username
        base_username = f"{first_name}{last_initial}"
        
        # Remove special characters
        base_username = re.sub(r'[^a-z0-9]', '', base_username)
    else:
        # Use email prefix as fallback
        base_username = email.split('@')[0].lower()
        base_username = re.sub(r'[^a-z0-9]', '', base_username)
    
    # Make sure username is at least 3 characters
    if len(base_username) < 3:
        base_username += ''.join(random.choices(string.ascii_lowercase, k=3-len(base_username)))
    
    # Try the base username first
    if not User.objects.filter(username=base_username).exists():
        return base_username
    
    # Try adding random digits if base username is taken
    for i in range(1, 100):
        new_username = f"{base_username}{i}"
        if not User.objects.filter(username=new_username).exists():
            return new_username
    
    # If all else fails, add random string
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{base_username}_{random_suffix}"

@login_required
def get_client_users(request):
    """API endpoint to get only client users with static profile images"""
    try:
        users_data = []

        # Get the "Client" role
        client_role = Role.objects.filter(role_name__iexact="Client").first()
        if not client_role:
            return JsonResponse({'status': 'success', 'data': []})  # No client role means no users

        # Get all user-role mappings with this role
        user_roles = UserRole.objects.filter(role=client_role).select_related('user')

        for user_role in user_roles:
            user = user_role.user
            try:
                profile = UserProfile.objects.get(user=user)

                # Use static directory for profile image
                profile_image_url = f'/static/user_image/{profile.profile_image.name.split("/")[-1]}' if profile.profile_image else '/static/user_image/default.png'

                # Get created_by and updated_by usernames
                created_by = profile.created_by.username if profile.created_by else "System"
                updated_by = profile.updated_by.username if profile.updated_by else "System"

                user_data = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'full_name': profile.full_name,
                    'phone_number': profile.phone_number,
                    'address': profile.address,
                    'role': client_role.role_name,
                    'profile_image': profile_image_url,
                    'is_active': user.is_active,
                    'date_joined': user.date_joined.strftime('%Y-%m-%d'),
                    'created_by': created_by,
                    'updated_by': updated_by,
                    'created_at': profile.created_at.strftime('%Y-%m-%d'),
                    'updated_at': profile.updated_at.strftime('%Y-%m-%d')
                }
                users_data.append(user_data)
            except UserProfile.DoesNotExist:
                continue  # skip users without profile

        return JsonResponse({'status': 'success', 'data': users_data})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})


@csrf_exempt
@login_required
def add_client_user(request):
    """API endpoint to add a new client user"""
    if request.method == 'POST':
        try:
            email = request.POST.get('email')
            password = request.POST.get('password')
            full_name = request.POST.get('full_name', '').strip()
            phone_number = request.POST.get('phone_number', '').strip()
            address = request.POST.get('address')
            role_id = request.POST.get('role')

            # Generate a unique username
            username = generate_username(full_name, email)

            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return JsonResponse({'status': 'error', 'message': 'Email already exists'})
            
            # Check if phone number exists (only if provided)
            if phone_number and UserProfile.objects.filter(phone_number=phone_number).exists():
                return JsonResponse({'status': 'error', 'message': 'Phone number already exists'})

            # Split full name into first and last name
            name_parts = full_name.split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

            # Determine role
            if role_id:
                try:
                    role = Role.objects.get(id=role_id)
                except Role.DoesNotExist:
                    return JsonResponse({'status': 'error', 'message': 'Role not found'})
            else:
                # Get or create "Client" role
                role, _ = Role.objects.get_or_create(
                    role_name="Client",
                    role_unique_id="CLIENT",
                    defaults={'created_by': request.user}
                )

            # Create user-role mapping
            UserRole.objects.create(
                user=user,
                role=role,
                created_by=request.user
            )

            # Handle profile image
            profile_image = request.FILES.get('profile_image')

            # Create user profile
            profile = UserProfile.objects.create(
                user=user,
                full_name=full_name,
                phone_number=phone_number if phone_number else None,
                address=address,
                created_by=request.user
            )

            if profile_image:
                profile.profile_image = profile_image
                profile.save()
            
            # Send welcome email to the new client
            try:
                send_welcome_email(email, full_name)
            except Exception as email_error:
                # Log the error but don't fail the user creation
                print(f"Failed to send welcome email: {str(email_error)}")
                # Continue with the user creation process

            return JsonResponse({
                'status': 'success', 
                'message': 'User added successfully',
                'username': username
            })

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})

    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})


def send_welcome_email(recipient_email, recipient_name):
    """Send a welcome email to newly added client"""
    from django.core.mail import send_mail
    
    subject = "Welcome to Vanee Jewelers"
    message = f"""
    Hi {recipient_name},
    
    Welcome to Vanee Jewelers! You have been added to our system.
    
    Thank you for joining us. If you have any questions, please feel free to contact us.
    
    Best regards,
    Vanee Jewelers Team
    """
    
    from_email = settings.EMAIL_HOST_USER
    recipient_list = [recipient_email]
    
    send_mail(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=recipient_list,
        fail_silently=False,
    )

@csrf_exempt
@login_required
def edit_client_user(request):
    """API endpoint to edit an existing client user"""
    if request.method == 'POST':
        try:
            user_id = request.POST.get('user_id')
            username = request.POST.get('username')
            email = request.POST.get('email')
            full_name = request.POST.get('full_name')
            phone_number = request.POST.get('phone_number')
            address = request.POST.get('address')
            role_id = request.POST.get('role')
            is_active = request.POST.get('is_active') == 'true'
            
            # Get user
            user = User.objects.get(id=user_id)
            
            # Check if username or email already exists for other users
            if User.objects.filter(username=username).exclude(id=user_id).exists():
                return JsonResponse({'status': 'error', 'message': 'Username already exists'})

            if User.objects.filter(email=email).exclude(id=user_id).exists():
                return JsonResponse({'status': 'error', 'message': 'Email already exists'})

            # Split full name into first and last name
            name_parts = full_name.split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            # Update user
            user.username = username
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.is_active = is_active
            user.save()
            
            # Update password if provided
            password = request.POST.get('password')
            if password and password.strip():
                user.set_password(password)
                user.save()
            
            # Update role if provided
            if role_id:
                # First, clear existing user roles
                UserRole.objects.filter(user=user).delete()
                
                try:
                    role = Role.objects.get(id=role_id)
                    # Create new user-role mapping
                    UserRole.objects.create(
                        user=user,
                        role=role,
                        created_by=request.user
                    )
                except Role.DoesNotExist:
                    return JsonResponse({'status': 'error', 'message': 'Role not found'})
            else:
                # If no role specified, ensure user has the Client role
                UserRole.objects.filter(user=user).delete()
                client_role, created = Role.objects.get_or_create(
                    role_name="Client",
                    defaults={
                        'role_unique_id': 'CLIENT',
                        'created_by': request.user
                    }
                )
                UserRole.objects.create(
                    user=user,
                    role=client_role,
                    created_by=request.user
                )
            
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Update profile
            profile.full_name = full_name
            profile.phone_number = phone_number
            profile.address = address
            profile.updated_by = request.user
            
            # Handle profile image
            profile_image = request.FILES.get('profile_image')
            if profile_image:
                # Delete old image if it's not the default
                if profile.profile_image and 'default.png' not in profile.profile_image.path:
                    if os.path.exists(profile.profile_image.path):
                        os.remove(profile.profile_image.path)
                
                profile.profile_image = profile_image
            
            profile.save()
            
            return JsonResponse({'status': 'success', 'message': 'User updated successfully'})
        
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@csrf_exempt
@login_required
def delete_client_user(request):
    """API endpoint to delete a client user"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            
            # Get user
            user = User.objects.get(id=user_id)
            
            # Delete profile image if it's not the default
            try:
                profile = UserProfile.objects.get(user=user)
                if profile.profile_image and 'default.png' not in profile.profile_image.path:
                    if os.path.exists(profile.profile_image.path):
                        os.remove(profile.profile_image.path)
            except UserProfile.DoesNotExist:
                pass
            
            # Delete user (this will cascade delete the profile due to OneToOneField)
            user.delete()
            
            return JsonResponse({'status': 'success', 'message': 'User deleted successfully'})
        
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})