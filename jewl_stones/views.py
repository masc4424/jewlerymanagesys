from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from django.http import JsonResponse
from .models import Stone


def stone_list(request):
    return render(request, 'stone_list.html')


def get_complete_stone_data(request):
    stones = Stone.objects.prefetch_related('types__details').all()
    data = []
    for stone in stones:
        for stone_type in stone.types.all():
            for detail in stone_type.details.all():
                data.append({
                    'stone_name': stone.name,
                    'stone_type': stone_type.type_name,
                    'shape': detail.shape,
                    'size': detail.size,
                    'weight': detail.weight,
                    'rate': detail.rate
                })
    return JsonResponse({'data': data})
