from __future__ import annotations

from typing import Annotated, Any, Literal, Union
from pydantic import BaseModel, Field


class TextBlock(BaseModel):
    type: Literal["text"] = "text"
    content: str


class TableBlock(BaseModel):
    type: Literal["table"] = "table"
    title: str | None = None
    columns: list[str]
    rows: list[list[str | bool | float | None]]
    highlight_row: int | None = None


class ProductCardBlock(BaseModel):
    type: Literal["product_card"] = "product_card"
    product_id: int
    name: str
    store: str
    price: str
    in_stock: bool
    savings: str | None = None


class TabItem(BaseModel):
    label: str
    blocks: list[UIBlock]


class TabsBlock(BaseModel):
    type: Literal["tabs"] = "tabs"
    items: list[TabItem]


class ClarificationBlock(BaseModel):
    type: Literal["clarification"] = "clarification"
    question: str
    options: list[str]


class ActionButtonBlock(BaseModel):
    type: Literal["action_button"] = "action_button"
    label: str
    action: Literal["add_to_cart", "create_review", "navigate", "apply_filters"]
    payload: dict[str, Any]


class BadgeBlock(BaseModel):
    type: Literal["badge"] = "badge"
    variant: Literal["savings", "best_price", "warning", "info"]
    label: str
    value: str


class FallbackBlock(BaseModel):
    type: Literal["fallback"] = "fallback"
    message: str
    suggestion: str | None = None


class DividerBlock(BaseModel):
    type: Literal["divider"] = "divider"


UIBlock = Annotated[
    Union[
        TextBlock,
        TableBlock,
        ProductCardBlock,
        TabsBlock,
        ClarificationBlock,
        ActionButtonBlock,
        BadgeBlock,
        FallbackBlock,
        DividerBlock,
    ],
    Field(discriminator="type"),
]


class ZephyrosResponse(BaseModel):
    blocks: list[UIBlock]


class ErrorResponse(BaseModel):
    error: str
    detail: str


TabItem.model_rebuild()
TabsBlock.model_rebuild()
