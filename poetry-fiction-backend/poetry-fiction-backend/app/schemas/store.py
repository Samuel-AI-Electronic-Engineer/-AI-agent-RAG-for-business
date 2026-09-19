from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    author: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=2)
    price: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    format: str = Field(..., min_length=2, max_length=80)
    category: str = Field(..., min_length=2, max_length=80)
    accent: str = Field("gold", max_length=30)
    stock: int = Field(0, ge=0)


class ProductUpdate(BaseModel):
    title: str | None = Field(None, min_length=2, max_length=200)
    author: str | None = Field(None, min_length=2, max_length=150)
    description: str | None = Field(None, min_length=2)
    price: Decimal | None = Field(None, gt=0, max_digits=10, decimal_places=2)
    format: str | None = Field(None, min_length=2, max_length=80)
    category: str | None = Field(None, min_length=2, max_length=80)
    accent: str | None = Field(None, max_length=30)
    stock: int | None = Field(None, ge=0)
    is_active: bool | None = None


class ProductOut(ProductCreate):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1, le=100)


class OrderCreate(BaseModel):
    payment_method: str = Field(..., min_length=2, max_length=60)
    shipping_address: str = Field(..., min_length=5, max_length=500)
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderItemOut(BaseModel):
    product_id: int
    product_title: str
    unit_price: Decimal
    quantity: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    status: str
    payment_method: str
    shipping_address: str
    subtotal: Decimal
    total: Decimal
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str = Field(
        ..., pattern="^(pendiente|confirmado|preparando|enviado|entregado|cancelado)$")
