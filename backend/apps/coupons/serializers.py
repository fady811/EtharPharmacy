from rest_framework import serializers
from .models import Coupon

class CouponApplySerializer(serializers.Serializer):
    code = serializers.CharField()
    product_ids = serializers.ListField(child=serializers.IntegerField())

    def validate(self, data):
        code = data['code']
        product_ids = data['product_ids']
        try:
            coupon = Coupon.objects.get(code=code, active=True)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive coupon code")
        data['coupon'] = coupon
        # Check applicability
        if not coupon.applicable_products.exists() and not coupon.applicable_categories.exists():
            # Coupon applies to all products
            return data
        # Get products from ids
        products = Product.objects.filter(id__in=product_ids)
        applicable = False
        for product in products:
            if coupon.applicable_products.filter(id=product.id).exists():
                applicable = True
                break
            if coupon.applicable_categories.filter(id=product.category.id).exists():
                applicable = True
                break
        if not applicable:
            raise serializers.ValidationError("Coupon not applicable to any item in your cart")
        return data

    def to_representation(self, instance):
        # instance is the coupon after validation
        return {
            'valid': True,
            'discount_amount': str(instance.discount_amount)
        }