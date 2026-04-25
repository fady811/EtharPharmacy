"""
Custom admin site that injects live dashboard statistics
into the index (home) template context.
"""
from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.utils import timezone
from django.db.models import Sum


class PharmaAdminSite(admin.AdminSite):
    site_header  = "PharmaShop Admin"
    site_title   = "PharmaShop Admin"
    index_title  = "Dashboard"

    def index(self, request, extra_context=None):
        from apps.orders.models import Order
        from apps.products.models import Product

        today = timezone.now().date()

        # ── Today's stats ─────────────────────────────────────────────────────
        orders_today_qs = Order.objects.filter(created_at__date=today)
        orders_today    = orders_today_qs.count()
        revenue_today   = orders_today_qs.aggregate(
            total=Sum('total_price')
        )['total'] or 0

        # ── Pending orders ────────────────────────────────────────────────────
        pending_orders  = Order.objects.filter(status='pending').count()

        # ── Product stats ─────────────────────────────────────────────────────
        total_products  = Product.objects.count()
        out_of_stock    = Product.objects.filter(stock_quantity=0).count()
        low_stock_count = Product.objects.filter(
            stock_quantity__gt=0, stock_quantity__lte=5
        ).count()

        # ── Recent orders (last 10) ───────────────────────────────────────────
        recent_orders   = (
            Order.objects.select_related()
            .order_by('-created_at')[:10]
        )

        # ── Low stock products ────────────────────────────────────────────────
        low_stock_products = (
            Product.objects.select_related('category')
            .filter(stock_quantity__lte=5)
            .order_by('stock_quantity')[:20]
        )

        extra_context = extra_context or {}
        extra_context.update({
            'stats': {
                'orders_today':   orders_today,
                'revenue_today':  f'{revenue_today:.2f}',
                'pending_orders': pending_orders,
                'total_products': total_products,
                'out_of_stock':   out_of_stock,
                'low_stock':      low_stock_count,
            },
            'recent_orders':      recent_orders,
            'low_stock_products': low_stock_products,
        })

        return super().index(request, extra_context=extra_context)


# Expose a singleton so apps can register against it
pharma_admin_site = PharmaAdminSite(name='pharma_admin')


# Custom UserAdmin with single-page layout (no tabs, no collapse)
class SinglePageUserAdmin(UserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
    )


# Custom GroupAdmin with single-page layout
class SinglePageGroupAdmin(GroupAdmin):
    fieldsets = (
        (None, {'fields': ('name', 'permissions')}),
    )


# Register auth models for user management
pharma_admin_site.register(User, SinglePageUserAdmin)
pharma_admin_site.register(Group, SinglePageGroupAdmin)
