"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.logistics.views import (
    CepLookupView,
    CoverageCheckView,
    DashboardSummaryView,
    DeliveryAreaViewSet,
    DeliveryOrderViewSet,
    DriverViewSet,
    GarageViewSet,
    VehicleViewSet,
)
from apps.accounts.views import UserViewSet, MeView
router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet)
router.register(r'drivers', DriverViewSet)
router.register(r'delivery-orders', DeliveryOrderViewSet)
router.register(r'garages', GarageViewSet)
router.register(r'delivery-areas', DeliveryAreaViewSet)
router.register(r'users', UserViewSet)


urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/schema/swagger-ui/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),
    path('api/coverage-check/', CoverageCheckView.as_view(), name='coverage-check'),
    path(
        'api/dashboard-summary/',
        DashboardSummaryView.as_view(),
        name='dashboard-summary',
    ),
    path('api/cep-lookup/', CepLookupView.as_view(), name='cep-lookup'),
    path('api/me/', MeView.as_view(), name='me'),
]

if getattr(settings, "ENABLE_ADMIN", True):
    urlpatterns.insert(0, path('admin/', admin.site.urls))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
