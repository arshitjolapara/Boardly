import socket
import os

def check_postgres(host="localhost", port=5432):
    try:
        sock = socket.create_connection((host, port), timeout=2)
        print(f"Success: Connected to {host}:{port}")
        return True
    except Exception as e:
        print(f"Failure: Could not connect to {host}:{port} - {e}")
        return False

if __name__ == "__main__":
    check_postgres()
