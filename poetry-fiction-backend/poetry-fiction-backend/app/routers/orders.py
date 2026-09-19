from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_admin, get_current_user
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.store import OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["Pedidos"])

VALID_STATUSES = {"pendiente", "confirmado",
                  "preparando", "enviado", "entregado", "cancelado"}


def _order_query(db: Session):
    return db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc())


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED, summary="Crear pedido")
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quantities: dict[int, int] = {}
    for item in payload.items:
        quantities[item.product_id] = quantities.get(
            item.product_id, 0) + item.quantity

    products = {}
    for product_id, quantity in quantities.items():
        product = (
            db.query(Product)
            .filter(Product.id == product_id, Product.is_active == True)
            .with_for_update()
            .first()
        )
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Producto {product_id} no encontrado")
        if product.stock < quantity:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail=f"Stock insuficiente para '{product.title}'")
        products[product_id] = product

    subtotal = Decimal("0.00")
    order = Order(
        user_id=current_user.id,
        status="pendiente",
        payment_method=payload.payment_method,
        shipping_address=payload.shipping_address,
        subtotal=Decimal("0.00"),
        total=Decimal("0.00"),
    )
    db.add(order)
    for product_id, quantity in quantities.items():
        product = products[product_id]
        subtotal += product.price * quantity
        product.stock -= quantity
        order.items.append(OrderItem(
            product_id=product.id,
            product_title=product.title,
            unit_price=product.price,
            quantity=quantity,
        ))

    order.subtotal = subtotal
    order.total = subtotal
    db.commit()
    db.refresh(order)
    return _order_query(db).filter(Order.id == order.id).first()


@router.get("/me", response_model=list[OrderOut], summary="Mis pedidos")
def list_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _order_query(db).filter(Order.user_id == current_user.id).all()


@router.get("/admin/list", response_model=list[OrderOut], summary="Listar pedidos administrativos")
def list_admin_orders(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return _order_query(db).all()


@router.get("/{order_id}", response_model=OrderOut, summary="Ver pedido")
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _order_query(db).filter(Order.id == order_id).first()
    if not order or order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    return order


@router.patch("/admin/{order_id}/status", response_model=OrderOut, summary="Actualizar estado de pedido")
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Estado de pedido inválido")
    order = _order_query(db).filter(
        Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    if order.status == "cancelado" and payload.status != "cancelado":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Un pedido cancelado no puede reabrirse")
    if payload.status == "cancelado" and order.status not in {"enviado", "entregado", "cancelado"}:
        for item in order.items:
            product = db.query(Product).filter(
                Product.id == item.product_id).with_for_update().first()
            if product:
                product.stock += item.quantity
    order.status = payload.status
    db.commit()
    return _order_query(db).filter(Order.id == order.id).first()
