from django.contrib import admin

from .models import SeatSale, SeatSkuMap, Show


@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = ("sku", "label", "is_active", "created_at")


@admin.register(SeatSkuMap)
class SeatSkuMapAdmin(admin.ModelAdmin):
    list_display = ("show", "seat_code", "squarespace_sku")
    list_filter = ("show",)
    search_fields = ("seat_code", "squarespace_sku")


@admin.register(SeatSale)
class SeatSaleAdmin(admin.ModelAdmin):
    list_display = ("show", "seat_code", "squarespace_order_id", "sold_at", "voided_at")
    list_filter = ("show",)
    search_fields = ("seat_code", "squarespace_order_id", "squarespace_line_item_id")
