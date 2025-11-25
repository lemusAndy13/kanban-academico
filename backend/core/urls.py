from django.contrib import admin
from django.urls import path, include
from api.views import (
    register_view,
    LoginView,
    StudentLoginView,
    TeacherLoginView,
    default_courses,
    AuthRegisterView,
    AuthLoginView,
    MeView,
)
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Legacy auth routes (compatibilidad)
    path('api/register/', register_view, name='register'),
    path('api/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/token/student/', StudentLoginView.as_view(), name='token_student'),
    path('api/token/teacher/', TeacherLoginView.as_view(), name='token_teacher'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Nuevos endpoints de autenticación y perfil
    path('api/auth/register/', AuthRegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', AuthLoginView.as_view(), name='auth_login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/default-courses/', default_courses, name='default_courses'),
    # Documentación OpenAPI / Swagger / Redoc
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
