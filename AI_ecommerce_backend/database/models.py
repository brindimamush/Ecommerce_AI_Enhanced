from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from .database import Base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    category = Column(String, index=True)
    stock = Column(Integer, default=0)

    #Relationship to order items
    order_items = relationship("OrderItem", back_populates="product")

# New user model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Integer, default=1)  # 1 for active, 0 for inactive

    #Relationship to orders
    orders = relationship("Order", back_populates="user")

# New Order Model
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    order_date = Column(DateTime, default=func.now())
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="Pending")

    #Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    # cascade="all, delete-orphan" ensures that if an order is deleted, its items are also deleted

#New OrderItem Model (for products within an order)
class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    price_at_purchase = Column(Float)

    #Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")