from yahooquery import Screener

screener = Screener()

def get_screening(screening_type, count=5):
    return screener.get_screeners(screening_type, count=count)[screening_type]["quotes"]