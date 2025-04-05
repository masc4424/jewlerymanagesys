from django.contrib import admin
from .models import UserProfile, Role, UserRole

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'phone_number', 'address')
    search_fields = ('user__username', 'full_name', 'phone_number')

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('role_name', 'role_unique_id')
    search_fields = ('role_name', 'role_unique_id')

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    search_fields = ('user__username', 'role__role_name')
