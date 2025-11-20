from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import Profile, Board, List, Card


class Command(BaseCommand):
    help = "Crea usuarios demo (teacher1, student1) y datos de ejemplo"

    def handle(self, *args, **options):
        teacher_username = "teacher1"
        teacher_password = "Teacher123!"
        student_username = "student1"
        student_password = "Student123!"
        admin_username = "admin1"
        admin_password = "Admin123!"

        # Crear o actualizar usuarios
        teacher, _ = User.objects.get_or_create(username=teacher_username, defaults={"email": ""})
        teacher.is_active = True
        teacher.set_password(teacher_password)  # siempre forzamos el password demo
        teacher.save()
        Profile.objects.update_or_create(user=teacher, defaults={"role": "teacher"})

        student, _ = User.objects.get_or_create(username=student_username, defaults={"email": ""})
        student.is_active = True
        student.set_password(student_password)  # siempre forzamos el password demo
        student.save()
        Profile.objects.update_or_create(user=student, defaults={"role": "student"})

        # Admin (staff + superuser) con rol teacher para permitir login por endpoint de catedrático
        admin, _ = User.objects.get_or_create(username=admin_username, defaults={"email": ""})
        admin.is_active = True
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password(admin_password)
        admin.save()
        Profile.objects.update_or_create(user=admin, defaults={"role": "teacher"})

        # Crear board demo
        board, _ = Board.objects.get_or_create(name="Curso Demo", owner=teacher, defaults={"color": "#e6f0ff"})
        board.members.add(teacher)
        board.members.add(student)
        board.members.add(admin)

        # Listas
        todo_list, _ = List.objects.get_or_create(board=board, title="Pendientes", defaults={"position": 1})
        doing_list, _ = List.objects.get_or_create(board=board, title="En curso", defaults={"position": 2})
        done_list, _ = List.objects.get_or_create(board=board, title="Hecho", defaults={"position": 3})

        # Cards con fechas
        now = timezone.now()
        Card.objects.get_or_create(
            list=todo_list,
            title="Leer guía del curso",
            defaults={
                "description": "Revisar el programa y fechas clave.",
                "due_date": now + timezone.timedelta(days=2),
                "priority": "low",
                "position": 1,
                "created_by": teacher,
            },
        )[0].assignees.add(student)

        Card.objects.get_or_create(
            list=doing_list,
            title="Actividad 1",
            defaults={
                "description": "Resolver ejercicios iniciales.",
                "due_date": now + timezone.timedelta(days=4),
                "priority": "medium",
                "position": 1,
                "created_by": teacher,
            },
        )[0].assignees.add(student)

        Card.objects.get_or_create(
            list=done_list,
            title="Setup del entorno",
            defaults={
                "description": "Instalación y verificación.",
                "due_date": now - timezone.timedelta(days=1),
                "priority": "low",
                "position": 1,
                "created_by": teacher,
            },
        )[0].assignees.add(student)

        self.stdout.write(self.style.SUCCESS("Usuarios demo creados:"))
        self.stdout.write(f"  - Catedrático: {teacher_username} / {teacher_password}")
        self.stdout.write(f"  - Estudiante:  {student_username} / {student_password}")
        self.stdout.write(f"  - Administrador: {admin_username} / {admin_password} (is_staff, superuser)")
        self.stdout.write(self.style.SUCCESS("Datos demo poblados (Curso Demo, listas y tarjetas)."))


