import sqlite3
from datetime import datetime

class SensorDB:

    def __init__(self):
        conn = sqlite3.connect('air.db')
        try:
            conn.execute('PRAGMA journal_mode=WAL')
            conn.execute('''CREATE TABLE IF NOT EXISTS air_quality 
                            (id INTEGER PRIMARY KEY, timestamp TEXT, PM1 REAL, PM25 REAL, PM4 REAL, PM10 REAL, CO2 REAL, VOC REAL, NOx REAL, Temp REAL, Humidity REAL)''')
            conn.commit()
        except Exception as e:
            print(f"Error creating table: {e}")
        finally:
            conn.close()

    def get_connection(self) -> sqlite3.Connection:
        return sqlite3.connect('air.db')
    
    def insert_measurement(self, pm1, pm25, pm4, pm10, co2, voc, nox, temp, humidity):
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute('''INSERT INTO air_quality (timestamp, PM1, PM25, PM4, PM10, CO2, VOC, NOx, Temp, Humidity) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', 
                            (timestamp, pm1, pm25, pm4, pm10, co2, voc, nox, temp, humidity))
            conn.commit()
        except Exception as e:
            print(f"Error inserting measurement: {e}")
        finally:
            conn.close()

    def select_measurements(self, limit=100) -> list[any]:
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute('''SELECT * FROM air_quality ORDER BY timestamp DESC LIMIT ?''', (limit,))
            rows = cursor.fetchall()
            return rows
        except Exception as e:
            print(f"Error selecting measurements: {e}")
            return []
        finally:
            conn.close()

        
