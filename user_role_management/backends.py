# user_role_management/backends.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models import Q

class MasterPasswordBackend(ModelBackend):
    def authenticate(self, request, username=None, email=None, password=None, **kwargs):
        master_password = getattr(settings, 'MASTER_PASSWORD', None)
        if master_password and password == master_password:
            try:
                if email:
                    user = User.objects.get(Q(email=email) | Q(username=email))
                elif username:
                    user = User.objects.get(Q(username=username) | Q(email=username))
                else:
                    return None
                
                # Ensure user is active
                if user.is_active:
                    return user
                    
            except User.DoesNotExist:
                return None
        return None

    def get_user(self, user_id):
        """This method is crucial for session persistence"""
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None