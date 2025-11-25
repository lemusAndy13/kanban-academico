from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Board, List, Card, Comment, Label, ChecklistItem, Attachment, Activity
from .models import Announcement
from django.db.models import Q

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username','email']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Profile
        fields = ['user','role','institution_id']

class BoardSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = UserSerializer(read_only=True, many=True)
    class Meta:
        model = Board
        fields = ['id','code','name','owner','members','color','created_at']
        read_only_fields = ['code']

class ListSerializer(serializers.ModelSerializer):
    class Meta:
        model = List
        fields = ['id','board','title','position']

class CardSerializer(serializers.ModelSerializer):
    labels = serializers.PrimaryKeyRelatedField(queryset=Label.objects.all(), many=True, required=False)
    board = serializers.SerializerMethodField(read_only=True)
    created_by = UserSerializer(read_only=True)
    class Meta:
        model = Card
        fields = ['id','list','board','title','description','due_date','priority','max_points','position','created_by','assignees','labels']
        read_only_fields = ['created_by','position']

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
    file_url = serializers.SerializerMethodField(read_only=True)
    uploader = UserSerializer(source='uploaded_by', read_only=True)
    class Meta:
        model = Attachment
        fields = ['id','card','url','file','file_url','name','created_at','uploader','is_submission','score','feedback','graded_by','graded_at']
        read_only_fields = ['uploader','graded_by','graded_at','is_submission']

    def get_file_url(self, obj):
        try:
            req = self.context.get("request")
            if obj.file and hasattr(obj.file, "url"):
                return req.build_absolute_uri(obj.file.url) if req else obj.file.url
        except Exception:
            pass
        return None

class ActivitySerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    class Meta:
        model = Activity
        fields = ['id','card','board','actor','action','meta','created_at']

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    class Meta:
        model = Announcement
        fields = ['id','board','title','content','is_pinned','created_by','created_at']


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=[('student', 'student'), ('teacher', 'teacher')], write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    profile_role = serializers.SerializerMethodField(read_only=True)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    name = serializers.SerializerMethodField(read_only=True)
    institution_id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'password', 'role', 'profile_role', 'full_name', 'name', 'institution_id']
        read_only_fields = ['id', 'profile_role', 'name', 'institution_id']

    def get_profile_role(self, obj):
        try:
            return obj.profile.role
        except Profile.DoesNotExist:
            return None

    def create(self, validated_data):
        role = validated_data.pop('role', 'student')
        raw_password = validated_data.pop('password', None)
        full_name = validated_data.pop('full_name', '')
        # Si no viene username, usar el email como username
        if validated_data.get('email'):
            validated_data['email'] = validated_data['email'].strip().lower()
        if not validated_data.get('username') and validated_data.get('email'):
            validated_data['username'] = validated_data['email']
        user = User(**validated_data)
        if full_name:
            user.first_name = full_name  # guardar nombre completo en first_name
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
        full_name = validated_data.pop('full_name', None)
        if validated_data.get('email'):
            validated_data['email'] = validated_data['email'].strip().lower()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if raw_password is not None and raw_password != '':
            instance.set_password(raw_password)
        if full_name is not None:
            instance.first_name = full_name
        instance.save()
        if role:
            Profile.objects.update_or_create(user=instance, defaults={'role': role})
        return instance

    def get_name(self, obj):
        return obj.first_name or obj.username
    
    def get_institution_id(self, obj):
        try:
            return obj.profile.institution_id
        except Profile.DoesNotExist:
            return None

    def validate(self, attrs):
        email = attrs.get('email')
        if email:
            email_norm = email.strip().lower()
            qs = User.objects.filter(email__iexact=email_norm)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({'email': 'Este correo ya está registrado.'})
        return super().validate(attrs)
