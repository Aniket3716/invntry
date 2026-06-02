from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.OrderOut])
def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Validate customer
    customer = db.query(models.Customer).filter(models.Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    # Validate stock for all items first (all-or-nothing)
    resolved_items = []
    for item_data in payload.items:
        product = db.query(models.Product).filter(models.Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data.product_id} not found")

        inv = db.query(models.Inventory).filter(models.Inventory.product_id == product.id).first()
        if not inv:
            raise HTTPException(status_code=400, detail=f"No inventory record for product '{product.name}'")

        if inv.quantity < item_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}': requested {item_data.quantity}, available {inv.quantity}",
            )

        resolved_items.append((product, inv, item_data.quantity))

    # Create order
    order = models.Order(customer_id=payload.customer_id, notes=payload.notes)
    db.add(order)
    db.flush()

    total = 0.0
    for product, inv, qty in resolved_items:
        item = models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.price,
        )
        db.add(item)
        inv.quantity -= qty  # Reduce stock
        total += product.price * qty

    order.total_amount = total
    db.commit()
    db.refresh(order)

    return (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .filter(models.Order.id == order.id)
        .first()
    )


@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(order_id: int, payload: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # If cancelling, restore stock
    if payload.status == models.OrderStatus.cancelled and order.status != models.OrderStatus.cancelled:
        for item in order.items:
            inv = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).first()
            if inv:
                inv.quantity += item.quantity

    order.status = payload.status
    db.commit()
    db.refresh(order)

    return (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .filter(models.Order.id == order.id)
        .first()
    )


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()