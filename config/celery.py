import os

from celery import Celery
from decouple import config

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

# Default broker/result if not provided
app.conf.broker_url = config(
    "CELERY_BROKER_URL",
    default="redis://redis:6379/0",
)
app.conf.result_backend = config(
    "CELERY_RESULT_BACKEND",
    default="redis://redis:6379/1",
)
