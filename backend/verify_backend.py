import requests
import sys
import time

BASE_URL = "http://localhost:8000"
API_V1 = "/api/v1"

def test_health():
    try:
        resp = requests.get(f"{BASE_URL}/")
        if resp.status_code == 200:
            print("✅ Backend Health Check Passed")
            return True
    except Exception as e:
        print(f"❌ Backend Health Check Failed: {e}")
    return False

def test_user_flow():
    email = f"test_{int(time.time())}@example.com"
    password = "password123"
    
    # 1. Create User
    payload = {
        "email": email,
        "password": password,
        "full_name": "Test User"
    }
    resp = requests.post(f"{BASE_URL}{API_V1}/users/", json=payload)
    if resp.status_code != 200:
        print(f"❌ Create User Failed: {resp.text}")
        return False
    print(f"✅ User Created: {email}")

    # 2. Login
    login_data = {
        "username": email,
        "password": password
    }
    resp = requests.post(f"{BASE_URL}{API_V1}/login/access-token", data=login_data)
    if resp.status_code != 200:
        print(f"❌ Login Failed: {resp.text}")
        return False
    token = resp.json()["access_token"]
    print("✅ Login Successful. Token received.")

    # 3. Get Me
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}{API_V1}/users/me", headers=headers)
    if resp.status_code != 200:
        print(f"❌ Get Me Failed: {resp.text}")
        return False
    print("✅ Get 'Me' Successful. User flow verified.")
    return True

if __name__ == "__main__":
    print("Waiting for server to start...")
    time.sleep(5)
    if test_health():
        test_user_flow()
