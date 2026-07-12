from django.apps import AppConfig
import os


class SimulatorConfig(AppConfig):
    name = 'simulator'
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):

        if os.environ.get("RUN_MAIN") != "true":
            return

        from .scheduler import scheduler

        if not scheduler.running:
            scheduler.start()