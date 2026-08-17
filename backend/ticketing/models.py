from django.db import models


class Show(models.Model):
    sku = models.CharField(max_length=64, unique=True)
    label = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sku} ({self.label})"


class SeatSkuMap(models.Model):
    show = models.ForeignKey(Show, related_name="seat_sku_map", on_delete=models.CASCADE)
    seat_code = models.CharField(max_length=64)
    squarespace_sku = models.CharField(max_length=64)

    class Meta:
        unique_together = [
            ("show", "seat_code"),
            ("show", "squarespace_sku"),
        ]

    def __str__(self):
        return f"{self.show.sku}: {self.seat_code} <-> {self.squarespace_sku}"


class SeatSale(models.Model):
    show = models.ForeignKey(Show, related_name="seat_sales", on_delete=models.CASCADE)
    seat_code = models.CharField(max_length=64)
    squarespace_order_id = models.CharField(max_length=128)
    squarespace_line_item_id = models.CharField(max_length=128)
    sold_at = models.DateTimeField(auto_now_add=True)
    voided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [
            ("squarespace_order_id", "squarespace_line_item_id"),
        ]
        constraints = [
            # A seat can only be actively sold once at a time; voided sales
            # (voided_at set) are excluded so a seat can be resold after a
            # refund without violating this.
            models.UniqueConstraint(
                fields=["show", "seat_code"],
                condition=models.Q(voided_at__isnull=True),
                name="unique_active_seat_sale",
            ),
        ]

    def __str__(self):
        status = "voided" if self.voided_at else "sold"
        return f"{self.show.sku}: {self.seat_code} ({status})"
