from django.urls import path
from .views import CouponApplyView

urlpatterns = [
    path('coupons/apply/', CouponApplyView.as_view(), name='coupon-apply'),
]