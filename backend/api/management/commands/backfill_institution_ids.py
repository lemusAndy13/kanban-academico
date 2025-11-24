from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Profile


class Command(BaseCommand):
    help = "Genera IDs institucionales para todos los perfiles que aún no tienen (ALU-xxxxxx / DOC-xxxxxx)."

    def handle(self, *args, **options):
        created = 0
        updated = 0

        # Asegurar que todos los usuarios tengan Profile
        for user in User.objects.all():
            profile, was_created = Profile.objects.get_or_create(user=user)
            if was_created:
                created += 1

        # Asignar institution_id faltante
        for profile in Profile.objects.filter(institution_id__isnull=True):
            prefix = "ALU" if profile.role == "student" else "DOC"
            seq = Profile.objects.filter(role=profile.role, institution_id__startswith=prefix).count() + 1
            profile.institution_id = f"{prefix}-{seq:06d}"
            profile.save(update_fields=["institution_id"])
            updated += 1

        self.stdout.write(self.style.SUCCESS(f"Perfiles creados: {created} | IDs asignados: {updated}"))


