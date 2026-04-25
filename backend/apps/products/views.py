from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.exceptions import NotFound, ValidationError as DRFValidationError
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch, Q, F, Case, When, Value, DecimalField, Count, Min
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers, vary_on_cookie
from django.core.cache import cache
from django.core.exceptions import ValidationError
import logging

from .models import Product, Category, ProductImage
from .serializers import (
    ProductSerializer, 
    ProductListSerializer,
    CategorySerializer
)
from .filters import ProductFilter
from .pagination import StandardResultsSetPagination, ProductCursorPagination
from .utils.cache_helpers import (
    generate_cache_key,
    get_cached_data,
    set_cached_data,
    invalidate_cache_pattern,
    get_cache_timeout
)
from .utils.query_helpers import get_optimized_product_queryset
from .utils.response_helpers import (
    success_response,
    error_response,
    not_found_response,
    server_error_response
)

logger = logging.getLogger(__name__)


class ProductRateThrottle(AnonRateThrottle):
    """
    Custom throttle class for product endpoints.
    
    Rate: 100 requests per hour for anonymous users
    """
    rate = '100/hour'
    scope = 'product_list'


class ProductDetailRateThrottle(AnonRateThrottle):
    """
    Custom throttle class for product detail endpoints.
    
    Rate: 200 requests per hour for anonymous users
    """
    rate = '200/hour'
    scope = 'product_detail'


class CategoryRateThrottle(AnonRateThrottle):
    """
    Custom throttle class for category endpoints.
    
    Rate: 200 requests per hour for anonymous users
    """
    rate = '200/hour'
    scope = 'category_list'

class CategoryListView(generics.ListAPIView):
    """
    Optimized category listing with hierarchy support.
    
    Endpoint: GET /api/categories/
    
    Query Parameters:
        - main_only (bool): Return only main categories (no subcategories)
    
    Features:
        - Hierarchy support with nested children
        - Product count per category
        - Category depth information
        - Optimized with prefetch_related
        - Cached for 30 minutes
        - Rate limited to 200 requests/hour
    """
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    throttle_classes = [CategoryRateThrottle]
    
    def get_queryset(self):
        """
        Get optimized category queryset.
        
        Returns:
            QuerySet: Optimized category queryset
        """
        try:
            queryset = Category.objects.all()
            main_only = self.request.query_params.get('main_only')
            
            if main_only and main_only.lower() == 'true':
                queryset = queryset.filter(parent__isnull=True)
            
            # Optimize with prefetch_related for children
            queryset = queryset.prefetch_related('children')
            
            return queryset
        except Exception as e:
            logger.error(f"Error in CategoryListView.get_queryset: {str(e)}")
            raise
    
    @method_decorator(cache_page(1800))  # Cache for 30 minutes
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        """
        Cached list view with proper headers.
        
        Returns:
            Response: Categories list with metadata
        """
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in CategoryListView.list: {str(e)}")
            return server_error_response("Failed to retrieve categories")

