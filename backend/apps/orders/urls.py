from django.urls import path
from .views import OrderCreateView, OrderDetailView, OrderStatusUpdateView

urlpatterns = [
    path('orders/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),
]