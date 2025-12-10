from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("logistics", "0007_deliveryorder_driver_vehicle"),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200, verbose_name="Titulo")),
                ("body", models.TextField(blank=True, verbose_name="Mensagem")),
                ("is_read", models.BooleanField(default=False, verbose_name="Lida")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criada em")),
                (
                    "order",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to="logistics.deliveryorder",
                        verbose_name="Ordem de Entrega",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Usuario",
                    ),
                ),
            ],
            options={
                "verbose_name": "Notificacao",
                "verbose_name_plural": "Notificacoes",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="PushSubscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("endpoint", models.URLField(unique=True, verbose_name="Endpoint")),
                ("p256dh", models.CharField(max_length=255, verbose_name="Chave p256dh")),
                ("auth", models.CharField(max_length=255, verbose_name="Chave auth")),
                ("user_agent", models.CharField(blank=True, default="", max_length=255, verbose_name="User Agent")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="push_subscriptions",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Usuario",
                    ),
                ),
            ],
            options={
                "verbose_name": "Inscricao Push",
                "verbose_name_plural": "Inscricoes Push",
                "unique_together": {("user", "endpoint")},
            },
        ),
    ]
