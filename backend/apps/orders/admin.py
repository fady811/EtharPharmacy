from django.contrib import admin
from django.utils.html import format_html
from django.contrib import messages
from pharmacy_backend.admin_site import pharma_admin_site
from .models import Order, OrderItem, OrderIdempotencyKey


# ─── Order Item Inline ────────────────────────────────────────────────────────

class OrderItemInline(admin.TabularInline):
    model          = OrderItem
    extra          = 0
    readonly_fields = ('product_link', 'quantity', 'price_at_order', 'line_total')
    fields         = ('product_link', 'quantity', 'price_at_order', 'line_total')
    can_delete     = False

    @admin.display(description='Product')
    def product_link(self, obj):
        if obj.product_id:
            url = f'/admin/products/product/{obj.product_id}/change/'
            return format_html('<a href="{}" target="_blank">{}</a>', url, obj.product.name)
        return '—'

    @admin.display(description='Line Total')
    def line_total(self, obj):
        if obj.quantity and obj.price_at_order:
            total = obj.quantity * obj.price_at_order
            return format_html('<strong>${}</strong>', f'{total:.2f}')
        return '—'


# ─── Status filter colours map ────────────────────────────────────────────────

STATUS_STYLES = {
    'pending':   ('background:#ffc107;color:#333;',  '⏳ Pending'),
    'completed': ('background:#28a745;color:#fff;',  '✓ Completed'),
    'shipped':   ('background:#6f42c1;color:#fff;',  '🚚 Shipped'),
    'cancelled': ('background:#dc3545;color:#fff;',  '✗ Cancelled'),
}


# ─── Order Admin ──────────────────────────────────────────────────────────────

class OrderAdmin(admin.ModelAdmin):
    # List view
    list_display       = (
        'order_id', 'customer_name', 'customer_phone',
        'item_count', 'total_price_display', 'status_badge', 'created_at',
    )
    list_display_links  = ('order_id', 'customer_name')
    list_filter         = ('status', 'created_at')
    search_fields       = ('customer_name', 'customer_phone', 'customer_email', 'id')
    ordering            = ('-created_at',)
    list_per_page       = 30
    date_hierarchy      = 'created_at'
    # Detail view - single page layout, all sections visible
    inlines       = [OrderItemInline]
    readonly_fields = (
        'created_at', 'updated_at', 'total_price',
        'status_badge_detail', 'order_summary',
    )
    fieldsets = (
        ('Order Status', {
            'fields': ('status', 'status_badge_detail'),
        }),
        ('Customer Details', {
            'fields': ('customer_name', 'customer_phone', 'customer_email', 'customer_address'),
        }),
        ('Order Info', {
            'fields': ('total_price', 'notes', 'order_summary'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
        }),
    )

    # ── Computed columns ──────────────────────────────────────────────────────

    @admin.display(description='Order #', ordering='id')
    def order_id(self, obj):
        return format_html('<strong>#{}</strong>', obj.id)

    @admin.display(description='Total', ordering='total_price')
    def total_price_display(self, obj):
        return format_html(
            '<strong style="font-size:14px;color:#28a745;">${}</strong>',
            obj.total_price
        )

    @admin.display(description='Items')
    def item_count(self, obj):
        count = obj.items.count()
        return format_html(
            '<span style="background:#17a2b8;color:#fff;padding:1px 8px;'
            'border-radius:10px;font-size:12px;">{} item{}</span>',
            count, 's' if count != 1 else ''
        )

    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        style, label = STATUS_STYLES.get(
            obj.status, ('background:#6c757d;color:#fff;', obj.get_status_display())
        )
        return format_html(
            '<span style="{}padding:3px 12px;border-radius:12px;'
            'font-weight:600;font-size:12px;white-space:nowrap;">{}</span>',
            style, label
        )
    status_badge.allow_tags = True

    @admin.display(description='Status')
    def status_badge_detail(self, obj):
        return self.status_badge(obj)

    @admin.display(description='Order Summary')
    def order_summary(self, obj):
        items = obj.items.select_related('product').all()
        if not items:
            return 'No items'
        rows = ''.join(
            f'<tr>'
            f'<td style="padding:4px 8px;">{item.product.name}</td>'
            f'<td style="padding:4px 8px;text-align:center;">{item.quantity}</td>'
            f'<td style="padding:4px 8px;text-align:right;">${item.price_at_order}</td>'
            f'<td style="padding:4px 8px;text-align:right;"><strong>'
            f'${item.quantity * item.price_at_order:.2f}</strong></td>'
            f'</tr>'
            for item in items
        )
        return format_html(
            '<table style="border-collapse:collapse;width:100%;font-size:13px;">'
            '<thead><tr style="background:#f8f9fa;">'
            '<th style="padding:4px 8px;text-align:left;">Product</th>'
            '<th style="padding:4px 8px;">Qty</th>'
            '<th style="padding:4px 8px;text-align:right;">Unit</th>'
            '<th style="padding:4px 8px;text-align:right;">Total</th>'
            '</tr></thead><tbody>{}</tbody></table>',
            rows
        )

    # ── Custom actions ────────────────────────────────────────────────────────

    actions = ['mark_processing', 'mark_shipped', 'mark_completed', 'mark_cancelled']

    @admin.action(description='🔄  Mark selected as Completed')
    def mark_processing(self, request, queryset):
        updated = queryset.update(status='completed')
        self.message_user(request, f'{updated} order(s) marked as completed.', messages.SUCCESS)

    @admin.action(description='🚚  Mark selected as Shipped')
    def mark_shipped(self, request, queryset):
        updated = queryset.update(status='shipped')
        self.message_user(request, f'{updated} order(s) marked as shipped.', messages.SUCCESS)

    @admin.action(description='✓  Mark selected as Delivered (Completed)')
    def mark_completed(self, request, queryset):
        updated = queryset.update(status='completed')
        self.message_user(request, f'{updated} order(s) marked as delivered.', messages.SUCCESS)

    @admin.action(description='✗  Cancel selected orders')
    def mark_cancelled(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} order(s) cancelled.', messages.WARNING)


# Register with custom admin site
pharma_admin_site.register(Order, OrderAdmin)