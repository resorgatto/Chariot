from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

from .models import DeliveryOrder


@shared_task
def add(x, y):
    return x + y


@shared_task
def send_delivery_status_email(order_id: int):
    try:
        order = DeliveryOrder.objects.get(pk=order_id)
    except DeliveryOrder.DoesNotExist:
        return "Order not found"

    message = (
        f"Pedido #{order.id} para {order.client_name} mudou para "
        f"status: {order.get_status_display()}."
    )

    send_mail(
        subject="Atualizacao de entrega",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.DEFAULT_FROM_EMAIL],
        fail_silently=True,
    )
    print(f"[Celery] Notification sent for order {order.id}: {message}")
    return "sent"
