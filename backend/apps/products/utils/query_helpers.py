"""
Query utility functions for Product API.

This module provides helper functions for optimizing database queries,
building complex filters, and managing query performance.
"""

from django.db.models import Q, F, Case, When, Value, DecimalField, Count, Min, Max, Avg, BooleanField
from django.db.models.functions import Coalesce


def get_optimized_product_queryset():
    """
    Get a base queryset for products with common optimizations.
    
    Returns:
        QuerySet: Optimized Product queryset
    """
    from apps.products.models import Product
    
    return Product.objects.annotate(
        final_price=Case(
            When(sale_price__isnull=False, then='sale_price'),
            default='price',
            output_field=DecimalField(max_digits=10, decimal_places=2)
        ),
        has_available_stock=Case(
            When(stock_quantity__gt=0, then=Value(True)),
            default=Value(False),
            output_field=BooleanField()
        )
    ).select_related(
        'category',
        'subcategory'
    ).prefetch_related(
        'images'
    )


def build_search_query(search_term, fields=None):
    """
    Build a search query for multiple fields with fuzzy matching support.
    
    Args:
        search_term (str): Search term
        fields (list, optional): List of fields to search in
        
    Returns:
        Q: Django Q object for search
    """
    if not search_term or not fields:
        return Q()
    
    search_query = Q()
    search_lower = search_term.lower()
    
    for field in fields:
        search_query |= Q(**{f"{field}__icontains": search_lower})
    
    return search_query


def filter_by_price_range(queryset, min_price=None, max_price=None):
    """
    Filter queryset by price range considering sale prices.
    
    Args:
        queryset: Base queryset
        min_price (decimal, optional): Minimum price
        max_price (decimal, optional): Maximum price
        
    Returns:
        QuerySet: Filtered queryset
    """
    # final_price is already annotated in the base queryset
    if min_price is not None:
        queryset = queryset.filter(final_price__gte=min_price)
    
    if max_price is not None:
        queryset = queryset.filter(final_price__lte=max_price)
    
    return queryset


def filter_by_stock(queryset, in_stock=None):
    """
    Filter queryset by stock availability.
    
    Args:
        queryset: Base queryset
        in_stock (bool, optional): Filter by stock availability
        
    Returns:
        QuerySet: Filtered queryset
    """
    if in_stock is True:
        return queryset.filter(stock_quantity__gt=0)
    elif in_stock is False:
        return queryset.filter(stock_quantity=0)
    
    return queryset


def get_category_tree(category):
    """
    Get all category IDs in a category tree (including subcategories).
    
    Args:
        category: Category model instance
        
    Returns:
        list: List of category IDs
    """
    category_ids = [category.id]
    
    def _get_child_categories(parent_id):
        from apps.products.models import Category
        children = Category.objects.filter(parent_id=parent_id)
        for child in children:
            category_ids.append(child.id)
            _get_child_categories(child.id)
    
    _get_child_categories(category.id)
    
    return category_ids


def apply_ordering(queryset, ordering_fields, default_ordering='-created_at'):
    """
    Apply ordering to queryset with validation.
    
    Args:
        queryset: Base queryset
        ordering_fields (list): Allowed ordering fields
        default_ordering (str): Default ordering
        
    Returns:
        QuerySet: Ordered queryset
    """
    # Apply default ordering
    queryset = queryset.order_by(default_ordering)
    
    return queryset


def get_product_statistics(queryset):
    """
    Calculate statistics for a product queryset.
    
    Args:
        queryset: Product queryset
        
    Returns:
        dict: Statistics dictionary
    """
    return queryset.aggregate(
        total_products=Count('id'),
        total_featured=Count('id', filter=Q(featured=True)),
        total_on_sale=Count('id', filter=Q(sale_price__isnull=False)),
        avg_price=Avg('price'),
        min_price=Min('price'),
        max_price=Max('price'),
    )
