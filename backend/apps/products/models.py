from django.db import models
from django.db.models import Case, When, Value, F, DecimalField

class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='children'
    )

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(default=0, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    subcategory = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_products'
    )
    featured = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['price', 'sale_price']),
            models.Index(fields=['featured']),
            models.Index(fields=['created_at']),
            models.Index(fields=['category', 'featured']),
        ]

    def __str__(self):
        return self.name

    @property
    def current_price(self):
        return self.sale_price if self.sale_price else self.price

    @property
    def in_stock(self):
        """Check if product has available stock."""
        return self.stock_quantity > 0

    @classmethod
    def with_final_price(cls):
        """
        Annotate queryset with final_price for database-level computation
        """
        return cls.objects.annotate(
            final_price=Case(
                When(sale_price__isnull=False, then='sale_price'),
                default='price',
                output_field=DecimalField(max_digits=10, decimal_places=2)
            )
        )

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.product.name}"