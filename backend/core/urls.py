from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from api.views import (
    BoardViewSet, ListViewSet, CardViewSet,
    CommentViewSet, register_view, LoginView
)

router = routers.DefaultRouter()
router.register(r'boards', BoardViewSet, basename='boards')
router.register(r'lists', ListViewSet, basename='lists')
router.register(r'cards', CardViewSet, basename='cards')
router.register(r'comments', CommentViewSet, basename='comments')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', register_view, name='register'),
    path('api/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/', include(router.urls)),
]
