import sqlite3
import os

db_path = 'services/product_service/app/database/product.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, image_url FROM products LIMIT 5')
    for row in cursor.fetchall():
        print(row)
    conn.close()
else:
    print("DB not found at", db_path)
