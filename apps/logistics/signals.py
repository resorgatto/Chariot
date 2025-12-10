from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import DeliveryOrder, DeliveryStatus
from .notification_service import notify_driver_assignment
from .tasks import send_delivery_status_email


@receiver(pre_save, sender=DeliveryOrder)
def store_previous_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        instance._previous_driver = None
        return

    try:
        previous = DeliveryOrder.objects.get(pk=instance.pk)
    except DeliveryOrder.DoesNotExist:
        instance._previous_status = None
        instance._previous_driver = None
        return

    instance._previous_status = previous.status
    instance._previous_driver = previous.driver_id


@receiver(post_save, sender=DeliveryOrder)
def notify_on_dispatch(sender, instance, created, **kwargs):
    previous_status = getattr(instance, "_previous_status", None)
    previous_driver = getattr(instance, "_previous_driver", None)

    if instance.driver_id and (created or previous_driver != instance.driver_id):
        notify_driver_assignment(instance)

    if created:
        return

    if previous_status != instance.status and instance.status == DeliveryStatus.IN_TRANSIT:
        send_delivery_status_email.delay(instance.id)
