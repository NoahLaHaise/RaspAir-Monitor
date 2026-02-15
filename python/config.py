from pathlib import Path
# Gets the directory where the Python script is located
SCRIPT_DIR = Path(__file__).parent.resolve()
DB_PATH = SCRIPT_DIR.parent / "db" / "air.db"