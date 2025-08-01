from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST, require_GET
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.templatetags.static import static
from django.db.models import Q
from datetime import datetime, date
from collections import defaultdict
import json
from django.db import transaction

from order.models import Order, RepeatedOrder, DefectiveOrder
from product_inv.models import Model, ModelColor, ModelStatus, JewelryType

# @login_required
# @require_GET
# def client_orders_api(request):
#     user = request.user
    
#     orders = Order.objects.filter(client=user).select_related('model', 'color', 'status')
#     repeated_orders = RepeatedOrder.objects.filter(client=user).select_related(
#         'original_order__model', 'color', 'status'
#     )
    
#     # Use the DefectiveOrder model instead of OrderReturn
#     defective_returns = DefectiveOrder.objects.filter(
#         Q(order__client=user) | Q(repeated_order_id__isnull=False)
#     ).select_related('order')
    
#     data = []
    
#     # Process regular orders
#     for order in orders:
#         model_img_url = static(order.model.model_img.name) if order.model.model_img else None
        
#         # Check if this order has a defective/return record
#         order_issue = defective_returns.filter(order=order).first()
        
#         # Get status from model.status table
#         # Get status from the model (order.model.status)
#         status = order.model.status.status if order.model and order.model.status else 'NA'

        
#         # Determine if there's a defective/return status that should override
#         if order_issue:
#             if order_issue.is_defective:
#                 status = "DEFECTIVE"
#             elif order_issue.is_return:
#                 status = "RETURNED"
        
#         data.append({
#             'id': order.id,
#             'model_no': order.model.model_no,
#             'model_img': model_img_url,
#             'status': status,
#             'jewelry_type': order.model.jewelry_type.name,
#             'quantity': order.quantity,
#             'color': order.color.color if order.color else 'N/A',
#             'order_date': order.date_of_order.isoformat(),
#             'est_delivery_date': order.est_delivery_date.isoformat() if order.est_delivery_date else None,
#             'weight': str(order.model.weight) + ' g',
#             'is_approved': order.is_approved,
#             'delivered': order.delivered,  # Delivery status from Order table
#             'is_repeated': False,
#             'return_reason': order_issue.issue_description if order_issue else None,
#             'return_date': order_issue.reported_date.isoformat() if order_issue else None,
#             'return_pieces': order_issue.defective_pieces if order_issue else None
#         })
    
#     # Process repeated orders
#     for repeated_order in repeated_orders:
#         model_img_url = static(repeated_order.original_order.model.model_img.name) if repeated_order.original_order.model.model_img else None
        
#         # Check if this repeated order has a defective/return record
#         repeated_issue = defective_returns.filter(repeated_order_id=repeated_order.repeat_order_id).first()
        
#         # Get status from model.status table
#         status = repeated_order.original_order.model.status.status if repeated_order.original_order.model.status else 'Pending'
        
#         # Determine if there's a defective/return status that should override
#         if repeated_issue:
#             if repeated_issue.is_defective:
#                 status = "DEFECTIVE"
#             elif repeated_issue.is_return:
#                 status = "RETURNED"
        
#         data.append({
#             'id': repeated_order.id,
#             'model_no': repeated_order.original_order.model.model_no,
#             'model_img': model_img_url,
#             'status': status,
#             'jewelry_type': repeated_order.original_order.model.jewelry_type.name,
#             'quantity': repeated_order.quantity,
#             'color': repeated_order.color.color if repeated_order.color else 'N/A',
#             'order_date': repeated_order.date_of_reorder.isoformat(),
#             'est_delivery_date': repeated_order.est_delivery_date.isoformat() if repeated_order.est_delivery_date else None,
#             'weight': str(repeated_order.original_order.model.weight) + ' g',
#             'is_approved': True,  # Repeated orders are auto-approved
#             'delivered': repeated_order.delivered,  # Delivery status from RepeatedOrder table
#             'is_repeated': True,
#             'repeat_order_id': repeated_order.repeat_order_id,
#             'return_reason': repeated_issue.issue_description if repeated_issue else None,
#             'return_date': repeated_issue.reported_date.isoformat() if repeated_issue else None,
#             'return_pieces': repeated_issue.defective_pieces if repeated_issue else None
#         })
    
