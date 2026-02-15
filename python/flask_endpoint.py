from flask import Flask, jsonify, send_from_directory
from SqlLiteEngine import SensorDB
import config

WEBPAGE_DIR = config.SCRIPT_DIR.parent / "Webpage"

app = Flask(__name__, static_folder=str(WEBPAGE_DIR), static_url_path='')

@app.route('/')
def index():
    return send_from_directory(str(WEBPAGE_DIR), 'index.html')

@app.route('/air_data')
def get_air_data():
    db = SensorDB()
    row = db.select_latest_measurement()
    if row is None:
        return jsonify(None)
    return jsonify(dict(row))

@app.route('/air_history')
def get_air_history():
    db = SensorDB()
    rows = db.select_last_hour_measurements()
    if not rows:
        return jsonify([])
    return jsonify([dict(r) for r in rows])

@app.route('/day_air_history')
def get_day_air_history():
    db = SensorDB()
    rows = db.select_today_measurements()
    if not rows:
        return jsonify([])
    return jsonify([dict(r) for r in rows])
