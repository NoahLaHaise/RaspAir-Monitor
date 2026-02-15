import time
from SqlLiteEngine import SensorDB
from sensirion_i2c_driver import LinuxI2cTransceiver, I2cConnection, CrcCalculator
from sensirion_driver_adapters.i2c_adapter.i2c_channel import I2cChannel
from sensirion_i2c_sen66.device import Sen66Device

I2C_PORT = '/dev/i2c-1'

db = SensorDB()

#The physical hardware interface
with LinuxI2cTransceiver(I2C_PORT) as i2c_transceiver:
    
    channel = I2cChannel(
        I2cConnection(i2c_transceiver),
        slave_address=0x6B,
        crc=CrcCalculator(8, 0x31, 0xff, 0x0)
    )

    sensor = Sen66Device(channel)

    try:

        print("Resetting device...")
        sensor.device_reset()
        time.sleep(1.2) 

        serial_number = sensor.get_serial_number()
        print(f"Device Connected! Serial Number: {serial_number}")

        print("Starting continuous measurement...")
        sensor.start_continuous_measurement()

        time.sleep(1.1)

        while True:
            try:
                (pm1, pm25, pm4, pm10, hum, temp, voc, nox, co2) = sensor.read_measured_values()
                
                # print("-" * 30)
                # print(f"PM2.5: {pm25.value} µg/m³")
                # print(f"CO2:   {co2.value} ppm")
                # print(f"VOC:   {voc.value}")
                # print(f"NOx:   {nox.value}")
                # print(f"Temp:  {temp.value} °C")
                # print(f"Hum:   {hum.value} %")
                db.insert_measurement(pm1.value, pm25.value, pm4.value, pm10.value, co2.value, voc.value, nox.value, temp.value, hum.value)         
                time.sleep(60)

            except Exception as e:
                print(f"Error reading data: {e}")
                print("Resetting device status...")
                # sensor.device_reset()
                # time.sleep(1.2)
                # sensor.start_continuous_measurement()
                time.sleep(1.1)
                continue


    except KeyboardInterrupt:
        print("\nStopping measurement...")
        sensor.stop_measurement()