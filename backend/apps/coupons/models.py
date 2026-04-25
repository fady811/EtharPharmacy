from django.db import models
from apps.products.models import Product, Category

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    applicable_products = models.ManyToManyField(Product, blank=True)
    applicable_categories = models.ManyToManyField(Category, blank=True)

    def __str__(self):
        return self.code