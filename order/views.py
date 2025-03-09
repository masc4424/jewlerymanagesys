from django.shortcuts import render

def order_list(request):
    return render(request, 'order_list.html')

def add_order(request):
    return render(request, 'add_order.html')

def defective_order(request):
    return render(request, 'defective_order.html')

def repeted_order(request):
    return render(request, 'repeted_order.html')