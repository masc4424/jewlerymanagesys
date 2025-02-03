from django.shortcuts import render


def login_auth_view(request):
    return render(request, 'loginauth.html')