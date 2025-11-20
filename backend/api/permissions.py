from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Board, Profile


class IsBoardMember(BasePermission):
    def has_object_permission(self, request, view, obj):
        board = None
        if hasattr(obj, 'board'):
            board = obj.board
        elif hasattr(obj, 'list') and hasattr(obj.list, 'board'):
            board = obj.list.board
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


