from django.shortcuts import render

# Create your views here.

def metal_list(request):
    return render(request, 'rawmetals_view.html')