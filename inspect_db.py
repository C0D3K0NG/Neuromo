
import sqlite3
import os

DB_NAME = 'neuromo.db'

def inspect_db():
    if not os.path.exists(DB_NAME):
        print(f"❌ Database {DB_NAME} not found!")
        return

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    print("--- SESSIONS ---")
    try:
        c.execute("SELECT * FROM sessions")
        sessions = c.fetchall()
        if not sessions:
            print("No sessions found.")
        else:
            for s in sessions:
                print(s)
    except Exception as e:
        print(f"Error reading sessions: {e}")

    print("\n--- EVENTS (Distractions/Sleep) ---")
    try:
        c.execute("SELECT * FROM events")
        events = c.fetchall()
        if not events:
            print("No events found.")
        else:
            for e in events:
                print(e)
    except Exception as e:
        print(f"Error reading events: {e}")

    conn.close()

if __name__ == "__main__":
    inspect_db()
