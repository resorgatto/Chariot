from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("logistics", "0008_notification_pushsubscription"),
    ]

    operations = [
        migrations.AlterField(
            model_name="pushsubscription",
            name="endpoint",
            field=models.URLField(max_length=500, unique=True, verbose_name="Endpoint"),
        ),
    ]
