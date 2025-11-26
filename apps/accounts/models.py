from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model to allow future extensions (e.g., cpf, driver flags)."""

    pass
