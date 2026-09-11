from rest_framework import serializers


class SeatStatusSerializer(serializers.Serializer):
    soldSeats = serializers.ListField(child=serializers.CharField())
    heldSeats = serializers.ListField(child=serializers.CharField())


class SeatHoldSerializer(serializers.Serializer):
    seatCode = serializers.CharField()
    expiresAt = serializers.DateTimeField()
