import json
from typing import Optional

from django.conf import settings
from pywebpush import WebPushException, webpush

from .models import DeliveryOrder, Notification, PushSubscription


def _send_push(notification: Notification) -> None:
    public_key = getattr(settings, "WEBPUSH_VAPID_PUBLIC_KEY", "")
    private_key = getattr(settings, "WEBPUSH_VAPID_PRIVATE_KEY", "")
    contact = getattr(settings, "WEBPUSH_VAPID_ADMIN_EMAIL", settings.DEFAULT_FROM_EMAIL)

    if not public_key or not private_key:
        return

    payload = json.dumps(
        {
            "title": notification.title,
            "body": notification.body,
            "url": notification.target_url,
            "tag": f"notification-{notification.id}",
        }
    )
    subscriptions: list[PushSubscription] = list(notification.user.push_subscriptions.all())

    for subscription in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=payload,
                vapid_private_key=private_key,
                vapid_public_key=public_key,
                vapid_claims={"sub": f"mailto:{contact}"},
            )
        except WebPushException as exc:
            # Remove expired/invalid subscriptions quietly
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in (404, 410):
                subscription.delete()
            continue
        except Exception:
            # Do not break order creation if push fails
            continue


def notify_driver_assignment(order: DeliveryOrder) -> Optional[Notification]:
    driver_user = getattr(getattr(order, "driver", None), "user", None)
    if not driver_user:
        return None

    notification = Notification.objects.create(
        user=driver_user,
        order=order,
        title="Nova ordem atribuida",
        body=f"OS #{order.id} atribuida para voce (cliente: {order.client_name}).",
    )
    _send_push(notification)
    return notification
