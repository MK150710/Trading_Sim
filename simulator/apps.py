from django.apps import AppConfig
class SimulatorConfig(AppConfig):
    name = "simulator"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        from .scheduler import scheduler

        if not scheduler.running:
            scheduler.start()