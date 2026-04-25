from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html
from django.contrib import messages
from pharmacy_backend.admin_site import pharma_admin_site
from .models import Category, Product, ProductImage


# ─── Category Admin ───────────────────────────────────────────────────────────

class CategoryAdmin(admin.ModelAdmin):
    list_display  = ('name', 'parent', 'product_count_display')
    search_fields = ('name',)
    list_filter   = ('parent',)
    list_per_page = 50

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(_product_count=Count('products', distinct=True))

    @admin.display(description='Products', ordering='_product_count')
    def product_count_display(self, obj):
        count = getattr(obj, '_product_count', 0)
        if count == 0:
            colour = '#6c757d'
        elif count < 5:
            colour = '#fd7e14'
        else:
            colour = '#28a745'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;'
            'border-radius:12px;font-weight:600;font-size:12px;">{}</span>',
            colour, count
        )


# ─── Product Image Inline ─────────────────────────────────────────────────────

class ProductImageInline(admin.TabularInline):
    model          = ProductImage
    extra          = 0
    fields         = ('image', 'image_preview', 'order')
    readonly_fields = ('image_preview',)

    @admin.display(description='Preview')
    def image_preview(self, obj):
        if obj.image and obj.image.name:
            return format_html(
                '<img src="{}" style="height:55px;border-radius:6px;'
                'box-shadow:0 1px 4px rgba(0,0,0,.2);" />',
                obj.image.url
            )
        return '—'


# ─── Stock-status filter ──────────────────────────────────────────────────────

class StockFilter(admin.SimpleListFilter):
    title        = 'Stock status'
    parameter_name = 'stock_status'

    def lookups(self, request, model_admin):
        return [
            ('in_stock',   'In Stock'),
            ('low_stock',  'Low Stock (≤ 5)'),
            ('out_of_stock', 'Out of Stock'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'in_stock':
            return queryset.filter(stock_quantity__gt=5)
        if self.value() == 'low_stock':
            return queryset.filter(stock_quantity__gt=0, stock_quantity__lte=5)
        if self.value() == 'out_of_stock':
            return queryset.filter(stock_quantity=0)
        return queryset


class OnSaleFilter(admin.SimpleListFilter):
    title          = 'On Sale'
    parameter_name = 'on_sale'

    def lookups(self, request, model_admin):
        return [('yes', 'On Sale'), ('no', 'Full Price')]

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(sale_price__isnull=False)
        if self.value() == 'no':
            return queryset.filter(sale_price__isnull=True)
        return queryset


# ─── Product Admin ────────────────────────────────────────────────────────────

class ProductAdmin(admin.ModelAdmin):
    # List view
    list_display     = (
        'name', 'category', 'price_display', 'sale_price',
        'stock_badge', 'stock_quantity', 'featured', 'created_at',
    )
    list_display_links = ('name',)
    list_editable    = ('stock_quantity', 'featured', 'sale_price')
    list_filter      = ('category', 'featured', StockFilter, OnSaleFilter, 'created_at')
    search_fields    = ('name', 'description')
    list_per_page    = 40
    ordering         = ('-created_at',)
    date_hierarchy   = 'created_at'

    # Detail view
    inlines          = [ProductImageInline]
    readonly_fields  = ('created_at', 'updated_at', 'current_price_display')
    # Single-page layout: all fieldsets visible without tabs or collapse
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'subcategory'),
        }),
        ('Pricing', {
            'fields': ('price', 'sale_price', 'current_price_display'),
            'description': 'Set sale_price to activate a discount. Leave blank for full price.',
        }),
        ('Stock & Inventory', {
            'fields': ('stock_quantity',),
        }),
        ('Product Settings', {
            'fields': ('featured', 'created_at', 'updated_at'),
        }),
    )

    # ── Computed columns ──────────────────────────────────────────────────────

    @admin.display(description='Price', ordering='price')
    def price_display(self, obj):
        if obj.sale_price:
            return format_html(
                '<span style="text-decoration:line-through;color:#aaa;font-size:11px;">${}</span>'
                '&nbsp;<strong style="color:#28a745;">${}</strong>',
                obj.price, obj.sale_price
            )
        return format_html('<strong>${}</strong>', obj.price)

    @admin.display(description='Stock', ordering='stock_quantity')
    def stock_badge(self, obj):
        qty = obj.stock_quantity
        if qty == 0:
            style = 'background:#dc3545;'
            label = '✗ Out of Stock'
        elif qty <= 5:
            style = 'background:#fd7e14;'
            label = f'⚠ Low ({qty})'
        else:
            style = 'background:#28a745;'
            label = f'✓ {qty}'
        return format_html(
            '<span style="{}color:#fff;padding:2px 10px;border-radius:12px;'
            'font-weight:600;font-size:12px;white-space:nowrap;">{}</span>',
            style, label
        )

    @admin.display(description='Current Price')
    def current_price_display(self, obj):
        price = obj.sale_price if obj.sale_price else obj.price
        label = 'Sale Price' if obj.sale_price else 'Regular Price'
        return format_html(
            '<strong style="font-size:18px;color:#28a745;">${}</strong> '
            '<span style="color:#6c757d;font-size:12px;">({})</span>',
            price, label
        )

    # ── Custom actions ────────────────────────────────────────────────────────

    actions = ['mark_featured', 'unmark_featured', 'mark_out_of_stock']

    @admin.action(description='⭐  Mark selected as Featured')
    def mark_featured(self, request, queryset):
        updated = queryset.update(featured=True)
        self.message_user(request, f'{updated} product(s) marked as featured.', messages.SUCCESS)

    @admin.action(description='☆  Unmark selected as Featured')
    def unmark_featured(self, request, queryset):
        updated = queryset.update(featured=False)
        self.message_user(request, f'{updated} product(s) unmarked.', messages.SUCCESS)

    @admin.action(description='📦  Mark selected as Out of Stock (set qty = 0)')
    def mark_out_of_stock(self, request, queryset):
        updated = queryset.update(stock_quantity=0)
        self.message_user(request, f'{updated} product(s) set to out of stock.', messages.WARNING)


# Register with custom admin site
pharma_admin_site.register(Category, CategoryAdmin)
pharma_admin_site.register(Product, ProductAdmin)