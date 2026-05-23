"""
Run this script from inside the backend/ folder to make all users admin.
Usage: python make_admin.py
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'anomaly_detection.db')

if not os.path.exists(db_path):
    print("ERROR: anomaly_detection.db not found.")
    print("Make sure the backend has been started at least once first.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET is_admin=1')
    conn.commit()
    count = cursor.rowcount
    conn.close()
    print(f"Done! {count} user(s) updated to admin.")
    print("Log out and log back in on the frontend to see the Admin page.")
