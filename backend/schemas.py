from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from models import OrderStatus


# ── Product Schemas ──────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return v


class ProductCreate(ProductBase):
    initial_stock: int = 0
    low_stock_threshold: int = 10


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None


class InventoryOut(BaseModel):
    quantity: int
    low_stock_threshold: int
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    inventory: Optional[InventoryOut] = None

    class Config:
        from_attributes = True


# ── Customer Schemas ─────────────────────────────────────────────────────────

class CustomerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Order Schemas ────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be at least 1")
        return v


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderOut(BaseModel):
    id: int
    customer_id: int
    status: OrderStatus
    total_amount: float
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    customer: Optional[CustomerOut] = None
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True


# ── Inventory Schemas ────────────────────────────────────────────────────────

class InventoryUpdate(BaseModel):
    quantity: int
    low_stock_threshold: Optional[int] = None


class InventoryWithProduct(BaseModel):
    id: int
    product_id: int
    quantity: int
    low_stock_threshold: int
    updated_at: Optional[datetime]
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


# ── Dashboard Schema ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    pending_orders: int
    low_stock_count: int
    total_revenue: float