# Generated by Django 5.1.5 on 2025-02-06 19:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_role_management', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='full_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
