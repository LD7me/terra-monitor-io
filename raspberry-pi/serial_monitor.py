import serial
import serial.tools.list_ports
import json
import time


def find_arduino():
    ports = serial.tools.list_ports.comports()

    for port in ports:
        print(port.device, "|", port.description)

        if (
            port.device.startswith("/dev/ttyACM")
            or port.device.startswith("/dev/ttyUSB")
        ):
            return port.device

    raise Exception("Arduino not found")


class ArduinoSensor:
    def __init__(self, port=None, baud=115200):
        if port is None:
            port = find_arduino()

        print(f"[serial] Using port: {port} @ {baud}")

        self.ser = serial.Serial(port, baud, timeout=1)

        # Arduino resets when serial opens
        time.sleep(2)

        # Clear startup garbage
        self.ser.reset_input_buffer()

    def read(self):
        """Return one parsed JSON reading or None."""

        try:
            raw = self.ser.readline()

            if not raw:
                return None

            line = raw.decode("utf-8", errors="ignore").strip()

            # Debug output
            print("[raw]", repr(line))

            # Ignore non-JSON lines
            if not line.startswith("{") or not line.endswith("}"):
                return None

            data = json.loads(line)
            return data

        except json.JSONDecodeError as e:
            print(f"[serial] JSON error: {e}")
            print(f"[serial] bad line: {repr(line)}")
            return None

        except Exception as e:
            print(f"[serial] read error: {e}")
            return None

    def close(self):
        try:
            self.ser.close()
        except Exception:
            pass