import requests
import os
from dotenv import load_dotenv

load_dotenv()

class TelegramMessenger:
    message: str
    endpoint: str

    def __init__(self, msg: str):
        self.message = msg
        self.endpoint = os.getenv("TELEGRAM_ENDPOINT")

    
    def send_message(self):
        url = self.endpoint + self.message
        requests.post(url)

tele = TelegramMessenger('HEYYYYYYYYYY')
tele.send_message()