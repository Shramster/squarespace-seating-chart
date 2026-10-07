from datetime import datetime
from zoneinfo import ZoneInfo

from django.db import migrations, models

VENUE_TZ = ZoneInfo("America/Los_Angeles")

SHOW_START_TIMES = {
    "OCT03": datetime(2026, 10, 3, 15, 0),
    "OCT04": datetime(2026, 10, 4, 15, 0),
    "OCT09": datetime(2026, 10, 9, 20, 0),
    "OCT10": datetime(2026, 10, 10, 15, 0),
    "OCT16": datetime(2026, 10, 16, 20, 0),
    "OCT17": datetime(2026, 10, 17, 15, 0),
    "OCT18": datetime(2026, 10, 18, 15, 0),
    "OCT23": datetime(2026, 10, 23, 20, 0),
    "OCT24": datetime(2026, 10, 24, 15, 0),
    "OCT25": datetime(2026, 10, 25, 15, 0),
    "OCT30": datetime(2026, 10, 30, 20, 0),
    "NOV01": datetime(2026, 11, 1, 15, 0),
    "NOV03": datetime(2026, 11, 3, 19, 0),
}


def set_start_times(apps, schema_editor):
    Show = apps.get_model("ticketing", "Show")
    for sku, start in SHOW_START_TIMES.items():
        Show.objects.filter(sku=sku).update(starts_at=start.replace(tzinfo=VENUE_TZ))


class Migration(migrations.Migration):
    dependencies = [
        ("ticketing", "0004_seathold"),
    ]

    operations = [
        migrations.AddField(
            model_name="show",
            name="starts_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(set_start_times, migrations.RunPython.noop),
    ]
