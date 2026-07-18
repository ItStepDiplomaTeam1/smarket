import pytest
from pydantic import ValidationError

from app.schemas import ZephyrosResponse, TableBlock

def test_schema_invalid_block_type_rejected():
    # Attempting to load an invalid block type should raise ValidationError
    invalid_data = {
        "blocks": [
            {"type": "text", "content": "Valid text block"},
            {"type": "invalid_type", "data": "Some data"}
        ]
    }
    
    with pytest.raises(ValidationError):
        ZephyrosResponse.model_validate(invalid_data)

def test_table_block_highlights_row():
    # Test setting highlight_row to cheapest offer index
    columns = ["Назва", "Магазин", "Ціна", "Наявність"]
    rows = [
        ["Молоко", "Сільпо", 45.50, True],
        ["Молоко", "Новус", 35.00, True], # Cheapest row is at index 1
        ["Молоко", "Метро", 40.00, True]
    ]
    
    # Calculate cheapest index
    prices = [row[2] for row in rows]
    cheapest_index = prices.index(min(prices))
    assert cheapest_index == 1
    
    table = TableBlock(
        title="Порівняння цін",
        columns=columns,
        rows=rows,
        highlight_row=cheapest_index
    )
    
    assert table.highlight_row == 1
    
    # Verify we can validate this in ZephyrosResponse
    response = ZephyrosResponse(blocks=[table])
    assert response.blocks[0].highlight_row == 1
