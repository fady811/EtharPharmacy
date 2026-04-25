from django.urls import path
from .views import (
    ProductListView,
    ProductDetailView,
    CategoryListView,
    CategoryProductsListView,
    CurrentPricesView,
    TestTimeoutView,
)

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:id>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/current-prices/', CurrentPricesView.as_view(), name='current-prices'),
    path('products/test-timeout/', TestTimeoutView.as_view(), name='test-timeout'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('categories/<int:category_id>/products/', CategoryProductsListView.as_view(), name='category-products'),
]