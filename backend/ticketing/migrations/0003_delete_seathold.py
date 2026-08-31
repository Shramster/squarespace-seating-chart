from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ticketing', '0002_seathold'),
    ]

    operations = [
        migrations.DeleteModel(
            name='SeatHold',
        ),
    ]
