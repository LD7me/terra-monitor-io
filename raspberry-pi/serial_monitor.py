"""
Serial reader for the Arduino sensor module.
Reads JSON lines emitted by sensor_module.ino:
  {"lux":..,"ppfd":..,"temp":..,"soil":..,"dli":..,"is_day":..}
"""
import serial
import serial.tools.list_ports
import json


def find_arduino():
    ports = serial.tools.list_ports.comports()

    for port in ports:
        print(port.device, "|", port.description)  # debug

        if port.device.startswith("/dev/ttyACM") or port.device.startswith("/dev/ttyUSB"):
            return port.device

    raise Exception("Arduino not found")


class ArduinoSensor:
    def __init__(self, port=None, baud=115200):
        if port is None:
            port = find_arduino()
        print(f"[serial] Using port: {port} @ {baud}")
        self.ser = serial.Serial(port, baud, timeout=1)

    def read(self):
        """Return one parsed JSON reading or None."""
        try:
            line = self.ser.readline().decode(errors="ignore").strip()
            if not line or not line.startswith("{"):
                return None
            return json.loads(line)
        except Exception as e:
            print(f"[serial] read error: {e}")
            return None

    def close(self):
        try:
            self.ser.close()
        except Exception:
            pass
