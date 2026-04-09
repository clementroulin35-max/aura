"""
GSS Orion V3 — Sentinel Utilities.
is_orion_alive() liveness probe + shared constants.
"""

import socket


def is_orion_alive(host: str = "127.0.0.1", port: int = 21230, timeout: float = 2.0) -> bool:
    """Check if the Orion Watchdog is alive by probing its Pulse port."""
    for _ in range(2):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(timeout)
                s.connect((host, port))
                data = s.recv(64)
                if b"PULSE_OK" in data:
                    return True
        except (TimeoutError, ConnectionRefusedError, OSError):
            pass
    return False
