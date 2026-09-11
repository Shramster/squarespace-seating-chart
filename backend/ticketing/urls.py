from django.urls import path

from . import views

app_name = "ticketing"

urlpatterns = [
    path("api/shows/<str:sku>/seats/", views.SeatStatusView.as_view()),
    path("api/shows/<str:sku>/seats/<str:code>/hold/", views.SeatHoldView.as_view()),
    path("api/webhooks/squarespace/orders/", views.SquarespaceOrderWebhookView.as_view()),
]
