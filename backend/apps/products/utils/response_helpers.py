"""
Response utility functions for Product API.

This module provides helper functions for creating consistent
API responses with proper error handling and formatting.
"""

from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message=None, status_code=status.HTTP_200_OK):
    """
    Create a standardized success response.
    
    Args:
        data: Response data payload
        message (str, optional): Success message
        status_code: HTTP status code (default: 200)
        
    Returns:
        Response: Formatted success response
    """
    response_data = {
        'success': True,
        'status': status_code,
    }
    
    if message:
        response_data['message'] = message
    
    if data is not None:
        response_data['data'] = data
    
    return Response(response_data, status=status_code)


def error_response(message, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Create a standardized error response.
    
    Args:
        message (str): Error message
        errors (dict, optional): Detailed error information
        status_code: HTTP status code (default: 400)
        
    Returns:
        Response: Formatted error response
    """
    response_data = {
        'success': False,
        'status': status_code,
        'message': message,
    }
    
    if errors:
        response_data['errors'] = errors
    
    return Response(response_data, status=status_code)


def paginated_response(data, pagination_info, message=None):
    """
    Create a paginated response with metadata.
    
    Args:
        data: Paginated data
        pagination_info (dict): Pagination metadata
        message (str, optional): Success message
        
    Returns:
        Response: Formatted paginated response
    """
    response_data = {
        'success': True,
        'status': status.HTTP_200_OK,
        'pagination': pagination_info,
        'data': data,
    }
    
    if message:
        response_data['message'] = message
    
    return Response(response_data, status=status.HTTP_200_OK)


def validation_error_response(errors, message="Validation failed"):
    """
    Create a validation error response.
    
    Args:
        errors (dict): Validation errors
        message (str): Error message
        
    Returns:
        Response: Formatted validation error response
    """
    return error_response(message, errors, status.HTTP_422_UNPROCESSABLE_ENTITY)


def not_found_response(resource_name="Resource"):
    """
    Create a not found error response.
    
    Args:
        resource_name (str): Name of the resource not found
        
    Returns:
        Response: Formatted not found response
    """
    return error_response(
        f"{resource_name} not found",
        status_code=status.HTTP_404_NOT_FOUND
    )


def server_error_response(message="Internal server error"):
    """
    Create a server error response.
    
    Args:
        message (str): Error message
        
    Returns:
        Response: Formatted server error response
    """
    return error_response(
        message,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def unauthorized_response(message="Authentication required"):
    """
    Create an unauthorized error response.
    
    Args:
        message (str): Error message
        
    Returns:
        Response: Formatted unauthorized response
    """
    return error_response(
        message,
        status_code=status.HTTP_401_UNAUTHORIZED
    )


def forbidden_response(message="Access denied"):
    """
    Create a forbidden error response.
    
    Args:
        message (str): Error message
        
    Returns:
        Response: Formatted forbidden response
    """
    return error_response(
        message,
        status_code=status.HTTP_403_FORBIDDEN
    )
