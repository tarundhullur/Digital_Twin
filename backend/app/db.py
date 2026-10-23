"""
GlucoTwin Database Module
SQLite connection, schema initialization, and demo seeding.
"""

import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager

# Ensure data directory exists
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "glucotwin.db"


def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


@contextmanager
def get_db():
    """Context manager for database operations."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initializes tables in the SQLite database if they do not exist."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'doctor',
                created_at TEXT DEFAULT (datetime('now'))
            );
        """)

        # Patients table (Static EHR)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                sex TEXT NOT NULL,
                bmi REAL NOT NULL,
                hba1c REAL NOT NULL,
                diagnosis_years REAL NOT NULL,
                family_history_flag INTEGER NOT NULL DEFAULT 0,
                genetic_marker TEXT NOT NULL DEFAULT 'Negative',
                medications TEXT NOT NULL DEFAULT 'None',
                created_at TEXT DEFAULT (datetime('now'))
            );
        """)

        # Readings table (Dynamic Wearable Time-Series)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                glucose REAL NOT NULL,
                heart_rate REAL NOT NULL,
                hrv REAL NOT NULL,
                sleep_stage TEXT NOT NULL,
                steps INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            );
        """)

        # Indexes for fast querying
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_readings_patient_time
            ON readings(patient_id, timestamp);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_email
            ON users(email);
        """)


def seed_demo_doctor():
    """Seeds the initial demo doctor account if it doesn't exist."""
    from app.auth import get_password_hash

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", ("doctor@demo.com",))
        existing = cursor.fetchone()
        if not existing:
            hashed_pw = get_password_hash("Demo@1234")
            cursor.execute(
                """
                INSERT INTO users (name, email, password_hash, role)
                VALUES (?, ?, ?, ?)
                """,
                ("Dr. Sarah Chen, MD", "doctor@demo.com", hashed_pw, "doctor"),
            )
            print("[INFO] Seeded demo doctor: doctor@demo.com / Demo@1234")
