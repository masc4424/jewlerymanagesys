from django.shortcuts import render

def stone_list(request):
    return render(request, 'stone_list.html')
