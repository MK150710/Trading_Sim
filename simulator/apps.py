from django.apps import AppConfig


class SimulatorConfig(AppConfig):
    name = "simulator"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        print(" SIMULATOR READY() CALLED", flush=True)

        from .scheduler import scheduler

        print(" SCHEDULER IMPORTED", flush=True)
        print(f" SCHEDULER RUNNING: {scheduler.running}", flush=True)

        if not scheduler.running:
            scheduler.start()
            print(" SCHEDULER STARTED", flush=True)