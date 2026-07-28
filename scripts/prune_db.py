import os
import asyncio
import asyncpg
import time

def get_db_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, "services", "product_service", ".env")
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    val = line.strip().split("DATABASE_URL=")[1]
                    return val.replace("postgresql+asyncpg://", "postgresql://")
    return os.environ.get("DATABASE_URL")

async def main():
    db_url = get_db_url()
    if not db_url:
        print("DATABASE_URL not found!")
        return

    print("Connecting to database...")
    conn = await asyncpg.connect(db_url)
    try:
        total_before = await conn.fetchval("SELECT COUNT(*) FROM prices")
        print(f"Total rows in 'prices' before deduplication: {total_before:,}")

        print("Fetching distinct product IDs...")
        rows = await conn.fetch("SELECT DISTINCT product_id FROM prices ORDER BY product_id")
        product_ids = [r['product_id'] for r in rows]
        total_products = len(product_ids)
        print(f"Found {total_products:,} distinct products in 'prices' table.")

        if total_products == 0:
            print("No prices found in the database.")
            return

        batch_size = 1000
        total_deleted = 0
        
        start_time = time.time()
        for i in range(0, total_products, batch_size):
            batch = product_ids[i:i + batch_size]
            
            query = """
                DELETE FROM prices
                WHERE product_id = ANY($1::bigint[])
                  AND id IN (
                      SELECT id FROM (
                          SELECT id,
                                 price, old_price, in_stock,
                                 LAG(price) OVER (PARTITION BY product_id, store_id ORDER BY recorded_at ASC) as prev_price,
                                 LAG(old_price) OVER (PARTITION BY product_id, store_id ORDER BY recorded_at ASC) as prev_old_price,
                                 LAG(in_stock) OVER (PARTITION BY product_id, store_id ORDER BY recorded_at ASC) as prev_in_stock
                          FROM prices
                          WHERE product_id = ANY($1::bigint[])
                      ) t
                      WHERE t.price = t.prev_price
                        AND (t.old_price IS NOT DISTINCT FROM t.prev_old_price)
                        AND t.in_stock = t.prev_in_stock
                  )
            """
            
            status = await conn.execute(query, batch)
            deleted = 0
            if status.startswith("DELETE "):
                deleted = int(status.split(" ")[1])
            
            total_deleted += deleted
            elapsed = time.time() - start_time
            print(f"Processed products {i+1} to {min(i+batch_size, total_products)} of {total_products} | Deleted: {deleted:,} rows | Total deleted: {total_deleted:,} | Elapsed: {elapsed:.1f}s")
                
            await asyncio.sleep(0.01)

        total_after = await conn.fetchval("SELECT COUNT(*) FROM prices")
        print("\nDeduplication complete.")
        print(f"Total deleted rows: {total_deleted:,}")
        print(f"Total rows in 'prices' after: {total_after:,}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
