from django.contrib import admin
from django.utils.html import format_html
from pharmacy_backend.admin_site import pharma_admin_site
from .models import Coupon

class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_amount', 'active', 'applied_to')
    list_filter = ('active',)
    search_fields = ('code',)
    list_editable = ('active',)
    filter_horizontal = ('applicable_products', 'applicable_categories')

    def applied_to(self, obj):
        products_count = obj.applicable_products.count()
        cats_count = obj.applicable_categories.count()
        if products_count == 0 and cats_count == 0:
            return format_html('<b>{}</b>', 'All Orders')
        return format_html('{} Prod(s), {} Cat(s)', products_count, cats_count)


# Coupon model is unregistered from admin to hide from sidebar
# pharma_admin_site.register(Coupon, CouponAdmin)