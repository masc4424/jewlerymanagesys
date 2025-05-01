from django.contrib import admin
from .models import UserProfile, Role, UserRole

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'phone_number', 'address', 'created_by', 'updated_by', 'created_at', 'updated_at')
    search_fields = ('user__username', 'full_name', 'phone_number')
    readonly_fields = ('created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('role_name', 'role_unique_id', 'created_by', 'updated_by', 'created_at', 'updated_at')
    search_fields = ('role_name', 'role_unique_id')
    readonly_fields = ('created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'created_by', 'updated_by', 'created_at', 'updated_at')
    search_fields = ('user__username', 'role__role_name')
    readonly_fields = ('created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
