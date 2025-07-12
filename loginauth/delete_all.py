from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.management import call_command
from django.db import connection
from django.apps import apps
from django.conf import settings
import os

# Set your secret wipe code here - change this!
WIPE_SECRET_CODE = os.environ.get('DB_WIPE_SECRET', 'DELETE4424')

@csrf_exempt
def delete_all(request, code):
    """
    View function to completely wipe the database.
    URL: /delete_all/code=<secret_code>/
    
    Works with GET or POST requests for easy Postman testing.
    """
    
    try:
        # Verify secret code from URL parameter
        if not code or code != WIPE_SECRET_CODE:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or missing secret code',
                'provided_code': code,
                'hint': 'Check your secret code in the URL'
            }, status=403)
        
        # Additional safety check - only allow in DEBUG mode or with explicit env var
        if not (settings.DEBUG or os.environ.get('ALLOW_DB_WIPE') == 'true'):
            return JsonResponse({
                'success': False,
                'error': 'Database wipe not allowed in production',
                'debug_mode': settings.DEBUG,
                'allow_wipe_env': os.environ.get('ALLOW_DB_WIPE')
            }, status=403)
        
        # Get some stats before wiping
        total_tables = 0
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
            """)
            total_tables = cursor.fetchone()[0]
        
        # Method 1: Try Django flush command first (safest) - but it won't preserve superuser data
        # So we'll skip flush and go directly to manual method for superuser preservation
        try:
            # Instead of flush, use manual method that preserves superuser data
            return manual_database_wipe(code, total_tables, "Skipped flush to preserve superuser data")
            
        except Exception as manual_error:
            return JsonResponse({
                'success': False,
                'error': f'Database wipe failed: {str(manual_error)}',
                'secret_code_used': code
            }, status=500)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'secret_code_used': code
        }, status=500)


def manual_database_wipe(code, total_tables, flush_error):
    """
    Manual database wipe as fallback method - preserves super admin data
    """
    try:
        tables_deleted = []
        
        with connection.cursor() as cursor:
            # Get all table names
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
            """)
            tables = [row[0] for row in cursor.fetchall()]
            
            # Disable foreign key checks (MySQL/MariaDB)
            try:
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            except:
                pass  # Different DB might not support this
            
            # Delete all data from tables (TRUNCATE is faster than DELETE)
            for table in tables:
                try:
                    # Special handling for auth_user table - preserve superusers
                    if table == 'auth_user':
                        cursor.execute("DELETE FROM `auth_user` WHERE is_superuser = 0")
                        tables_deleted.append(f"{table} (superusers preserved)")
                    
                    # Special handling for UserProfile table - preserve superuser profiles
                    elif 'userprofile' in table.lower():
                        # Delete UserProfile records not linked to superusers
                        cursor.execute("""
                            DELETE FROM `{}` 
                            WHERE user_id NOT IN (
                                SELECT id FROM auth_user WHERE is_superuser = 1
                            )
                        """.format(table))
                        tables_deleted.append(f"{table} (superuser profiles preserved)")
                    
                    else:
                        # For all other tables, clear completely
                        cursor.execute(f"TRUNCATE TABLE `{table}`")
                        tables_deleted.append(table)
                        
                except Exception as e:
                    # If TRUNCATE fails, try DELETE
                    try:
                        if table == 'auth_user':
                            cursor.execute("DELETE FROM `auth_user` WHERE is_superuser = 0")
                            tables_deleted.append(f"{table} (superusers preserved)")
                        elif 'userprofile' in table.lower():
                            cursor.execute("""
                                DELETE FROM `{}` 
                                WHERE user_id NOT IN (
                                    SELECT id FROM auth_user WHERE is_superuser = 1
                                )
                            """.format(table))
                            tables_deleted.append(f"{table} (superuser profiles preserved)")
                        else:
                            cursor.execute(f"DELETE FROM `{table}`")
                            tables_deleted.append(table)
                    except Exception as delete_error:
                        print(f"Error clearing table {table}: {delete_error}")
            
            # Re-enable foreign key checks
            try:
                cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            except:
                pass
        
        return JsonResponse({
            'success': True,
            'message': f'Database successfully wiped using manual method. {len(tables_deleted)} tables processed. Superuser data preserved.',
            'method': 'manual_truncate_with_superuser_preservation',
            'tables_processed': tables_deleted,
            'total_tables': total_tables,
            'flush_error': flush_error,
            'secret_code_used': code,
            'note': 'Superuser accounts and their profiles were preserved'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Manual wipe also failed: {str(e)}',
            'flush_error': flush_error,
            'secret_code_used': code
        }, status=500)


