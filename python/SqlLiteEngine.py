import sqlite3
from datetime import date, datetime
import config
from statistics import mean, stdev

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

    def select_measurements(self, hours_back=1) -> list[sqlite3.Row] | None:
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute('''SELECT * FROM air_quality WHERE timestamp >= datetime('now', '-%d hour', 'localtime') ORDER BY timestamp ASC''' % hours_back)
            rows = cursor.fetchall()
            return rows
        except Exception as e:
            print(f"Error selecting last hour measurements: {e}")
            return []
        finally:
            conn.close()

    def calc_mean_and_stddev(self, hours_back = 24) -> dict:
        stats = {}

        rows = self.select_measurements(hours_back)

        for col in rows[0].keys():
            if col == 'id' or col == 'timestamp':
                continue    
            avg = mean(r[col] for r in rows)
            stats[col +'_mean'] = avg
            stats[col +'_stdev'] = stdev([r[col] for r in rows], avg)

        return stats

            

