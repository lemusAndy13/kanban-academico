from django.contrib import admin
from django.urls import path, include
from api.views import register_view, LoginView, StudentLoginView, TeacherLoginView, default_courses
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', register_view, name='register'),
    path('api/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/token/student/', StudentLoginView.as_view(), name='token_student'),
    path('api/token/teacher/', TeacherLoginView.as_view(), name='token_teacher'),
    path('api/default-courses/', default_courses, name='default_courses'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('api.urls')),
]
