import uuid
from django.db import models

class OrderIdempotencyKey(models.Model):
    key = models.UUIDField(default=uuid.uuid4, unique=True)
    order = models.OneToOneField('Order', on_delete=models.CASCADE, related_name='idempotency_key')

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('shipped', 'Shipped'),
        ('cancelled', 'Cancelled'),
    ]

    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    customer_address = models.TextField()
    customer_email = models.EmailField(blank=True, null=True)
    notes = models.TextField(blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.id} - {self.customer_name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"