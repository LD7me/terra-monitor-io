"""
Serial reader for the Arduino sensor module.
Reads JSON lines emitted by sensor_module.ino:
  {"lux":..,"ppfd":..,"temp":..,"soil":..,"dli":..,"is_day":..}
"""
import serial
import serial.tools.list_ports
import json


def find_arduino():
    """Auto-detect the Arduino USB serial port."""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        desc = (port.description or "").lower()
        if "arduino" in desc or "usb serial" in desc or "ch340" in desc or "ttyusb" in desc or "ttyacm" in desc:
            return port.device
    raise Exception("Arduino not found on any USB serial port")


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
