
import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

server = os.getenv("DB_SERVER")
database = os.getenv("DB_NAME")
driver = os.getenv("DB_DRIVER")

connection_string = (
    f"DRIVER={{{driver}}};"
    f"SERVER={server};"
    f"DATABASE={database};"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

try:
    with pyodbc.connect(connection_string, timeout=5) as connection:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                DB_NAME() AS database_name,
                COUNT(*) AS table_count
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
        """)

        row = cursor.fetchone()

        print("SQL Server bağlantısı başarılı!")
        print(f"Veritabanı: {row.database_name}")
        print(f"Tablo sayısı: {row.table_count}")

except pyodbc.Error as error:
    print("SQL Server bağlantısı kurulamadı.")
    print(error)

