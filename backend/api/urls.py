from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from api.views import (
    BoardViewSet, ListViewSet, CardViewSet,
    CommentViewSet, register_view, LoginView,
    StudentLoginView, TeacherLoginView,
    LabelViewSet, ChecklistItemViewSet, AttachmentViewSet, ActivityViewSet,
    AdminUserViewSet
)
from rest_framework_simplejwt.views import TokenRefreshView

router = routers.DefaultRouter()
router.register(r'boards', BoardViewSet, basename='boards')
router.register(r'lists', ListViewSet, basename='lists')
router.register(r'cards', CardViewSet, basename='cards')
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r'labels', LabelViewSet, basename='labels')
router.register(r'checklist', ChecklistItemViewSet, basename='checklist')
router.register(r'attachments', AttachmentViewSet, basename='attachments')
router.register(r'activities', ActivityViewSet, basename='activities')
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', register_view, name='register'),
    path('api/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/token/student/', StudentLoginView.as_view(), name='token_student'),
    path('api/token/teacher/', TeacherLoginView.as_view(), name='token_teacher'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
]
