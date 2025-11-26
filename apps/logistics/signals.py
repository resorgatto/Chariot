from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import DeliveryOrder, DeliveryStatus
from .tasks import send_delivery_status_email


@receiver(pre_save, sender=DeliveryOrder)
def store_previous_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        return

    try:
        previous = DeliveryOrder.objects.get(pk=instance.pk).status
    except DeliveryOrder.DoesNotExist:
        previous = None

    instance._previous_status = previous


@receiver(post_save, sender=DeliveryOrder)
def notify_on_dispatch(sender, instance, created, **kwargs):
    if created:
        return

    previous_status = getattr(instance, "_previous_status", None)
    if previous_status != instance.status and instance.status == DeliveryStatus.IN_TRANSIT:
        send_delivery_status_email.delay(instance.id)