#     return JsonResponse({'data': data})

@require_GET
def client_orders_api(request):
    user = request.user
    
    orders = Order.objects.filter(client=user).select_related('model', 'color', 'status')
    repeated_orders = RepeatedOrder.objects.filter(client=user).select_related(
        'original_order__model', 'color', 'status'
    )
    
    # Use the DefectiveOrder model instead of OrderReturn
    defective_returns = DefectiveOrder.objects.filter(
        Q(order__client=user) | Q(repeated_order_id__isnull=False)
    ).select_related('order')
    
    # Get client name - adjust this based on your User/Client model structure
    client_name = user.get_full_name() or user.username  # Or user.client.name if you have a separate Client model
    
    data = []
    
    # Process regular orders
    for order in orders:
        model_img_url = static(order.model.model_img.name) if order.model.model_img else None
        
        # Check if this order has a defective/return record
        order_issue = defective_returns.filter(order=order).first()
        
        # Get status from model.status table
        status = order.model.status.status if order.model and order.model.status else 'NA'

        # Determine if there's a defective/return status that should override
        if order_issue:
            if order_issue.is_defective:
                status = "DEFECTIVE"
            elif order_issue.is_return:
                status = "RETURNED"
        
        data.append({
            'id': order.id,
            'client_name': client_name,
            'model_no': order.model.model_no,
            'model_img': model_img_url,
            'status': status,
            'jewelry_type': order.model.jewelry_type.name,
            'quantity': order.quantity,
            'quantity_delivered': getattr(order, 'quantity_delivered', 0),  # Add quantity_delivered for regular orders
            'color': order.color.color if order.color else 'N/A',
            'order_date': order.date_of_order.isoformat(),
            'est_delivery_date': order.est_delivery_date.isoformat() if order.est_delivery_date else None,
            'weight': str(order.model.weight) + ' g',
            'is_approved': order.is_approved,
            'delivered': order.delivered,
            'is_repeated': False,
            'return_reason': order_issue.issue_description if order_issue else None,
            'return_date': order_issue.reported_date.isoformat() if order_issue else None,
            'return_pieces': order_issue.defective_pieces if order_issue else None
        })
    
    # Process repeated orders
    for repeated_order in repeated_orders:
        model_img_url = static(repeated_order.original_order.model.model_img.name) if repeated_order.original_order.model.model_img else None
        
        # Check if this repeated order has a defective/return record
        repeated_issue = defective_returns.filter(repeated_order_id=repeated_order.repeat_order_id).first()
        
        # Get status from model.status table
        status = repeated_order.original_order.model.status.status if repeated_order.original_order.model.status else 'Pending'
        
        # Determine if there's a defective/return status that should override
        if repeated_issue:
            if repeated_issue.is_defective:
                status = "DEFECTIVE"
            elif repeated_issue.is_return:
                status = "RETURNED"
        
        data.append({
            'id': repeated_order.id,
            'client_name': client_name,
            'model_no': repeated_order.original_order.model.model_no,
            'model_img': model_img_url,
            'status': status,
            'jewelry_type': repeated_order.original_order.model.jewelry_type.name,
            'quantity': repeated_order.quantity,
            'quantity_delivered': repeated_order.quantity_delivered,  # Add quantity_delivered for repeated orders
            'color': repeated_order.color.color if repeated_order.color else 'N/A',
            'order_date': repeated_order.date_of_reorder.isoformat(),
            'est_delivery_date': repeated_order.est_delivery_date.isoformat() if repeated_order.est_delivery_date else None,
            'weight': str(repeated_order.original_order.model.weight) + ' g',
            'is_approved': True,
            'delivered': repeated_order.delivered,
            'is_repeated': True,
            'repeat_order_id': repeated_order.repeat_order_id,
            'return_reason': repeated_issue.issue_description if repeated_issue else None,
            'return_date': repeated_issue.reported_date.isoformat() if repeated_issue else None,
            'return_pieces': repeated_issue.defective_pieces if repeated_issue else None
        })
    
    # Group data by order_date and model_no
    grouped_data = defaultdict(lambda: defaultdict(list))
    
    for item in data:
        order_date = item['order_date']
        model_no = item['model_no']
        grouped_data[order_date][model_no].append(item)
    
    # Convert to the desired format
    result = {}
    for order_date, models in grouped_data.items():
        result[order_date] = {}
        for model_no, orders in models.items():
            result[order_date][model_no] = orders
    
    return JsonResponse({'data': result, 'client_name': client_name})

