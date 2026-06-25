import sys

with open('app/routers/cart.py', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''            name = product_data.get("title", "Невідомий товар")
            item_price = price * item.quantity
            total_price += item_price

            items_response.append(
                {
                    "id": item.id,
                    "cart_id": item.cart_id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "product_name": name,
                    "price": price,
                }
            )'''

replacement1 = '''            name = product_data.get("title", "Невідомий товар")
            image_url = product_data.get("image_url")
            item_price = price * item.quantity
            total_price += item_price

            items_response.append(
                {
                    "id": item.id,
                    "cart_id": item.cart_id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "product_name": name,
                    "price": price,
                    "image_url": image_url,
                }
            )'''

content = content.replace(target1, replacement1)

target2 = '''        item_price = price * item.quantity
        total_price += item_price

        cart_response["items"].append(
            {
                "id": item.id,
                "cart_id": item.cart_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "product_name": name,
                "price": price,
            }
        )'''

replacement2 = '''        image_url = product_data.get("image_url")
        item_price = price * item.quantity
        total_price += item_price

        cart_response["items"].append(
            {
                "id": item.id,
                "cart_id": item.cart_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "product_name": name,
                "price": price,
                "image_url": image_url,
            }
        )'''

content = content.replace(target2, replacement2)

with open('app/routers/cart.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced!")
