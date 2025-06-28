from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required(login_url='login_auth')
def stone_list(request):
    return render(request, 'stone_list.html')

@login_required(login_url='login_auth')
def stone_type_view(request):
    stone_name = request.GET.get('stone_name', '')
    print("Debug: Stone Name -", stone_name) 
    return render(request, 'stone_type.html', {'stone_name': stone_name})

@login_required(login_url='login_auth')
def stone_type_detail_view(request):
    stone_name = request.GET.get('stone_name', '')
    type_name = request.GET.get('type_name', '')
    print(f"Debug: Stone Name - {stone_name}, Type Name - {type_name}")
    return render(request, 'stone_type_details.html', {'stone_name': stone_name, 'type_name': type_name})

