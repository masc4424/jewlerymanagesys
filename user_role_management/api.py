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

@csrf_exempt
def create_user(request):
    if request.method == 'POST':
        try:
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

            # Create user and related models
            user = User.objects.create_user(username=username, email=email, password=password, first_name=name)
            user_profile = UserProfile.objects.create(user=user, full_name=name, phone_number=phone_number)

            # Handle profile image if provided
            if profile_image:
                user_profile.profile_image = profile_image
                user_profile.save()

            UserRole.objects.create(user=user, role=role)

            # Send email with login credentials
            subject = "Your Account Credentials"
            message = f"Hello {name},\n\nYour account has been created successfully.\n\nLogin Credentials:\nUsername: {username}\nEmail: {email}\nPassword: {password}\n\nPlease change your password after logging in.\n\nBest Regards,\nAdmin Team"
            send_mail(subject, message, settings.EMAIL_HOST_USER, [email], fail_silently=False)

            return JsonResponse({'message': 'User created successfully, email sent!', 'user_id': user.id, 'username': user.username})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def edit_user(request, user_id):
    if request.method == "GET":
        user = User.objects.get(id=user_id)
        profile = UserProfile.objects.get(user_id=user)
        user_role = UserRole.objects.filter(user=user).first()
        roles = Role.objects.values("id", "role_name")  # Fetch all roles in the same request

        # Set the image URL to STATIC path instead of MEDIA path
        profile_image = profile.profile_image
        profile_image_url = f"{settings.STATIC_URL}{profile_image}"

        return JsonResponse({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone_number": profile.phone_number,
            "profile_image": profile_image_url,  # Now using STATIC_URL
            "role_id": user_role.role.id if user_role else None,
            "role_name": user_role.role.role_name if user_role else "",
            "all_roles": list(roles)
        })
    if request.method in ['PUT', 'POST']:  # Support both PUT and POST
        user = get_object_or_404(User, id=user_id)
        profile = get_object_or_404(UserProfile, user=user)

        data = {}  # Default empty data

        # Handle JSON and Form Data
        try:
            data = json.loads(request.body.decode('utf-8'))
            print("✅ JSON data received")
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
            print("📌 Using form data")
            data = request.POST  # Use form data if JSON parsing fails

        # Update User model
        user.first_name = data.get('name', user.first_name)
        user.email = data.get('email', user.email)
        user.save()

        # Update UserProfile model
        profile.full_name = data.get('full_name', profile.full_name)
        profile.phone_number = data.get('phone_number', profile.phone_number)
        profile.address = data.get('address', profile.address)

        # Update profile image if uploaded
        if request.FILES.get('profile_image'):
            profile.profile_image = request.FILES['profile_image']

        profile.save()

        # Update user role if provided
        if data.get('role_tag'):
            role = get_object_or_404(Role, role_name=data['role_tag'])
            UserRole.objects.filter(user=user).update(role=role)

        return JsonResponse({'message': 'User updated successfully'})


@csrf_exempt
def delete_user(request):
    if request.method == 'DELETE':
        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')

        user = get_object_or_404(User, username=username, email=email)
        user.delete()

        return JsonResponse({'message': 'User deleted successfully'})


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
        data = json.loads(request.body)
        role_name = data.get('role_name')

        if Role.objects.filter(role_name=role_name).exists():
            return JsonResponse({'error': 'Role already exists'}, status=400)

        role_unique_id = str(uuid.uuid4())  # Generate a unique UUID for the role
        role = Role.objects.create(role_name=role_name, role_unique_id=role_unique_id)

        return JsonResponse({'message': 'Role created successfully', 'role_unique_id': role.role_unique_id})


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

def get_users(request):
    users = User.objects.exclude(is_superuser=True).values('id', 'first_name', 'last_name', 'email')
    user_data = []

    for user in users:
        user_role = UserRole.objects.filter(user_id=user['id']).select_related('role').first()
        role_name = user_role.role.role_name if user_role else "No Role"
        
        full_name = f"{user['first_name']} {user['last_name']}".strip()  # Concatenate first & last name

        user_data.append({
            'id': user['id'],
            'name': full_name if full_name else "N/A",  # Handle empty names
            'email': user['email'],
            'role': role_name
        })

    return JsonResponse({'data': user_data})

def get_roles(request):
    roles = Role.objects.all().values("id", "role_name", "role_unique_id")
    return JsonResponse({"roles": list(roles)})