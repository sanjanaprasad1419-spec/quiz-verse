from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quizzes", "0024_hotseatattempt_lifeline_expert_used"),
    ]

    operations = [
        # Remove the manual is_registration_open boolean column
        migrations.RemoveField(
            model_name="quiz",
            name="is_registration_open",
        ),
        # Make description optional
        migrations.AlterField(
            model_name="quiz",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
    ]
