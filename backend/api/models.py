from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Profile(models.Model):
    ROLE_CHOICES = (('student','student'), ('teacher','teacher'))
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Board(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_boards')
    members = models.ManyToManyField(User, related_name='boards', blank=True)
    color = models.CharField(max_length=7, default="#ffffff")
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

class List(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='lists')
    title = models.CharField(max_length=200)
    position = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.title} ({self.board.name})"

class Card(models.Model):
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='cards')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, default='low')
    position = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_cards')
    assignees = models.ManyToManyField(User, related_name='assigned_cards', blank=True)

    def __str__(self):
        return self.title

class Comment(models.Model):
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
