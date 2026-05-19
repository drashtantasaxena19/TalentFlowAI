import os
from dotenv import load_dotenv

load_dotenv()

def get_proxy_settings():
    """Returns a simple dict for Playwright proxy settings."""
    server = os.getenv("PROXY_SERVER")
    user = os.getenv("PROXY_USER")
    password = os.getenv("PROXY_PASS")

    if server and user and password:
        return {
            "server": server,
            "username": user,
            "password": password
        }
    return None

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"