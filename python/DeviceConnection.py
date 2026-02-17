import time
from SqlLiteEngine import SensorDB
from sensirion_i2c_driver import LinuxI2cTransceiver, I2cConnection, CrcCalculator
from sensirion_driver_adapters.i2c_adapter.i2c_channel import I2cChannel
from sensirion_i2c_sen66.device import Sen66Device
import sys
import config
import json
import os

STATE_FILE = config.JSON_PATH

def save_voc_state(voc_state) -> None:
    with open(STATE_FILE, 'w') as f:
        json.dump(list(voc_state), f)

def load_voc_state() -> any:
    with open(STATE_FILE, 'r') as f:
        return tuple(json.load(f))

reset_device = False
if len(sys.argv) > 1 and sys.argv[1] == "1":
    reset_device = True

I2C_PORT = '/dev/i2c-1'
db = SensorDB()

file_age = 0
if os.path.exists(STATE_FILE):
    file_age = time.time() - os.path.getmtime(STATE_FILE)

#The physical hardware interface
with LinuxI2cTransceiver(I2C_PORT) as i2c_transceiver:

    channel = I2cChannel(
        I2cConnection(i2c_transceiver),
        slave_address=0x6B,
        crc=CrcCalculator(8, 0x31, 0xff, 0x0)
    )

    sensor = Sen66Device(channel)
    try:
        if not reset_device and file_age < 600 and file_age > 0:
            print('attempting VOC state restore')
            sensor.set_voc_algorithm_state(load_voc_state())
        elif reset_device or file_age > 600:
            print("Resetting device...")
            sensor.device_reset()
            time.sleep(1.2)
        else:
            print('skipping reset or voc load, should be on device cache')

        serial_number = sensor.get_serial_number()
        print(f"Device Connected! Serial Number: {serial_number}")

        print("Starting continuous measurement...")
        sensor.start_continuous_measurement()

        time.sleep(1.1)

        i = 1
        while True:
            try:
                (pm1, pm25, pm4, pm10, hum, temp, voc, nox, co2) = sensor.read_measured_values()

                if i == 10:
                    save_voc_state(sensor.get_voc_algorithm_state())
                    print('saving state')
                    i = 0
                
                db.insert_measurement(pm1.value, pm25.value, pm4.value, pm10.value, co2.value, voc.value, nox.value, temp.value, hum.value)
                i += 1
                time.sleep(60)

            except Exception as e:
                print(f"Error reading data: {e}")
                print("Resetting device status...")
                time.sleep(1.1)
                continue

    except KeyboardInterrupt:
        print("\nStopping measurement...")
        sensor.stop_measurement()