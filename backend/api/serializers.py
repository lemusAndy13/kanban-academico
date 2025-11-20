from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Board, List, Card, Comment, Label, ChecklistItem, Attachment, Activity

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
    members = UserSerializer(read_only=True, many=True)
    class Meta:
        model = Board
        fields = ['id','name','owner','members','color','created_at']

class ListSerializer(serializers.ModelSerializer):
    class Meta:
        model = List
        fields = ['id','board','title','position']

class CardSerializer(serializers.ModelSerializer):
    labels = serializers.PrimaryKeyRelatedField(queryset=Label.objects.all(), many=True, required=False)
    board = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Card
        fields = ['id','list','board','title','description','due_date','priority','position','created_by','assignees','labels']

    def get_board(self, obj):
        try:
            return obj.list.board_id
        except Exception:
            return None

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = ['id','card','author','content','created_at']

class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id','board','name','color']

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ['id','card','text','done','position']

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id','card','url','name','created_at']

class ActivitySerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    class Meta:
        model = Activity
        fields = ['id','card','board','actor','action','meta','created_at']


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=[('student', 'student'), ('teacher', 'teacher')], write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    profile_role = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'is_staff', 'password', 'role', 'profile_role',]
        read_only_fields = ['id', 'profile_role']

    def get_profile_role(self, obj):
        try:
            return obj.profile.role
        except Profile.DoesNotExist:
            return None

    def create(self, validated_data):
        role = validated_data.pop('role', 'student')
        raw_password = validated_data.pop('password', None)
        user = User(**validated_data)
        if raw_password:
            user.set_password(raw_password)
        else:
            user.set_password(User.objects.make_random_password())
        user.save()
        Profile.objects.update_or_create(user=user, defaults={'role': role})
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop('role', None)
        raw_password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if raw_password is not None and raw_password != '':
            instance.set_password(raw_password)
        instance.save()
        if role:
            Profile.objects.update_or_create(user=instance, defaults={'role': role})
        return instance
