"""
Cache utility functions for Product API.

This module provides helper functions for managing cache keys,
generating cache keys based on query parameters, and handling
cache invalidation strategies.
"""

from django.core.cache import cache
from django.conf import settings


def generate_cache_key(prefix, params=None, user_id=None):
    """
    Generate a unique cache key based on prefix, query parameters, and user ID.
    
    Args:
        prefix (str): Base prefix for the cache key
        params (dict, optional): Query parameters to include in cache key
        user_id (int, optional): User ID for user-specific caching
        
    Returns:
        str: Generated cache key
    """
    key_parts = [prefix]
    
    if params:
        sorted_params = sorted(params.items())
        for key, value in sorted_params:
            if value is not None and value != '':
                key_parts.append(f"{key}:{value}")
    
    if user_id:
        key_parts.append(f"user:{user_id}")
    
    return ":".join(key_parts)


def get_cached_data(cache_key, default=None):
    """
    Retrieve data from cache with error handling.
    
    Args:
        cache_key (str): Cache key to retrieve
        default: Default value if cache miss
        
    Returns:
        Cached data or default value
    """
    try:
        return cache.get(cache_key, default)
    except Exception:
        return default


def set_cached_data(cache_key, data, timeout=300):
    """
    Store data in cache with error handling.
    
    Args:
        cache_key (str): Cache key to store
        data: Data to cache
        timeout (int): Cache timeout in seconds (default: 5 minutes)
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        cache.set(cache_key, data, timeout)
        return True
    except Exception:
        return False


def invalidate_cache_pattern(pattern):
    """
    Invalidate cache entries matching a pattern.
    Note: This requires a cache backend that supports pattern deletion.
    
    Args:
        pattern (str): Cache key pattern to invalidate
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if hasattr(cache, 'delete_pattern'):
            cache.delete_pattern(pattern)
            return True
        return False
    except Exception:
        return False


def invalidate_product_cache(product_id=None, category_id=None):
    """
    Invalidate product-related cache entries.
    
    Args:
        product_id (int, optional): Specific product ID to invalidate
        category_id (int, optional): Category ID to invalidate all products in category
    """
    if product_id:
        cache_key = generate_cache_key(f"product:detail", {'id': product_id})
        cache.delete(cache_key)
    
    if category_id:
        pattern = generate_cache_key("products:list", {'category': category_id})
        invalidate_cache_pattern(pattern)
    
    # Invalidate general product list cache
    invalidate_cache_pattern("products:list:*")


def get_cache_timeout(cache_type='short'):
    """
    Get cache timeout based on type.
    
    Args:
        cache_type (str): Type of cache ('short', 'medium', 'long')
        
    Returns:
        int: Cache timeout in seconds
    """
    timeouts = {
        'short': 300,      # 5 minutes
        'medium': 1800,    # 30 minutes
        'long': 3600,      # 1 hour
    }
    return timeouts.get(cache_type, 300)
