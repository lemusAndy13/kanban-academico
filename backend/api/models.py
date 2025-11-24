from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

class Profile(models.Model):
    ROLE_CHOICES = (('student','student'), ('teacher','teacher'))
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    institution_id = models.CharField(max_length=20, unique=True, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

@receiver(post_save, sender=Profile)
def ensure_institution_id(sender, instance, created, **kwargs):
    """
    Asigna un ID institucional si el perfil no lo tiene aún.
    Formato: ALU-000001 para estudiantes, DOC-000001 para catedráticos.
    """
    if not instance.institution_id:
        prefix = 'ALU' if instance.role == 'student' else 'DOC'
        seq = Profile.objects.filter(role=instance.role, institution_id__startswith=prefix).exclude(pk=instance.pk).count() + 1
        new_id = f"{prefix}-{seq:06d}"
        # Evitar recursión del post_save usando update directo
        Profile.objects.filter(pk=instance.pk).update(institution_id=new_id)
        instance.institution_id = new_id

class Board(models.Model):
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_boards')
    members = models.ManyToManyField(User, related_name='boards', blank=True)
    color = models.CharField(max_length=7, default="#ffffff")
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name


@receiver(pre_save, sender=Board)
def ensure_board_code(sender, instance: "Board", **kwargs):
    if instance.code:
        return
    base = (instance.name or "").upper()
    letters = "".join(ch for ch in base if ch.isalpha())[:3]
    prefix = letters if letters else "CUR"
    seq = Board.objects.filter(code__startswith=f"{prefix}-").exclude(pk=instance.pk).count() + 1
    code = f"{prefix}-{seq:06d}"
    while Board.objects.filter(code=code).exclude(pk=instance.pk).exists():
        seq += 1
        code = f"{prefix}-{seq:06d}"
    instance.code = code

class List(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='lists')
    title = models.CharField(max_length=200)
    position = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.title} ({self.board.name})"

PRIORITY_CHOICES = (
    ('low', 'low'),
    ('med', 'med'),
    ('high', 'high'),
)

class Card(models.Model):
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='cards')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='low')
    position = models.IntegerField(default=0)
    max_points = models.IntegerField(null=True, blank=True, default=100)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_cards')
    assignees = models.ManyToManyField(User, related_name='assigned_cards', blank=True)
    labels = models.ManyToManyField('Label', related_name='cards', blank=True)

    def __str__(self):
        return self.title

class Comment(models.Model):
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

class Label(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='labels', null=True, blank=True)
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#888888")  # #RRGGBB

    def __str__(self):
        return self.name

class ChecklistItem(models.Model):
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='checklist')
    text = models.CharField(max_length=255)
    done = models.BooleanField(default=False)
    position = models.IntegerField(default=0)

    def __str__(self):
        return self.text

class Attachment(models.Model):
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='attachments')
    url = models.URLField(null=True, blank=True)
    file = models.FileField(upload_to='attachments/', null=True, blank=True)
    name = models.CharField(max_length=200, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attachments')
    is_submission = models.BooleanField(default=False)
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_attachments')
    graded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name or self.url

class Activity(models.Model):
    ACTION_CHOICES = (
        ('created', 'created'),
        ('updated', 'updated'),
        ('moved', 'moved'),
        ('commented', 'commented'),
        ('closed', 'closed'),
    )
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)  # legacy
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    message = models.TextField(blank=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        who = self.actor or self.user
        return f"{who} {self.action}"
