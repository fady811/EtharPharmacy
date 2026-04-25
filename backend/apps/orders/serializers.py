import uuid
from django.db import transaction
from django.db.models import F
from rest_framework import serializers
from .models import Order, OrderItem, OrderIdempotencyKey
from apps.products.models import Product

class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.StringRelatedField(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    price_at_order = serializers.DecimalField(
        read_only=True,
        max_digits=10,
        decimal_places=2,
    )

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity', 'price_at_order']

    def validate_quantity(self, value):
        """Validate that quantity doesn't exceed available stock."""
        # Get the product from the context or parent serializer
        product = None
        if self.parent and hasattr(self.parent, 'initial_data'):
            # This is for nested validation
            items = self.parent.initial_data.get('items', [])
            product_id = None
            for item in items:
                if item.get('product_id') == self.initial_data.get('product_id'):
                    product_id = item.get('product_id')
                    break
            if product_id:
                try:
                    product = Product.objects.get(id=product_id)
                except Product.DoesNotExist:
                    raise serializers.ValidationError("Invalid product")
        
        # If we have the product object from the field
        if hasattr(self, '_product'):
            product = self._product
        
        if product and value > product.stock_quantity:
            raise serializers.ValidationError(
                f"Requested quantity ({value}) exceeds available stock ({product.stock_quantity})"
            )
        
        return value

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    idempotency_key = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'customer_phone', 'customer_address',
            'customer_email', 'notes', 'total_price', 'status', 'created_at', 'items', 'idempotency_key'
        ]
        read_only_fields = ['id', 'total_price', 'status', 'created_at']

    def create(self, validated_data):
        idempotency_key = validated_data.pop('idempotency_key', None)
        items_data = validated_data.pop('items')
        
        # Check if idempotency key already exists
        if idempotency_key:
            try:
                existing_key = OrderIdempotencyKey.objects.get(key=idempotency_key)
                # Return existing order if key exists
                return existing_key.order
            except OrderIdempotencyKey.DoesNotExist:
                pass
        
        with transaction.atomic():
            # Create order
            order = Order.objects.create(total_price=0, **validated_data)
            
            # Create idempotency key if provided
            if idempotency_key:
                OrderIdempotencyKey.objects.create(key=idempotency_key, order=order)
            
            total = 0
            stock_errors = []
            
            for item_data in items_data:
                product = item_data['product']
                quantity = item_data['quantity']
                
                # Check quantity limit before proceeding
                if quantity > product.stock_quantity:
                    stock_errors.append({
                        'product_id': product.id,
                        'product_name': product.name,
                        'requested': quantity,
                        'available': product.stock_quantity
                    })
                    continue
                
                # Lock the product row for update to prevent race conditions
                locked_product = Product.objects.select_for_update().get(id=product.id)
                
                # Re-read stock from DB - don't trust the value from the serializer
                available_stock = locked_product.stock_quantity
                
                if available_stock < quantity:
                    stock_errors.append({
                        'product_id': product.id,
                        'product_name': product.name,
                        'requested': quantity,
                        'available': available_stock
                    })
                    continue
                
                price = product.current_price
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price_at_order=price
                )
                total += price * quantity
                
                # Use F() expression to decrement stock atomically
                Product.objects.filter(id=product.id).update(
                    stock_quantity=F('stock_quantity') - quantity
                )
            
            # If there are stock errors, raise a structured validation error
            if stock_errors:
                raise serializers.ValidationError({'errors': stock_errors})
            
            order.total_price = total
            order.save()
            return order