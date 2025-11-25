from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Board, Profile
from django.conf import settings


class IsBoardMember(BasePermission):
    def has_object_permission(self, request, view, obj):
        board = None
        if hasattr(obj, 'board'):
            board = obj.board
        elif hasattr(obj, 'list') and hasattr(obj.list, 'board'):
            board = obj.list.board
        elif hasattr(obj, 'card') and hasattr(obj.card, 'list') and hasattr(obj.card.list, 'board'):
            # Soporte para modelos que cuelgan de Card (p. ej., Attachment)
            board = obj.card.list.board
        elif isinstance(obj, Board):
            board = obj
        if not board:
            return False
        return board.members.filter(id=request.user.id).exists()


class CanDeleteBoard(BasePermission):
    """
    Solo el owner o usuarios con rol teacher pueden borrar el board.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if not isinstance(obj, Board):
            return True
        if request.user == obj.owner:
            return True
        try:
            return request.user.profile.role == 'teacher'
        except Profile.DoesNotExist:
            return False


class IsCourseOwner(BasePermission):
    """
    Permite la acción solo si el usuario es el catedrático asignado (owner) del curso.
    Aplica a objetos que referencien a Board directamente o vía list.board.
    """
    def has_object_permission(self, request, view, obj):
        board = None
        if isinstance(obj, Board):
            board = obj
        elif hasattr(obj, 'board'):
            board = obj.board
        elif hasattr(obj, 'list') and hasattr(obj.list, 'board'):
            board = obj.list.board
        if not board:
            return False
        return request.user == board.owner


class IsSingleAdmin(BasePermission):
    """
    Permite acceso únicamente al usuario administrador único configurado.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.username == settings.ADMIN_USERNAME)


