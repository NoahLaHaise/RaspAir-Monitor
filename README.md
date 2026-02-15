# RaspAir Monitor

Air quality monitoring dashboard for Raspberry Pi Zero 2W using a Sensirion SEN66 sensor.

## Prerequisites

- Python 3.10+
- Flask (`pip install flask`)

## Running the Flask Server (Recommended)

Serves both the API endpoints and the web dashboard from a single server.

```bash
cd python
flask --app flask_endpoint run --host=0.0.0.0
```

Navigate to `http://<pi-ip>:5000/` to view the dashboard.

### API Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Web dashboard |
| `GET /air_data` | Latest sensor reading as JSON |
| `GET /air_history` | Last hour of readings as JSON array |

## Running with Python HTTP Server (Static Only)

If you only need to serve the HTML dashboard without the API (e.g. for layout testing), you can use Python's built-in HTTP server:

```bash
cd Webpage
python -m http.server 8000
```

Navigate to `http://<pi-ip>:8000/`. Note that the charts and live data will not load since the API endpoints are not available.

## Running the Sensor

To start collecting data from the SEN66 sensor:

```bash
cd python
python DeviceConnection.py
```
