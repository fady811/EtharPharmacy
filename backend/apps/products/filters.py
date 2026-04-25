import django_filters
from django.db.models import Q, F, Case, When, Value, DecimalField
from django.core.exceptions import ValidationError
from .models import Product, Category
from .utils.fuzzy_search import fuzzy_search_products
from .utils.query_helpers import get_category_tree, filter_by_price_range, filter_by_stock

class ProductFilter(django_filters.FilterSet):
    """
    Advanced filtering system for products with fuzzy search support.
    
    Available filters:
        - search: Fuzzy search across name, description, and category
        - min_price: Minimum final price (considers sale prices)
        - max_price: Maximum final price (considers sale prices)
        - category: Filter by category (includes subcategories)
        - subcategory: Filter by specific subcategory
        - featured: Filter featured products
        - in_stock: Filter by stock availability
        - on_sale: Filter products on sale
        - created_after: Filter products created after date
        - created_before: Filter products created before date
        - price_range: Predefined price ranges (budget, standard, premium)
        - sort: Custom sorting options
    """
    # Price range filtering
    min_price = django_filters.NumberFilter(
        method='filter_min_price',
        label='Minimum final price'
    )
    max_price = django_filters.NumberFilter(
        method='filter_max_price',
        label='Maximum final price'
    )
    
    # Predefined price ranges
    price_range = django_filters.ChoiceFilter(
        choices=[
            ('budget', 'Under $25'),
            ('standard', '$25 - $100'),
            ('premium', '$100 - $500'),
            ('luxury', 'Over $500'),
        ],
        method='filter_price_range',
        label='Predefined price range'
    )
    
    # Advanced fuzzy search
    search = django_filters.CharFilter(
        method='filter_search',
        label='Fuzzy search in name, description, and category'
    )
    
    # Category filtering with hierarchy support
    category = django_filters.ModelChoiceFilter(
        queryset=Category.objects.filter(parent__isnull=True),
        method='filter_category_with_children',
        label='Category (includes subcategories)'
    )
    
    subcategory = django_filters.ModelChoiceFilter(
        queryset=Category.objects.all(),
        field_name='subcategory',
        label='Subcategory'
    )
    
    # Stock availability
    in_stock = django_filters.BooleanFilter(
        method='filter_in_stock',
        label='Products with available stock'
    )
    
    # Date range filtering
    created_after = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='gte',
        label='Created after date'
    )
    created_before = django_filters.DateFilter(
        field_name='created_at',
        lookup_expr='lte',
        label='Created before date'
    )
    
    # Price type filtering
    on_sale = django_filters.BooleanFilter(
        method='filter_on_sale',
        label='Products on sale'
    )
    
    # Featured products
    featured = django_filters.BooleanFilter(
        method='filter_featured',
        label='Featured products'
    )
    
    # Custom sorting
    sort = django_filters.ChoiceFilter(
        choices=[
            ('name_asc', 'Name (A-Z)'),
            ('name_desc', 'Name (Z-A)'),
            ('price_asc', 'Price (Low to High)'),
        ('price_desc', 'Price (High to Low)'),
            ('newest', 'Newest First'),
            ('oldest', 'Oldest First'),
            ('featured', 'Featured First'),
            ('popular', 'Most Popular'),
        ],
        method='filter_sort',
        label='Sort order'
    )

    class Meta:
        model = Product
        fields = [
            'category', 'subcategory', 'in_stock', 'on_sale',
            'min_price', 'max_price', 'price_range', 'search', 'sort',
            'created_after', 'created_before'
        ]

    def filter_min_price(self, queryset, name, value):
        """
        Filter by minimum final price (considering sale prices).
        
        Args:
            queryset: Base queryset
            name: Filter name
            value: Minimum price value
            
        Returns:
            QuerySet: Filtered queryset
        """
        if value is None:
            return queryset
        
        try:
            value = float(value)
            if value < 0:
                raise ValidationError("Minimum price cannot be negative.")
        except (ValueError, TypeError):
            raise ValidationError("Invalid minimum price value.")
        
        return filter_by_price_range(queryset, min_price=value)

    def filter_max_price(self, queryset, name, value):
        """
        Filter by maximum final price (considering sale prices).
        
        Args:
            queryset: Base queryset
            name: Filter name
            value: Maximum price value
            
        Returns:
            QuerySet: Filtered queryset
        """
        if value is None:
            return queryset
        
        try:
            value = float(value)
            if value < 0:
                raise ValidationError("Maximum price cannot be negative.")
        except (ValueError, TypeError):
            raise ValidationError("Invalid maximum price value.")
        
        return filter_by_price_range(queryset, max_price=value)
    
    def filter_price_range(self, queryset, name, value):
        """
        Filter by predefined price ranges.
        
        Args:
            queryset: Base queryset
            name: Filter name
            value: Price range choice
            
        Returns:
            QuerySet: Filtered queryset
        """
        price_ranges = {
            'budget': (0, 25),
            'standard': (25, 100),
            'premium': (100, 500),
            'luxury': (500, 999999),
        }
        
        if value not in price_ranges:
            return queryset
        
        min_price, max_price = price_ranges[value]
        return filter_by_price_range(queryset, min_price=min_price, max_price=max_price)

    def filter_search(self, queryset, name, value):
        """
        Perform fuzzy search in name, description, and category fields.
        
        Uses trigram similarity for advanced fuzzy matching.
        Falls back to basic search if PostgreSQL not available.
        
        Args:
            queryset: Base queryset
            name: Filter name
            value: Search term
            
        Returns:
            QuerySet: Filtered and ordered queryset by similarity
        """
        if not value or not value.strip():
            return queryset
        
        search_term = value.strip()
        
        # Use fuzzy search for better results
        try:
            return fuzzy_search_products(queryset, search_term, threshold=0.1)
        except Exception:
            # Fallback to basic search if fuzzy search fails
            search_query = Q()
            search_lower = search_term.lower()
            
            search_fields = ['name', 'description', 'category__name']
            for field in search_fields:
                search_query |= Q(**{f"{field}__icontains": search_lower})
            
            return queryset.filter(search_query).distinct()

    def filter_category_with_children(self, queryset, name, value):
        """
        Filter by category including all subcategories recursively.
        
        Args:
            queryset: Base queryset
            name: Filter name
            value: Category instance
            
        Returns:
            QuerySet: Filtered queryset
        """
        if not value:
            return queryset
        
        # Get all category IDs in the tree
        category_ids = get_category_tree(value)
        
        return queryset.filter(category_id__in=category_ids)

    def filter_in_stock(self, queryset, name, value):
        """
        Filter products by stock availability.
        
        Args:
            queryset: Base queryset
            name: Filter name
            value: Boolean value
            
        Returns:
            QuerySet: Filtered queryset
        """
        return filter_by_stock(queryset, value)

    def filter_on_sale(self, queryset, name, value):
        """
        Filter products that are on sale.
        
        Args:
            queryset: Base queryset
            name: Filter name
            value: Boolean value
            
        Returns:
            QuerySet: Filtered queryset
        """
        if value is True:
            return queryset.filter(sale_price__isnull=False)
        elif value is False:
            return queryset.filter(sale_price__isnull=True)
        return queryset
    
    def filter_featured(self, queryset, name, value):
        """
        Filter products by featured status.
        
        Args:
            queryset: Base queryset
            name: Filter name
            value: Boolean value
            
        Returns:
            QuerySet: Filtered queryset
        """
        if value is True:
            return queryset.filter(featured=True)
        elif value is False:
            return queryset.filter(featured=False)
        return queryset
    
    def filter_sort(self, queryset, name, value):
        """
        Apply custom sorting to queryset.
        
        Args:
            queryset: Base queryset
            name: Filter name
            value: Sort choice
            
        Returns:
            QuerySet: Ordered queryset
        """
        sort_mapping = {
            'name_asc': 'name',
            'name_desc': '-name',
            'price_asc': 'final_price',
            'price_desc': '-final_price',
            'newest': '-created_at',
            'oldest': 'created_at',
            'featured': '-featured',
            'popular': '-featured,-created_at',  # Sort by featured first, then newest
        }
        
        order_fields = sort_mapping.get(value, '-created_at')
        
        # Annotate with final_price if needed for price sorting
        if 'price' in value:
            queryset = queryset.annotate(
                final_price=Case(
                    When(sale_price__isnull=False, then='sale_price'),
                    default='price',
                    output_field=DecimalField(max_digits=10, decimal_places=2)
                )
            )
        
        # Handle multiple order fields (comma-separated)
        if ',' in order_fields:
            return queryset.order_by(*order_fields.split(','))
        else:
            return queryset.order_by(order_fields)
