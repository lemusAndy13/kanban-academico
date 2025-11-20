from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Board, List, Card, Comment, Profile, Label, ChecklistItem, Attachment, Activity
from .serializers import (
    BoardSerializer, ListSerializer, CardSerializer,
    CommentSerializer, UserSerializer, LabelSerializer,
    ChecklistItemSerializer, AttachmentSerializer, ActivitySerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import status
from rest_framework import serializers
from django.db import models
from .permissions import IsBoardMember, CanDeleteBoard
from rest_framework.permissions import IsAdminUser
from .serializers import AdminUserSerializer


# -----------------------
# LOGIN TOKEN JWT
# -----------------------
class AnyRoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Igual que el token normal pero incluyendo role, username, user_id e is_staff.
    No impone un rol específico.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        try:
            role = user.profile.role  # type: ignore[attr-defined]
        except Profile.DoesNotExist:
            role = 'student'
        data["role"] = role
        data["username"] = user.username
        data["user_id"] = user.id
        data["is_staff"] = user.is_staff
        return data


class LoginView(TokenObtainPairView):
    """Devuelve access y refresh JWT para cualquier usuario. Incluye role e is_staff."""
    serializer_class = AnyRoleTokenObtainPairSerializer


class BaseRoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    expected_role = None  # 'student' o 'teacher'

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        try:
            role = user.profile.role
        except Profile.DoesNotExist:
            role = 'student'
        # Si se exige rol específico, validarlo
        if self.expected_role and role != self.expected_role:
            raise serializers.ValidationError(
                {"detail": f"Este usuario no es {self.expected_role}."}
            )
        # Incluir rol en la respuesta
        data["role"] = role
        data["username"] = user.username
        data["user_id"] = user.id
        data["is_staff"] = user.is_staff
        return data


class StudentTokenObtainPairSerializer(BaseRoleTokenObtainPairSerializer):
    expected_role = 'student'


class TeacherTokenObtainPairSerializer(BaseRoleTokenObtainPairSerializer):
    expected_role = 'teacher'


class StudentLoginView(TokenObtainPairView):
    serializer_class = StudentTokenObtainPairSerializer


class TeacherLoginView(TokenObtainPairView):
    serializer_class = TeacherTokenObtainPairSerializer


# -----------------------
# REGISTRO
# -----------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User(username=validated_data['username'],
                    email=validated_data.get('email', ''))
        user.set_password(validated_data['password'])
        user.save()
        Profile.objects.create(user=user)
        return user


@api_view(['POST'])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(UserSerializer(user).data, status=201)

# -----------------------
# CURSOS POR DEFECTO (CATEDRÁTICO)
# -----------------------
DEFAULT_COURSES = [
    {"id": 101, "code": "MAT101", "name": "Matemática I", "room": "A-101"},
    {"id": 102, "code": "FIS101", "name": "Física I", "room": "B-201"},
    {"id": 103, "code": "QUI101", "name": "Química General", "room": "C-105"},
    {"id": 104, "code": "PRO101", "name": "Programación I", "room": "Lab-1"},
    {"id": 105, "code": "PRO102", "name": "Programación II", "room": "Lab-2"},
    {"id": 106, "code": "EST201", "name": "Estadística", "room": "D-303"},
    {"id": 107, "code": "CAL201", "name": "Cálculo II", "room": "A-203"},
    {"id": 108, "code": "ADM101", "name": "Administración", "room": "E-101"},
    {"id": 109, "code": "INF201", "name": "Bases de Datos", "room": "Lab-DB"},
    {"id": 110, "code": "ING101", "name": "Inglés I", "room": "F-210"},
]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def default_courses(request):
    try:
        role = request.user.profile.role  # type: ignore[attr-defined]
    except (Profile.DoesNotExist, AttributeError):
        role = 'student'
    if role != 'teacher':
        return Response({"detail": "Solo catedráticos."}, status=403)
    return Response(DEFAULT_COURSES, status=200)


# -----------------------
# BOARDS CRUD
# -----------------------
class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated, IsBoardMember|CanDeleteBoard]

    def get_queryset(self):
        return Board.objects.filter(members=self.request.user)

    def perform_create(self, serializer):
        board = serializer.save(owner=self.request.user)
        board.members.add(self.request.user)

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        board = self.get_object()
        try:
            if request.user.profile.role != 'teacher' and request.user != board.owner:
                return Response({"detail": "Solo docentes u owners pueden invitar."}, status=403)
        except Profile.DoesNotExist:
            return Response({"detail": "Perfil no encontrado."}, status=400)
        username = request.data.get('username')
        if not username:
            return Response({"detail": "username requerido"}, status=400)
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "Usuario no existe"}, status=404)
        board.members.add(user)
        Activity.objects.create(board=board, actor=request.user, action='updated', meta={"invited": user.username})
        return Response({"detail": "Miembro agregado"}, status=200)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        board = self.get_object()
        qs = board.members.all().order_by('username')
        return Response(UserSerializer(qs, many=True).data, status=200)

