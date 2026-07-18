import os
import sys
import subprocess

def main():
    files = sys.argv[1:]
    changed_services = set()
    for f in files:
        # Standardize path separators to forward slashes
        f = f.replace('\\', '/')
        parts = f.split('/')
        if len(parts) >= 2 and parts[0] == 'services':
            changed_services.add(parts[1])
            
    if not changed_services:
        print("No service changes detected.")
        sys.exit(0)
        
    print(f"Detected changes in services: {list(changed_services)}")
    
    failed = False
    for service in sorted(changed_services):
        service_dir = os.path.join('services', service)
        tests_dir = os.path.join(service_dir, 'tests')
        
        # Only run tests if a tests/ directory exists (skips search_service, products_etl etc. if they run separately)
        if os.path.isdir(tests_dir):
            print(f"Running pytest for {service}...")
            env = os.environ.copy()
            env["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost/test"
            env["RABBITMQ_URL"] = "amqp://guest:guest@localhost:5672//"
            env["RESEND_API_KEY"] = "dummy"
            env["PYTHONPATH"] = f"../.."
            
            try:
                # Run uv run pytest inside the service directory
                # Using shell=True for Windows compatibility with uv
                result = subprocess.run(
                    "uv run pytest",
                    cwd=service_dir,
                    env=env,
                    shell=True,
                    capture_output=True,
                    text=True
                )
                if result.returncode != 0:
                    print(f"[FAIL] Tests failed for {service}:")
                    print(result.stdout)
                    print(result.stderr)
                    failed = True
                else:
                    print(f"[OK] Tests passed for {service}!")
            except Exception as e:
                print(f"[ERROR] Failed to run tests for {service}: {e}")
                failed = True

    if failed:
        sys.exit(1)

if __name__ == '__main__':
    main()
