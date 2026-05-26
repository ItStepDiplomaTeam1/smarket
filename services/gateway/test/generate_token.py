import jwt
from datetime import datetime, timedelta, timezone

# Цей ключ МАЄ повністю збігатися з JWT_SECRET_KEY у нашому app/core/config.py
SECRET_KEY = "secret"
ALGORITHM = "HS256"

# Payload — це корисні дані, які ми зашиваємо всередину токена
payload = {
    "sub": "user_777_diploma",  # Ідентифікатор користувача (Subject)
    "role": "admin",            # Можемо передавати будь-які кастомні дані
    "exp": datetime.now(timezone.utc) + timedelta(hours=1)  # Час життя: 1 година
}

# Генеруємо сам токен
token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

print("Твій тестовий JWT токен:\n")
print(token)