class ListViewSet(viewsets.ModelViewSet):
    queryset = List.objects.all()
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated]


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated, IsBoardMember]

    def perform_create(self, serializer):
        card = serializer.save(created_by=self.request.user)
        # Log actividad de creación
        Activity.objects.create(
            board=card.list.board,
            card=card,
            actor=self.request.user,
            action='created',
            meta={"card": card.id, "title": card.title}
        )

    def get_queryset(self):
        user = self.request.user
        # Tarjetas visibles por pertenecer al board, por ser creador o asignado
        return Card.objects.filter(
            models.Q(list__board__members=user) |
            models.Q(created_by=user) |
            models.Q(assignees=user)
        ).distinct()

    def perform_update(self, serializer):
        card = serializer.save()
        Activity.objects.create(
            board=card.list.board,
            card=card,
            actor=self.request.user,
            action='updated',
            meta={"card": card.id}
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        label = request.query_params.get('label')
        assignee = request.query_params.get('assignee')
        due_before = request.query_params.get('due_before')
        due_after = request.query_params.get('due_after')
        search = request.query_params.get('search')
        if label:
            queryset = queryset.filter(labels__id=label)
        if assignee:
            queryset = queryset.filter(assignees__id=assignee)
        if due_before:
            queryset = queryset.filter(due_date__lte=due_before)
        if due_after:
            queryset = queryset.filter(due_date__gte=due_after)
        if search:
            queryset = queryset.filter(models.Q(title__icontains=search) | models.Q(description__icontains=search))
        self.queryset = queryset
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['patch'])
    def move(self, request, pk=None):
        """
        Mover tarjeta a otra lista/posición.
        Payload: { "list": <list_id>, "position": <int> }
        """
        card = self.get_object()
        target_list_id = request.data.get("list")
        position = request.data.get("position")
        if target_list_id is None or position is None:
            return Response({"detail": "list y position son requeridos"}, status=400)

        try:
            position = int(position)
        except ValueError:
            return Response({"detail": "position inválida"}, status=400)

        try:
            target_list = List.objects.get(id=target_list_id)
        except List.DoesNotExist:
            return Response({"detail": "list no existe"}, status=404)

        # Validar que el usuario sea miembro del board destino
        if not target_list.board.members.filter(id=request.user.id).exists():
            return Response({"detail": "No autorizado en el tablero destino"}, status=403)

        # Mover
        card.list = target_list
        card.position = max(0, position)
        card.save()

        # Reindexar posiciones en la lista destino
        cards = list(target_list.cards.exclude(id=card.id).order_by('position'))
        cards.insert(min(card.position, len(cards)), card)
        for idx, c in enumerate(cards):
            if c.position != idx:
                Card.objects.filter(id=c.id).update(position=idx)

        Activity.objects.create(
            board=target_list.board,
            card=card,
            actor=request.user,
            action='moved',
            meta={"to_list": target_list.id, "position": card.position}
        )
        return Response(CardSerializer(card).data, status=200)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
        Activity.objects.create(
            board=comment.card.list.board,
            card=comment.card,
            actor=self.request.user,
            action='commented',
            meta={"comment_id": comment.id}
        )


class LabelViewSet(viewsets.ModelViewSet):
    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Label.objects.filter(board__members=user)


class ChecklistItemViewSet(viewsets.ModelViewSet):
    queryset = ChecklistItem.objects.all()
    serializer_class = ChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsBoardMember]


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsBoardMember]


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated, IsBoardMember]
    queryset = Activity.objects.all()

    def get_queryset(self):
        user = self.request.user
        qs = Activity.objects.filter(board__members=user)
        board_id = self.request.query_params.get('board')
        card_id = self.request.query_params.get('card')
        if board_id:
            qs = qs.filter(board_id=board_id)
        if card_id:
            qs = qs.filter(card_id=card_id)
        return qs


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('password')
        if not new_password:
            return Response({"detail": "password requerido"}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({"detail": "Contraseña actualizada"}, status=status.HTTP_200_OK)
