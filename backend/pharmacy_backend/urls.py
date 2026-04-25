from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from pharmacy_backend.admin_site import pharma_admin_site

urlpatterns = [
    path('admin/', pharma_admin_site.urls),
    path('api/', include('apps.products.urls')),
    path('api/', include('apps.orders.urls')),
    path('api/', include('apps.coupons.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)