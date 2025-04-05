from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib.auth.models import User

@login_required
def change_password(request):
    if request.method == 'POST':
        new_password = request.POST.get('new_password')
        user = request.user
        user.set_password(new_password)
        user.save()
        return JsonResponse({'message': 'Password changed successfully.'})
    return JsonResponse({'error': 'Invalid request'}, status=400)