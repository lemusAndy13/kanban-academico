from django.urls import path, include
from rest_framework import routers
from api.views import (
    BoardViewSet, ListViewSet, CardViewSet,
    CommentViewSet, LabelViewSet, ChecklistItemViewSet,
    AttachmentViewSet, ActivityViewSet, AdminUserViewSet, AnnouncementViewSet
)

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
router.register(r'announcements', AnnouncementViewSet, basename='announcements')

# Estas rutas se incluirán desde core.urls con prefijo '/api/'
urlpatterns = [
    path('', include(router.urls)),
]
