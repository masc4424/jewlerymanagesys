from django.shortcuts import render
from django.contrib.auth.decorators import login_required
# Create your views here.

@login_required(login_url='login_auth')
def metal_list(request):
    return render(request, 'rawmetals_view.html')