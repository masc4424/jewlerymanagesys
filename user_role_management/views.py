from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

@login_required(login_url='login_api')
def user_table(request):
    users = User.objects.all()
    return render(request, 'users_table.html')