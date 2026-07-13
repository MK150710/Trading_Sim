from apscheduler.schedulers.background import BackgroundScheduler
from .tasks import update_stocks

scheduler = BackgroundScheduler()

scheduler.add_job(
    update_stocks, 
    trigger="interval",
    minutes=5,
    id="update_stocks",
    replace_existing=True
)