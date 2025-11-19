from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Board, List, Card, Comment, Profile
from .serializers import (
    BoardSerializer, ListSerializer, CardSerializer,
    CommentSerializer, UserSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers


# -----------------------
# LOGIN TOKEN JWT
# -----------------------
class LoginView(TokenObtainPairView):
    """Devuelve access y refresh JWT"""
    pass


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
# BOARDS CRUD
# -----------------------
class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Board.objects.filter(members=self.request.user)

    def perform_create(self, serializer):
        board = serializer.save(owner=self.request.user)
        board.members.add(self.request.user)


class ListViewSet(viewsets.ModelViewSet):
    queryset = List.objects.all()
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated]


class CardViewSet(viewsets.ModelViewSet):
    queryset = Card.objects.all()
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