@require_POST
@login_required
def delete_client_orders_api(request):
    try:
        data = json.loads(request.body)
        order_ids = data.get('order_ids', [])
        repeated_order_ids = data.get('repeated_order_ids', [])
        
        if not order_ids and not repeated_order_ids:
            return JsonResponse({'success': False, 'message': 'No orders selected for deletion'})
        
        user = request.user
        deleted_count = 0
        
        with transaction.atomic():
            # Delete regular orders
            if order_ids:
                deleted_orders = Order.objects.filter(
                    id__in=order_ids, 
                    client=user
                ).delete()
                deleted_count += deleted_orders[0]
            
            # Delete repeated orders
            if repeated_order_ids:
                deleted_repeated = RepeatedOrder.objects.filter(
                    id__in=repeated_order_ids,
                    client=user
                ).delete()
                deleted_count += deleted_repeated[0]
            
            # Also delete related defective orders
            DefectiveOrder.objects.filter(
                Q(order_id__in=order_ids) | Q(repeated_order_id__in=repeated_order_ids)
            ).delete()
        
        return JsonResponse({
            'success': True, 
            'message': f'Successfully deleted {deleted_count} order(s)',
            'deleted_count': deleted_count
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'message': f'Error deleting orders: {str(e)}'
        })

@require_POST
@login_required
def get_order_details_for_deletion(request):
    """Get detailed order information for deletion modal"""
    try:
        data = json.loads(request.body)
        order_date = data.get('order_date')
        model_no = data.get('model_no')
        is_reordered = data.get('is_reordered')
        
        if not order_date or not model_no:
            return JsonResponse({'success': False, 'message': 'Missing order_date or model_no'})
        
        user = request.user
        
        # Convert string date to date object if needed
        if isinstance(order_date, str):
            order_date = datetime.strptime(order_date, '%Y-%m-%d').date()
        
        order_details = []
        
        if is_reordered:
            # Get repeated orders only
            repeated_orders = RepeatedOrder.objects.filter(
                client=user,
                date_of_reorder=order_date,
                original_order__model__model_no=model_no
            ).select_related('original_order__model', 'color', 'status')
            
            # Process repeated orders
            for repeated_order in repeated_orders:
                order_details.append({
                    'id': repeated_order.id,
                    'type': 'repeated',
                    'model_no': repeated_order.original_order.model.model_no,
                    'quantity': repeated_order.quantity,
                    'color': repeated_order.color.color if repeated_order.color else 'N/A',
                    'status': repeated_order.original_order.model.status.status if repeated_order.original_order.model.status else 'N/A',
                    'order_date': repeated_order.date_of_reorder.isoformat(),
                    'delivered': repeated_order.delivered,
                    'is_approved': True,
                    'weight': str(repeated_order.original_order.model.weight) + ' g',
                    'jewelry_type': repeated_order.original_order.model.jewelry_type.name,
                    'repeat_order_id': repeated_order.repeat_order_id
                })
        else:
            # Get regular orders only
            orders = Order.objects.filter(
                client=user,
                date_of_order=order_date,
                model__model_no=model_no
            ).select_related('model', 'color', 'status')
            
            # Process regular orders
            for order in orders:
                order_details.append({
                    'id': order.id,
                    'type': 'regular',
                    'model_no': order.model.model_no,
                    'quantity': order.quantity,
                    'color': order.color.color if order.color else 'N/A',
                    'status': order.model.status.status if order.model and order.model.status else 'N/A',
                    'order_date': order.date_of_order.isoformat(),
                    'delivered': order.delivered,
                    'is_approved': order.is_approved,
                    'weight': str(order.model.weight) + ' g',
                    'jewelry_type': order.model.jewelry_type.name
                })
        
        return JsonResponse({
            'success': True,
            'orders': order_details
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error fetching order details: {str(e)}'
        })
        
