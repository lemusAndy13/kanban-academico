from django.core.management.base import BaseCommand
from api.models import Board


class Command(BaseCommand):
    help = "Genera y asigna 'code' para todos los cursos (Board) que no lo tengan."

    def handle(self, *args, **options):
        updated = 0
        for board in Board.objects.filter(code__isnull=True):
            orig = board.code
            board.save()  # dispara pre_save ensure_board_code
            if board.code and board.code != orig:
                updated += 1
                self.stdout.write(f"- {board.name}: {board.code}")
        self.stdout.write(self.style.SUCCESS(f"Códigos actualizados: {updated}"))

