import requests
import os
from dotenv import load_dotenv

load_dotenv()

class TelegramMessenger:
    message: str
    endpoint: str
    chat_id: int

    def __init__(self):
        self.endpoint = os.getenv("TELEGRAM_ENDPOINT")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")

    
    def send_message(self, msg: str):
        #print(self.endpoint)
        url = f'{self.endpoint}/sendMessage?chat_id={self.chat_id}&text={msg}'
        requests.post(url)

    def get_messages(self):
        url = f'{self.endpoint}/getUpdates'
        response = requests.get(url)
        print(response.text)


tele = TelegramMessenger()
tele.send_message('test')
tele.get_messages()