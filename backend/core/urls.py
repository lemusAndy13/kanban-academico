from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from api.views import (
    BoardViewSet, ListViewSet, CardViewSet,
    CommentViewSet, register_view, LoginView,
    StudentLoginView, TeacherLoginView, default_courses
)
from rest_framework_simplejwt.views import TokenRefreshView

router = routers.DefaultRouter()
router.register(r'boards', BoardViewSet, basename='boards')
router.register(r'lists', ListViewSet, basename='lists')
router.register(r'cards', CardViewSet, basename='cards')
router.register(r'comments', CommentViewSet, basename='comments')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', register_view, name='register'),
    path('api/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/token/student/', StudentLoginView.as_view(), name='token_student'),
    path('api/token/teacher/', TeacherLoginView.as_view(), name='token_teacher'),
    path('api/default-courses/', default_courses, name='default_courses'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
]
