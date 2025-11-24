from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_activity_actor_activity_meta_label_board_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='institution_id',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
    ]


