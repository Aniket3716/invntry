from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.InventoryWithProduct])
def list_inventory(db: Session = Depends(get_db)):
    return (
        db.query(models.Inventory)
        .options(joinedload(models.Inventory.product))
        .all()
    )


@router.get("/low-stock", response_model=List[schemas.InventoryWithProduct])
def low_stock_items(db: Session = Depends(get_db)):
    items = (
        db.query(models.Inventory)
        .options(joinedload(models.Inventory.product))
        .all()
    )
    return [i for i in items if i.quantity <= i.low_stock_threshold]


@router.put("/{product_id}", response_model=schemas.InventoryWithProduct)
def update_inventory(product_id: int, payload: schemas.InventoryUpdate, db: Session = Depends(get_db)):
    inv = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    if payload.quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")

    inv.quantity = payload.quantity
    if payload.low_stock_threshold is not None:
        inv.low_stock_threshold = payload.low_stock_threshold

    db.commit()
    db.refresh(inv)
    return inv


@router.get("/stats/dashboard", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func

    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    pending_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.pending).count()

    inventory_items = db.query(models.Inventory).all()
    low_stock_count = sum(1 for i in inventory_items if i.quantity <= i.low_stock_threshold)

    revenue_result = db.query(func.sum(models.Order.total_amount)).filter(
        models.Order.status != models.OrderStatus.cancelled
    ).scalar()
    total_revenue = float(revenue_result or 0)

    return schemas.DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        pending_orders=pending_orders,
        low_stock_count=low_stock_count,
        total_revenue=total_revenue,
    )