@login_required
@require_POST
def approve_order(request, order_id):
    order = get_object_or_404(Order, id=order_id, client=request.user)
    
    # Update order status
    order.is_approved = True
    
    # Find the "Approved" status if it exists
    try:
        approved_status = ModelStatus.objects.get(status='Approved')
        order.status = approved_status
    except ModelStatus.DoesNotExist:
        pass  # Keep existing status if "Approved" status doesn't exist
    
    order.save()
    
    return JsonResponse({'status': 'success', 'message': 'Order approved successfully'})


@login_required
@require_POST
def deny_order(request, order_id):
    order = get_object_or_404(Order, id=order_id, client=request.user)
    
    # Create defective order record
    defective_order = DefectiveOrder(
        order=order,
        defective_pieces=request.POST.get('defective_pieces', 0),
        issue_description=request.POST.get('issue_description', ''),
        is_defective=True
    )
    
    # If defect image is provided, save it
    if 'defect_image' in request.FILES:
        defective_order.defect_image = request.FILES['defect_image']
    
    defective_order.save()
    
    # Update order status if "Denied" status exists
    try:
        denied_status = ModelStatus.objects.get(status='Denied')
        order.status = denied_status
        order.save()
    except ModelStatus.DoesNotExist:
        pass
    
    return JsonResponse({'status': 'success', 'message': 'Order denied successfully'})


@login_required
@require_POST
def return_order(request, order_id):
    # Check if it's a regular order or repeated order
    is_repeated = request.POST.get('is_repeated') == 'true'
    
    if is_repeated:
        order_obj = get_object_or_404(RepeatedOrder, id=order_id, client=request.user)
        original_order = order_obj.original_order
    else:
        order_obj = get_object_or_404(Order, id=order_id, client=request.user)
        original_order = order_obj
    
    # Create defective order record
    defective_order = DefectiveOrder(
        order=original_order,
        repeated_order_id=getattr(order_obj, 'repeat_order_id', None) if is_repeated else None,
        defective_pieces=request.POST.get('defective_pieces', 0),
        issue_description=request.POST.get('issue_description', ''),
        is_return=True
    )
    
    # If return image is provided, save it
    if 'defect_image' in request.FILES:
        defective_order.defect_image = request.FILES['defect_image']
    
    defective_order.save()
    
    # Update order status if "Returned" status exists
    try:
        returned_status = ModelStatus.objects.get(status='Returned')
        
        if is_repeated:
            order_obj.status = returned_status
            order_obj.save()
        else:
            order_obj.status = returned_status
            order_obj.save()
            
    except ModelStatus.DoesNotExist:
        pass
    
    return JsonResponse({'status': 'success', 'message': 'Order marked for return successfully'})


@login_required
@require_POST
def cancel_repeated_order(request, order_id):
    repeated_order = get_object_or_404(RepeatedOrder, id=order_id, client=request.user)
    
    # Update order status if "Cancelled" status exists
    try:
        cancelled_status = ModelStatus.objects.get(status='Cancelled')
        repeated_order.status = cancelled_status
        repeated_order.save()
    except ModelStatus.DoesNotExist:
        # If no "Cancelled" status exists, just delete the repeated order
        repeated_order.delete()
        return JsonResponse({'status': 'success', 'message': 'Repeated order deleted successfully'})
    
    return JsonResponse({'status': 'success', 'message': 'Repeated order cancelled successfully'})