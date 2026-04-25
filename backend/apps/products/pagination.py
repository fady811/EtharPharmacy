from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.response import Response
from collections import OrderedDict

class StandardResultsSetPagination(PageNumberPagination):
    """
    Production-ready pagination with metadata.
    
    Features:
        - Configurable page size
        - Rich pagination metadata
        - Support for custom page size via query parameter
        - Maximum page size limit
    
    Query Parameters:
        - page: Page number (default: 1)
        - page_size: Items per page (default: 20, max: 100)
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Return a paginated response with rich metadata.
        
        Args:
            data: Paginated data
            
        Returns:
            Response: Formatted paginated response
        """
        return Response(OrderedDict([
            ('success', True),
            ('status', 200),
            ('pagination', {
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'total_items': self.page.paginator.count,
                'items_per_page': self.page_size,
                'has_next': self.page.has_next(),
                'has_previous': self.page.has_previous(),
                'next_page': self.get_next_link(),
                'previous_page': self.get_previous_link(),
            }),
            ('data', data)
        ]))

class LargeResultsSetPagination(PageNumberPagination):
    """
    Pagination for admin endpoints with larger page sizes.
    
    Features:
        - Larger default page size
        - Higher maximum page size
        - Same metadata structure as StandardResultsSetPagination
    
    Query Parameters:
        - page: Page number (default: 1)
        - page_size: Items per page (default: 50, max: 200)
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
    
    def get_paginated_response(self, data):
        """
        Return a paginated response with rich metadata.
        
        Args:
            data: Paginated data
            
        Returns:
            Response: Formatted paginated response
        """
        return Response(OrderedDict([
            ('success', True),
            ('status', 200),
            ('pagination', {
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'total_items': self.page.paginator.count,
                'items_per_page': self.page_size,
                'has_next': self.page.has_next(),
                'has_previous': self.page.has_previous(),
                'next_page': self.get_next_link(),
                'previous_page': self.get_previous_link(),
            }),
            ('data', data)
        ]))


class ProductCursorPagination(CursorPagination):
    """
    Cursor-based pagination for optimal performance on large datasets.
    
    Features:
        - No offset-based pagination (better for large datasets)
        - Consistent ordering
        - No duplicate items
        - Better performance with indexed fields
    
    Query Parameters:
        - cursor: Pagination cursor
        - page_size: Items per page (default: 20, max: 100)
    
    Note:
        Cursor pagination doesn't provide total count or total pages.
        Use StandardResultsSetPagination if you need those features.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-created_at'
    
    def get_paginated_response(self, data):
        """
        Return a cursor-paginated response with metadata.
        
        Args:
            data: Paginated data
            
        Returns:
            Response: Formatted paginated response
        """
        return Response(OrderedDict([
            ('success', True),
            ('status', 200),
            ('pagination', {
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'page_size': self.page_size,
                'has_next': self.has_next(),
                'has_previous': self.has_previous(),
            }),
            ('data', data)
        ]))
    
    def has_next(self):
        """
        Check if there's a next page.
        
        Returns:
            bool: True if next page exists
        """
        return self.get_next_link() is not None
    
    def has_previous(self):
        """
        Check if there's a previous page.
        
        Returns:
            bool: True if previous page exists
        """
        return self.get_previous_link() is not None
