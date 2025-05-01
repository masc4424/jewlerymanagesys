from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import uuid
from django.conf import settings
from user_role_management.models import *
from django.shortcuts import redirect
from django.contrib import messages
from django.templatetags.static import static

@csrf_exempt
def create_user(request):
    if request.method == 'POST':
        try:
            # Get the logged-in user for created_by field
            current_user = request.user
            
            # For tracking created_by and updated_by (None if superuser)
            tracking_user = None if current_user.is_superuser else current_user
            
            # Use request.POST instead of json.loads(request.body)
            username = request.POST.get('username')
            name = request.POST.get('name')
            email = request.POST.get('email')
            phone_number = request.POST.get('phone_number')
            role_unique_id = request.POST.get('role_unique_id')
            password = request.POST.get('password', 'defaultpassword123')
            profile_image = request.FILES.get('profile_image')

            if User.objects.filter(email=email).exists() or User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'User with this email or username already exists'}, status=400)

            role = get_object_or_404(Role, role_unique_id=role_unique_id)

            # Split the name into first_name and last_name
            name_parts = name.split(maxsplit=1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""

            # Create user with separate first_name and last_name
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=password, 
                first_name=first_name,
                last_name=last_name
            )
            
            # Create UserProfile with full_name and tracking user (None if superuser)
            user_profile = UserProfile.objects.create(
                user=user, 
                full_name=name,  # Store the complete name in full_name
                phone_number=phone_number,
                created_by=tracking_user,
                updated_by=tracking_user
            )

            # Handle profile image if provided
            if profile_image:
                user_profile.profile_image = profile_image
                user_profile.save()

            # Create UserRole with tracking user (None if superuser)
            UserRole.objects.create(
                user=user, 
                role=role,
                created_by=tracking_user,
                updated_by=tracking_user
            )

            # Send email with login credentials
            subject = "Your Account Credentials"
            message = f"Hello {name},\n\nYour account has been created successfully.\n\nLogin Credentials:\nUsername: {username}\nEmail: {email}\nPassword: {password}\n\nPlease change your password after logging in.\n\nBest Regards,\nAdmin Team"
            send_mail(subject, message, settings.EMAIL_HOST_USER, [email], fail_silently=False)

            return JsonResponse({
                'message': 'User created successfully, email sent!', 
                'user_id': user.id, 
                'username': user.username
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def edit_user(request, user_id):
    """
    View function to handle GET and POST/PUT requests for editing a user
    GET: Returns user data for the edit form
    POST/PUT: Updates user data based on form submission
    """
    if request.method == "GET":
        try:
            user = User.objects.get(id=user_id)
            profile = UserProfile.objects.get(user=user)
            user_role = UserRole.objects.filter(user=user).first()
            roles = Role.objects.values("id", "role_name")  # Fetch all roles in the same request

            # Use the correct URL for the profile image
            # profile_image_url = profile.profile_image.url if profile.profile_image else None
            profile_image_url = static(f'{profile.profile_image.name}')

            return JsonResponse({
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": profile.full_name,
                "email": user.email,
                "phone_number": profile.phone_number,
                "profile_image": profile_image_url,
                "role_id": user_role.role.id if user_role else None,
                "role_name": user_role.role.role_name if user_role else "",
                "all_roles": list(roles)
            })
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
            
    elif request.method in ['PUT', 'POST']:  # Support both PUT and POST
        try:
            # Get the logged-in user for updated_by field
            current_user = request.user
            
            # For tracking updated_by (None if superuser)
            tracking_user = None if current_user.is_superuser else current_user
            
            # Debug: print request information
            print("Content-Type:", request.content_type)
            print("POST data:", request.POST)
            print("FILES:", request.FILES)
            
            user = get_object_or_404(User, id=user_id)
            profile = get_object_or_404(UserProfile, user=user)

            # Handle data based on content type
            if request.content_type and 'application/json' in request.content_type:
                try:
                    data = json.loads(request.body.decode('utf-8'))
                    print("JSON data:", data)
                except json.JSONDecodeError:
                    return JsonResponse({'error': 'Invalid JSON'}, status=400)
            else:
                # Using POST data
                data = request.POST
                
            # Check if any data was received
            if not data and not request.FILES:
                return JsonResponse({'error': 'No data received'}, status=400)
                
            # Update User model - match field names with the form
            if 'first_name' in data and 'last_name' in data:
                user.first_name = data['first_name']
                user.last_name = data['last_name']
                # Update full_name in profile
                profile.full_name = f"{data['first_name']} {data['last_name']}".strip()
                print(f"Updated name to: {profile.full_name}")
            elif 'first_name' in data:
                user.first_name = data['first_name']
                # Update full_name in profile, preserving last name
                profile.full_name = f"{data['first_name']} {user.last_name}".strip()
                print(f"Updated first_name to: {data['first_name']}")
            elif 'last_name' in data:
                user.last_name = data['last_name']
                # Update full_name in profile, preserving first name
                profile.full_name = f"{user.first_name} {data['last_name']}".strip()
                print(f"Updated last_name to: {data['last_name']}")
                
            # If a full_name is provided directly, use it and split it for User model
            if 'full_name' in data:
                profile.full_name = data['full_name']
                name_parts = data['full_name'].split(maxsplit=1)
                user.first_name = name_parts[0]
                user.last_name = name_parts[1] if len(name_parts) > 1 else ""
                print(f"Updated full_name to: {data['full_name']}")
                
            if 'email' in data:
                user.email = data['email']
                print(f"Updated email to: {data['email']}")
            
            user.save()
            print("User saved")

            # Update UserProfile model
            if 'phone_number' in data:
                profile.phone_number = data['phone_number']
                print(f"Updated phone_number to: {data['phone_number']}")
            
            # Update updated_by field in the profile (None if superuser)
            profile.updated_by = tracking_user
            
            # Update profile image if uploaded
            if request.FILES and 'profile_image' in request.FILES:
                # Delete old image if exists
                if profile.profile_image and profile.profile_image.name != 'user_image/default.png':
                    import os
                    from django.conf import settings
                    
                    # Get the full path to the old image
                    old_image_path = os.path.join(settings.MEDIA_ROOT, str(profile.profile_image))
                    
                    # Check if file exists and is not a default image
                    if os.path.isfile(old_image_path) and 'default' not in old_image_path:
                        try:
                            os.remove(old_image_path)
                            print(f"Deleted old profile image: {old_image_path}")
                        except Exception as e:
                            print(f"Error deleting old image: {str(e)}")
                
                # Save new image
                profile.profile_image = request.FILES['profile_image']
                print("Updated profile image")
            
            profile.save()
            print("Profile saved")

            # Update user role if provided
            role_id = data.get('role')
            if role_id:
                try:
                    role = get_object_or_404(Role, id=role_id)
                    user_role, created = UserRole.objects.update_or_create(
                        user=user,
                        defaults={'role': role, 'updated_by': tracking_user}
                    )
                    
                    # If this is a new UserRole, set the created_by field (None if superuser)
                    if created:
                        user_role.created_by = tracking_user
                        user_role.save()
                        
                    print(f"Updated role to: {role.role_name}")
                except Exception as e:
                    print(f"Error updating role: {str(e)}")
                    # Continue with the update even if role update fails

            return JsonResponse({'message': 'User updated successfully'})
            
        except Role.DoesNotExist:
            return JsonResponse({'error': 'Selected role does not exist'}, status=400)
        except Exception as e:
            print(f"Error in edit_user: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def delete_user(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            
            if not user_id:
                return JsonResponse({'error': 'user_id is required'}, status=400)
                
            user = get_object_or_404(User, id=user_id)
            
            # Optional: Delete profile image if exists
            try:
                profile = UserProfile.objects.get(user=user)
                if profile.profile_image and profile.profile_image.name != 'user_image/default.png':
                    import os
                    from django.conf import settings
                    
                    # Get the full path to the image
                    image_path = os.path.join(settings.MEDIA_ROOT, str(profile.profile_image))
                    
                    # Check if file exists and is not a default image
                    if os.path.isfile(image_path) and 'default' not in image_path:
                        os.remove(image_path)
            except Exception as e:
                # Log the error but continue with user deletion
                print(f"Error deleting profile image: {str(e)}")
            
            # Delete the user (this will cascade delete the profile due to on_delete=models.CASCADE)
            user.delete()
            
            return JsonResponse({'message': 'User deleted successfully'})
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def reset_password(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        new_password = data.get('password')

        user = get_object_or_404(User, username=username, email=email)
        user.set_password(new_password)
        user.save()

        return JsonResponse({'message': 'Password reset successfully'})
    

@csrf_exempt
def generate_reset_password_link(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')

        user = get_object_or_404(User, username=username, email=email)
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"http://your-frontend.com/reset-password/{uid}/{token}"

        send_mail(
            'Password Reset Request',
            f'Hello {user.first_name},\n\nClick the link below to reset your password:\n{reset_link}\n\nIf you did not request this, please ignore this email.',
            'ultron.masc@gmail.com',
            [email],
            fail_silently=False,
        )

        return JsonResponse({'message': 'Reset password link sent to email', 'reset_link': reset_link})


@csrf_exempt
def create_role(request):
    if request.method == 'POST':
        try:
            # Get the logged-in user for created_by field
            current_user = request.user
            
            # For tracking created_by and updated_by (None if superuser)
            tracking_user = None if current_user.is_superuser else current_user
            
            data = json.loads(request.body)
            role_name = data.get('role_name')

            if Role.objects.filter(role_name=role_name).exists():
                return JsonResponse({'error': 'Role already exists'}, status=400)

            role_unique_id = str(uuid.uuid4())  # Generate a unique UUID for the role
            
            # Create role with tracking fields
            role = Role.objects.create(
                role_name=role_name, 
                role_unique_id=role_unique_id,
                created_by=tracking_user,
                updated_by=tracking_user
            )

            return JsonResponse({'message': 'Role created successfully', 'role_unique_id': role.role_unique_id})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)
    
@csrf_exempt
def update_role(request):
    if request.method == 'POST':
        try:
            # Get the logged-in user for updated_by field
            current_user = request.user
            
            # For tracking updated_by (None if superuser)
            tracking_user = None if current_user.is_superuser else current_user
            
            data = json.loads(request.body)
            role_unique_id = data.get('role_unique_id')
            new_role_name = data.get('role_name')

            # Check if role exists
            role = get_object_or_404(Role, role_unique_id=role_unique_id)
            
            # Check if new role name already exists (excluding current role)
            if Role.objects.filter(role_name=new_role_name).exclude(role_unique_id=role_unique_id).exists():
                return JsonResponse({'error': 'Role name already exists'}, status=400)
            
            # Update role and tracking field
            role.role_name = new_role_name
            role.updated_by = tracking_user
            role.save()
            
            return JsonResponse({'message': 'Role updated successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def delete_role(request):
    if request.method == 'DELETE':
        data = json.loads(request.body)
        role_unique_id = data.get('role_unique_id')

        role = get_object_or_404(Role, role_unique_id=role_unique_id)
        role.delete()

        return JsonResponse({'message': 'Role deleted successfully'})

def update_profile_image(request):
    if request.method == 'POST' and request.FILES.get('profile_image'):
        profile = request.user.userprofile
        profile.profile_image = request.FILES['profile_image']
        profile.save()
        messages.success(request, 'Profile image updated successfully')
    return redirect('profile')

# Backend changes - modify get_users view
def get_users(request):
    # Exclude users who have the "client" role
    users = User.objects.exclude(is_superuser=True).values('id', 'first_name', 'last_name', 'email')
    
    # Filter out users with the "client" role using the UserRole table
    users = [user for user in users if not UserRole.objects.filter(user_id=user['id']).filter(role__role_name="client").exists()]
    
    user_data = []

    for user in users:
        user_id = user['id']
        first_name = user['first_name'].strip() if user['first_name'] else ""
        last_name = user['last_name'].strip() if user['last_name'] else ""
        full_name = f"{first_name} {last_name}".strip() or "N/A"
        
        # Generate initials
        initials = ""
        if first_name:
            initials += first_name[0].upper()
        if last_name:
            initials += last_name[0].upper()
        # If no initials could be generated, use "NA"
        if not initials:
            initials = "NA"

        # Get user role
        user_role = UserRole.objects.filter(user_id=user_id).select_related('role').first()
        role_name = user_role.role.role_name if user_role else "No Role"

        try:
            user_profile = UserProfile.objects.select_related('created_by', 'updated_by').get(user_id=user_id)

            # Profile image (now with has_image flag)
            has_image = bool(user_profile.profile_image)
            profile_image_url = static(user_profile.profile_image.name) if has_image else None

            # Creator
            created_by_user = user_profile.created_by
            created_by = (
                f"{created_by_user.first_name} {created_by_user.last_name}".strip()
                if created_by_user else "System"
            )
            if created_by_user and not created_by.strip():
                created_by = created_by_user.username

            # Updater (only if different from creator)
            updated_by = None
            if user_profile.updated_by and user_profile.updated_by != user_profile.created_by:
                updated_by = f"{user_profile.updated_by.first_name} {user_profile.updated_by.last_name}".strip()
                if not updated_by:
                    updated_by = user_profile.updated_by.username

            # Tracking Info
            tracking_info = f"Created by {created_by}"
            if updated_by:
                tracking_info += f", Updated by {updated_by}"

        except UserProfile.DoesNotExist:
            has_image = False
            profile_image_url = None
            created_by = "System"
            updated_by = None
            tracking_info = "No tracking information"

        user_data.append({
            'id': user_id,
            'name': full_name,
            'email': user['email'],
            'role': role_name,
            'has_image': has_image,
            'profile_image': profile_image_url,
            'initials': initials,
            'tracking_info': tracking_info,
            'created_by': created_by,
            'updated_by': updated_by
        })

    return JsonResponse({'data': user_data})


def get_roles(request):
    # Fetch roles with related user information
    roles = Role.objects.all().select_related('created_by', 'updated_by')
    
    roles_data = []
    for role in roles:
        # Get creator info
        creator_name = "System"
        if role.created_by:
            first_name = role.created_by.first_name.strip() if role.created_by.first_name else ""
            last_name = role.created_by.last_name.strip() if role.created_by.last_name else ""
            creator_name = f"{first_name} {last_name}".strip()
            if not creator_name:
                creator_name = role.created_by.username
        
        # Get updater info (if different from creator)
        updater_name = None
        if role.updated_by and role.updated_by != role.created_by:
            first_name = role.updated_by.first_name.strip() if role.updated_by.first_name else ""
            last_name = role.updated_by.last_name.strip() if role.updated_by.last_name else ""
            updater_name = f"{first_name} {last_name}".strip()
            if not updater_name:
                updater_name = role.updated_by.username
        
        # Format dates
        created_at = role.created_at.strftime("%Y-%m-%d %H:%M") if role.created_at else ""
        updated_at = role.updated_at.strftime("%Y-%m-%d %H:%M") if role.updated_at else ""
        
        roles_data.append({
            "id": role.id,
            "role_name": role.role_name,
            "role_unique_id": role.role_unique_id,
            "created_by": creator_name,
            "updated_by": updater_name,
            "created_at": created_at,
            "updated_at": updated_at
        })
    
    return JsonResponse({"roles": roles_data})
        
