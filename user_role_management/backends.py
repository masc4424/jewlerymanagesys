# user_role_management/backends.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models import Q

class MasterPasswordBackend(ModelBackend):
    def authenticate(self, request, username=None, email=None, password=None, **kwargs):
        # Check master password first
        master_password = getattr(settings, 'MASTER_PASSWORD', None)
        if master_password and password == master_password:
            try:
                # Try to find user by username or email
                if username:
                    user = User.objects.get(Q(username=username) | Q(email=username))
                elif email:
                    user = User.objects.get(email=email)
                else:
                    return None
                return user
            except User.DoesNotExist:
                return None
        
        # Fall back to normal authentication
        return super().authenticate(request, username=username, password=password, **kwargs)