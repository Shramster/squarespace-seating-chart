from rest_framework import serializers


class SeatStatusSerializer(serializers.Serializer):
    soldSeats = serializers.ListField(child=serializers.CharField())
