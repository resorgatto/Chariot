from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("logistics", "0009_alter_pushsubscription_endpoint"),
    ]

    operations = [
        migrations.AlterField(
            model_name="pushsubscription",
            name="endpoint",
            field=models.URLField(max_length=500, verbose_name="Endpoint"),
        ),
        migrations.AddConstraint(
            model_name="pushsubscription",
            constraint=models.UniqueConstraint(
                fields=("user", "endpoint"),
                name="unique_push_per_user_endpoint",
            ),
        ),
    ]
