from django.db import models
from django.contrib.auth.models import User
import uuid
import os

def user_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'{instance.user.id}.{ext}'
    return os.path.join('user_image', filename)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=15, unique=True)
    address = models.TextField()
    profile_image = models.ImageField(upload_to=user_image_path, 
                                    default='user_image/default.png')

class Role(models.Model):
    role_name = models.CharField(max_length=50, unique=True)
    role_unique_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)