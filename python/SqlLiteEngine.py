import sqlite3
from datetime import date, datetime
import config

class SensorDB:
    DB_PATH = config.DB_PATH

    def __init__(self):
        conn = sqlite3.connect(self.DB_PATH)
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
        conn = sqlite3.connect(self.DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    
    def insert_measurement(self, pm1, pm25, pm4, pm10, co2, voc, nox, temp, humidity) -> None:
        try:
            conn = self.get_connection()
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

    def select_measurements(self, limit=100) -> list[sqlite3.Row] | None:
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

    def select_latest_measurement(self) -> sqlite3.Row | None:
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute('''SELECT * FROM air_quality ORDER BY timestamp DESC LIMIT 1''')
            row = cursor.fetchone()
            return row
        except Exception as e:
            print(f"Error selecting latest measurement: {e}")
            return None
        finally:
            conn.close()
    
    def select_today_measurements(self) -> list[sqlite3.Row] | None:
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute('''SELECT * FROM air_quality WHERE timestamp >= datetime('now', '-24 hour', 'localtime') ORDER BY timestamp ASC''')
            rows = cursor.fetchall()
            return rows
        except Exception as e:
            print(f"Error selecting day measurements: {e}")
            return []
        finally:
            conn.close()

    def select_last_hour_measurements(self) -> list[sqlite3.Row] | None:
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute('''SELECT * FROM air_quality WHERE timestamp >= datetime('now', '-1 hour', 'localtime') ORDER BY timestamp ASC''')
            rows = cursor.fetchall()
            return rows
        except Exception as e:
            print(f"Error selecting last hour measurements: {e}")
            return []
        finally:
            conn.close()
        