@csrf_exempt
def delete_all_orm(request, code):
    """
    Alternative view using Django ORM to delete all data (keeps table structure)
    URL: /delete_all_orm/code=<secret_code>/
    """
    
    try:
        # Verify secret code
        if not code or code != WIPE_SECRET_CODE:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or missing secret code'
            }, status=403)
        
        # Safety check
        if not (settings.DEBUG or os.environ.get('ALLOW_DB_WIPE') == 'true'):
            return JsonResponse({
                'success': False,
                'error': 'Database wipe not allowed in production'
            }, status=403)
        
        models_deleted = {}
        total_records = 0
        
        # Get all models from all apps
        for model in apps.get_models():
            model_name = f"{model._meta.app_label}.{model.__name__}"
            try:
                count = model.objects.count()
                
                # Skip super admin data preservation for specific models
                if model_name == 'auth.User':
                    # Delete all users except superusers
                    non_superuser_count = model.objects.filter(is_superuser=False).count()
                    model.objects.filter(is_superuser=False).delete()
                    total_records += non_superuser_count
                    superuser_count = model.objects.filter(is_superuser=True).count()
                    models_deleted[model_name] = f"{non_superuser_count} records deleted, {superuser_count} superusers preserved"
                    
                elif hasattr(model, '_meta') and model._meta.object_name == 'UserProfile':
                    # Delete UserProfile records except those linked to superusers
                    from django.contrib.auth.models import User
                    superuser_ids = User.objects.filter(is_superuser=True).values_list('id', flat=True)
                    non_superuser_profiles = model.objects.exclude(user_id__in=superuser_ids)
                    non_superuser_count = non_superuser_profiles.count()
                    non_superuser_profiles.delete()
                    total_records += non_superuser_count
                    preserved_count = model.objects.filter(user_id__in=superuser_ids).count()
                    models_deleted[model_name] = f"{non_superuser_count} records deleted, {preserved_count} superuser profiles preserved"
                    
                else:
                    # Delete all records for other models
                    total_records += count
                    if count > 0:
                        model.objects.all().delete()
                        models_deleted[model_name] = f"{count} records deleted"
                    else:
                        models_deleted[model_name] = "0 records (already empty)"
                        
            except Exception as e:
                models_deleted[model_name] = f"Error: {str(e)}"
        
        return JsonResponse({
            'success': True,
            'message': f'Database data successfully wiped using ORM. {total_records} total records deleted.',
            'method': 'django_orm',
            'models_processed': models_deleted,
            'total_records_deleted': total_records,
            'secret_code_used': code
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'ORM wipe error: {str(e)}',
            'secret_code_used': code
        }, status=500)


@csrf_exempt
def wipe_status(request):
    """
    Get database status without wiping - includes super admin counts
    URL: /wipe_status/
    """
    try:
        status_info = {}
        
        # Get table count
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
            """)
            status_info['total_tables'] = cursor.fetchone()[0]
        
        # Get model counts with super admin details
        model_counts = {}
        total_records = 0
        superuser_info = {}
        
        for model in apps.get_models():
            model_name = f"{model._meta.app_label}.{model.__name__}"
            try:
                count = model.objects.count()
                
                # Special handling for auth.User model - count superusers
                if model_name == 'auth.User':
                    superuser_count = model.objects.filter(is_superuser=True).count()
                    regular_user_count = model.objects.filter(is_superuser=False).count()
                    model_counts[model_name] = {
                        'total': count,
                        'superusers': superuser_count,
                        'regular_users': regular_user_count
                    }
                    superuser_info['superuser_accounts'] = superuser_count
                    superuser_info['regular_user_accounts'] = regular_user_count
                    
                # Special handling for UserProfile model - count superuser profiles
                elif hasattr(model, '_meta') and model._meta.object_name == 'UserProfile':
                    from django.contrib.auth.models import User
                    superuser_ids = User.objects.filter(is_superuser=True).values_list('id', flat=True)
                    superuser_profiles = model.objects.filter(user_id__in=superuser_ids).count()
                    regular_profiles = model.objects.exclude(user_id__in=superuser_ids).count()
                    model_counts[model_name] = {
                        'total': count,
                        'superuser_profiles': superuser_profiles,
                        'regular_profiles': regular_profiles
                    }
                    superuser_info['superuser_profiles'] = superuser_profiles
                    superuser_info['regular_user_profiles'] = regular_profiles
                    
                else:
                    # For all other models, just show total count
                    model_counts[model_name] = count
                    
                total_records += count
                
            except Exception as e:
                model_counts[model_name] = f"Error: {str(e)}"
        
        # Get superuser details (usernames)
        try:
            from django.contrib.auth.models import User
            superusers = User.objects.filter(is_superuser=True).values_list('username', 'email', 'first_name', 'last_name')
            superuser_info['superuser_details'] = [
                {
                    'username': su[0],
                    'email': su[1] or 'No email',
                    'full_name': f"{su[2]} {su[3]}".strip() or 'No name'
                }
                for su in superusers
            ]
        except Exception as e:
            superuser_info['superuser_details'] = f"Error fetching details: {str(e)}"
        
        status_info['model_counts'] = model_counts
        status_info['total_records'] = total_records
        status_info['superuser_info'] = superuser_info
        status_info['debug_mode'] = settings.DEBUG
        status_info['wipe_allowed'] = settings.DEBUG or os.environ.get('ALLOW_DB_WIPE') == 'true'
        
        # Summary for quick reference
        status_info['summary'] = {
            'total_tables': status_info['total_tables'],
            'total_records': total_records,
            'superusers_count': superuser_info.get('superuser_accounts', 0),
            'superuser_profiles_count': superuser_info.get('superuser_profiles', 0),
            'records_that_will_be_preserved': superuser_info.get('superuser_accounts', 0) + superuser_info.get('superuser_profiles', 0)
        }
        
        return JsonResponse({
            'success': True,
            'database_status': status_info
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Status check error: {str(e)}'
        }, status=500)
