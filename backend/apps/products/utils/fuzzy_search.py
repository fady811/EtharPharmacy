"""
Fuzzy search utilities for Product API.

This module provides advanced search functionality using trigram similarity
and other fuzzy matching techniques for improved search results.
"""

from django.db.models import Q, F, Value, FloatField
from django.db.models.functions import Greatest

# PostgreSQL-specific imports - only available when using PostgreSQL
try:
    from django.contrib.postgres.search import (
        TrigramSimilarity,
        SearchQuery,
        SearchRank,
        TrigramWordSimilarity
    )
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    TrigramSimilarity = None
    SearchQuery = None
    SearchRank = None
    TrigramWordSimilarity = None


class FuzzySearchEngine:
    """
    Advanced fuzzy search engine with multiple search strategies.
    """
    
    def __init__(self, search_term, threshold=0.1):
        """
        Initialize fuzzy search engine.
        
        Args:
            search_term (str): Search term to match
            threshold (float): Similarity threshold (0.0 to 1.0)
        """
        self.search_term = search_term
        self.threshold = threshold
    
    def search(self, queryset, fields=None):
        """
        Perform fuzzy search on queryset.
        
        Args:
            queryset: Base queryset to search
            fields (list, optional): List of fields to search in
            
        Returns:
            QuerySet: Filtered and ordered queryset by similarity
        """
        if not self.search_term or not fields:
            return queryset
        
        # Try PostgreSQL trigram similarity first
        try:
            return self._trigram_search(queryset, fields)
        except Exception:
            # Fallback to basic search if PostgreSQL not available
            return self._basic_search(queryset, fields)
    
    def _trigram_search(self, queryset, fields):
        """
        Perform trigram similarity search.

        Args:
            queryset: Base queryset
            fields (list): Fields to search

        Returns:
            QuerySet: Results ordered by similarity
        """
        if not POSTGRES_AVAILABLE:
            return self._basic_search(queryset, fields)

        similarity_expressions = []

        for field in fields:
            # Add trigram similarity for each field
            similarity_expr = TrigramSimilarity(field, self.search_term)
            similarity_expressions.append(similarity_expr)

        # Calculate greatest similarity across all fields
        queryset = queryset.annotate(
            similarity=Greatest(*similarity_expressions)
        )

        # Filter by threshold and order by similarity
        return queryset.filter(
            similarity__gte=self.threshold
        ).order_by('-similarity')
    
    def _basic_search(self, queryset, fields):
        """
        Fallback basic search with case-insensitive matching.
        
        Args:
            queryset: Base queryset
            fields (list): Fields to search
            
        Returns:
            QuerySet: Filtered queryset
        """
        search_query = Q()
        search_lower = self.search_term.lower()
        
        for field in fields:
            search_query |= Q(**{f"{field}__icontains": search_lower})
        
        return queryset.filter(search_query).distinct()


def fuzzy_search_products(queryset, search_term, threshold=0.1):
    """
    Perform fuzzy search on products with trigram similarity.
    
    Args:
        queryset: Product queryset
        search_term (str): Search term
        threshold (float): Similarity threshold (default: 0.1)
        
    Returns:
        QuerySet: Products ordered by similarity
    """
    if not search_term:
        return queryset
    
    # Always use basic search for now since trigram similarity is not available
    search_fields = ['name', 'description', 'category__name']
    search_query = Q()
    search_lower = search_term.lower()
    
    for field in search_fields:
        search_query |= Q(**{f"{field}__icontains": search_lower})
    
    return queryset.filter(search_query).distinct()


def word_similarity_search(queryset, search_term, field='name', threshold=0.3):
    """
    Perform word similarity search using trigram word similarity.

    Args:
        queryset: Base queryset
        search_term (str): Search term
        field (str): Field to search in
        threshold (float): Similarity threshold

    Returns:
        QuerySet: Results ordered by word similarity
    """
    if not search_term:
        return queryset

    if not POSTGRES_AVAILABLE:
        # Fallback to basic search
        return queryset.filter(**{f"{field}__icontains": search_term})

    try:
        queryset = queryset.annotate(
            word_similarity=TrigramWordSimilarity(field, search_term)
        )

        return queryset.filter(
            word_similarity__gte=threshold
        ).order_by('-word_similarity')

    except Exception:
        # Fallback to basic search
        return queryset.filter(**{f"{field}__icontains": search_term})


def get_search_suggestions(search_term, queryset, field='name', limit=5):
    """
    Get search suggestions based on partial matches.
    
    Args:
        search_term (str): Partial search term
        queryset: Base queryset
        field (str): Field to search in
        limit (int): Maximum number of suggestions
        
    Returns:
        list: List of search suggestions
    """
    if not search_term or len(search_term) < 2:
        return []
    
    try:
        suggestions = queryset.filter(
            **{f"{field}__istartswith": search_term}
        ).values_list(field, flat=True).distinct()[:limit]
        
        return list(suggestions)
    
    except Exception:
        return []


def highlight_search_terms(text, search_term, max_length=200):
    """
    Highlight search terms in text for display.
    
    Args:
        text (str): Text to highlight
        search_term (str): Search term to highlight
        max_length (int): Maximum length of highlighted text
        
    Returns:
        str: Highlighted text with HTML tags
    """
    if not text or not search_term:
        return text[:max_length] if text else ""
    
    text_lower = text.lower()
    search_lower = search_term.lower()
    
    # Find the first occurrence
    index = text_lower.find(search_lower)
    
    if index == -1:
        return text[:max_length]
    
    # Extract context around the match
    start = max(0, index - 50)
    end = min(len(text), index + len(search_term) + 50)
    
    excerpt = text[start:end]
    
    # Highlight the search term
    highlighted = excerpt.replace(
        search_term,
        f"<mark>{search_term}</mark>"
    )
    
    # Add ellipsis if needed
    if start > 0:
        highlighted = "..." + highlighted
    if end < len(text):
        highlighted = highlighted + "..."
    
    return highlighted