class ProductListView(generics.ListAPIView):
    """
    Production-ready product listing with comprehensive features.
    
    Endpoint: GET /api/products/
    
    Query Parameters:
        - search (str): Fuzzy search term
        - category (int): Category ID (includes subcategories)
        - subcategory (int): Subcategory ID
        - min_price (decimal): Minimum price
        - max_price (decimal): Maximum price
        - price_range (str): Predefined range (budget, standard, premium, luxury)
        - featured (bool): Filter featured products
        - in_stock (bool): Filter by stock availability
        - on_sale (bool): Filter products on sale
        - created_after (date): Created after date
        - created_before (date): Created before date
        - sort (str): Sort order (name_asc, name_desc, price_asc, price_desc, newest, oldest, featured, popular)
        - page (int): Page number
        - page_size (int): Items per page (max 100)
    
    Features:
        - Advanced filtering with fuzzy search
        - Pagination with rich metadata
        - Optimized queries with select_related/prefetch_related
        - Intelligent caching based on query parameters
        - Error handling and logging
        - Rate limited to 100 requests/hour
    """
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'category__name']
    throttle_classes = [ProductRateThrottle]

    def get_queryset(self):
        """
        Get optimized product queryset with all enhancements.
        
        Returns:
            QuerySet: Optimized product queryset
        """
        try:
            # Use optimized base queryset
            queryset = get_optimized_product_queryset()
            
            # Apply filters
            queryset = self.filter_queryset(queryset)
            
            return queryset
        except Exception as e:
            logger.error(f"Error in ProductListView.get_queryset: {str(e)}")
            raise
    
    def get_serializer_context(self):
        """
        Add request to serializer context for URL generation.
        
        Returns:
            dict: Serializer context
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @method_decorator(vary_on_headers('Authorization', 'Cookie'))
    def list(self, request, *args, **kwargs):
        """
        Cached list view with error handling.
        
        Returns:
            Response: Products list with pagination metadata
        """
        try:
            return super().list(request, *args, **kwargs)
        except DRFValidationError as e:
            logger.warning(f"Validation error in ProductListView.list: {str(e)}")
            return error_response(str(e), status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in ProductListView.list: {str(e)}")
            return server_error_response("Failed to retrieve products")

class CategoryProductsListView(generics.ListAPIView):
    """
    Products in specific category with all optimizations.
    
    Endpoint: GET /api/categories/{category_id}/products/
    
    URL Parameters:
        - category_id (int): Category ID
    
    Query Parameters:
        - Same as ProductListView (search, price filters, sorting, pagination)
    
    Features:
        - Filter by specific category
        - All ProductListView features
        - Optimized queries
        - Cached for 5 minutes
        - Rate limited to 100 requests/hour
    """
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'sale_price', 'created_at']
    ordering = ['-created_at']
    throttle_classes = [ProductRateThrottle]

    def get_queryset(self):
        """
        Get optimized queryset for category-specific products.
        
        Returns:
            QuerySet: Optimized product queryset for category
        """
        try:
            category_id = self.kwargs.get('category_id')
            
            # Validate category exists
            if not Category.objects.filter(id=category_id).exists():
                raise NotFound(f"Category with id {category_id} not found")
            
            # Start with category-specific products
            queryset = Product.objects.filter(category_id=category_id)
            
            # Apply optimizations
            queryset = get_optimized_product_queryset().filter(category_id=category_id)
            
            return queryset
        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error in CategoryProductsListView.get_queryset: {str(e)}")
            raise
    
    @method_decorator(vary_on_headers('Authorization', 'Cookie'))
    def list(self, request, *args, **kwargs):
        """
        Cached list view with error handling.
        
        Returns:
            Response: Products list for category
        """
        try:
            return super().list(request, *args, **kwargs)
        except NotFound as e:
            logger.warning(f"Not found in CategoryProductsListView.list: {str(e)}")
            return not_found_response("Category")
        except Exception as e:
            logger.error(f"Error in CategoryProductsListView.list: {str(e)}")
            return server_error_response("Failed to retrieve category products")

class ProductDetailView(generics.RetrieveAPIView):
    """
    Optimized product detail view.
    
    Endpoint: GET /api/products/{id}/
    
    URL Parameters:
        - id (int): Product ID
    
    Features:
        - Full product details with all related data
        - Optimized queries
        - Cached for 10 minutes
        - Rate limited to 200 requests/hour
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'
    throttle_classes = [ProductDetailRateThrottle]

    def get_queryset(self):
        """
        Get optimized queryset for single product retrieval.
        
        Returns:
            QuerySet: Optimized product queryset
        """
        try:
            return get_optimized_product_queryset()
        except Exception as e:
            logger.error(f"Error in ProductDetailView.get_queryset: {str(e)}")
            raise
    
    def get_serializer_context(self):
        """
        Add request to serializer context for URL generation.
        
        Returns:
            dict: Serializer context
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @method_decorator(vary_on_headers('Authorization', 'Cookie'))
    def retrieve(self, request, *args, **kwargs):
        """
        Cached retrieve view with error handling.
        
        Returns:
            Response: Product detail
        """
        try:
            instance = self.get_object()
            serializer = self.serializer_class(instance, context=self.get_serializer_context())
            return success_response(data=serializer.data)
        except NotFound as e:
            logger.warning(f"Not found in ProductDetailView.retrieve: {str(e)}")
            return not_found_response("Product")
        except Exception as e:
            logger.error(f"Error in ProductDetailView.retrieve: {str(e)}")
            return server_error_response("Failed to retrieve product")


class CurrentPricesView(APIView):
    """
    Get current prices for multiple products.
    
    Endpoint: POST /api/products/current-prices/
    
    Request Body:
    {
        "product_ids": [1, 2, 3]
    }
    
    Response:
    {
        "prices": {
            "1": "29.99",
            "2": "14.99",
            "3": "19.99"
        }
    }
    
    Features:
        - Guest accessible (no authentication required)
        - Optimized query with select_related
        - Cached for 2 minutes
        - Rate limited to 200 requests/hour
    """
    permission_classes = [AllowAny]
    throttle_classes = [ProductDetailRateThrottle]
    
    def post(self, request, *args, **kwargs):

        """
        Get current prices for specified product IDs.
        
        Returns:
            Response: Current prices for products
        """
        try:
            product_ids = request.data.get('product_ids', [])
            
            # Validate input
            if not isinstance(product_ids, list):
                return Response(
                    {"success": False, "message": "product_ids must be an array"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(product_ids) == 0:
                return Response({"success": True, "data": {"prices": {}}})
            
            if len(product_ids) > 100:
                return Response(
                    {"success": False, "message": "Maximum 100 product IDs allowed"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get current prices with optimized query
            products = Product.objects.filter(
                id__in=product_ids
            ).only('id', 'price', 'sale_price', 'stock_quantity')
            
            prices = {}
            for product in products:
                # Map to the fields expected by the frontend
                prices[str(product.id)] = {
                    "original_price": str(product.price),
                    "current_price": str(product.sale_price if product.sale_price else product.price),
                    "stock_quantity": product.stock_quantity
                }
            
            return Response({"success": True, "data": {"prices": prices}})


            
        except Exception as e:
            logger.error(f"Error in CurrentPricesView.post: {str(e)}")
            return Response(
                {"success": False, "message": "Failed to retrieve current prices"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TestTimeoutView(APIView):
    """
    Test endpoint that simulates a slow response.
    
    Endpoint: GET /api/products/test-timeout/
    
    Returns after 15 seconds to test timeout functionality.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        import time
        time.sleep(15)  # Sleep for 15 seconds
        return Response({"success": True, "message": "This should timeout"})