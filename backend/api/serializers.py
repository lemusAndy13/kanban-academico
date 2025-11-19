from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Board, List, Card, Comment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username','email']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Profile
        fields = ['user','role']

class BoardSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    class Meta:
        model = Board
        fields = ['id','name','owner','color','created_at']

class ListSerializer(serializers.ModelSerializer):
    class Meta:
        model = List
        fields = ['id','board','title','position']

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ['id','list','title','description','due_date','priority','position','created_by','assignees']

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = ['id','card','author','content','created_at']
