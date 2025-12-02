from django.apps import AppConfig
from django.conf import settings
from django.db.models.signals import post_migrate


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'

    def ready(self):
        # Ensure a default superuser is created based on environment variables.
        def create_default_superuser(**kwargs):
            username = getattr(settings, "DEFAULT_SUPERUSER_USERNAME", None)
            password = getattr(settings, "DEFAULT_SUPERUSER_PASSWORD", None)

            if not username or not password:
                return

            from django.contrib.auth import get_user_model
            from django.db import ProgrammingError, OperationalError

            User = get_user_model()

            try:
                if User.objects.filter(username=username).exists():
                    return
                User.objects.create_superuser(
                    username=username,
                    email="",
                    password=password,
                )
            except (ProgrammingError, OperationalError):
                # Database not ready yet (e.g., during initial migrate)
                return

        post_migrate.connect(
            create_default_superuser,
            sender=self,
            dispatch_uid="apps.accounts.create_default_superuser",
        )
