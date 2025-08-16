from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer

from database import models, database
from sqlalchemy.orm import Session

from security import auth
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Annotated
#pydentic schema for creating a product(request body)
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str

#pydentic schema for reading a product(response model)
class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    category: str

    class Config:
        from_attributes = True

#Pydantic schema for User registration (request body)
class UserCreate(BaseModel):
    email: str
    password: str

#Pydantic schema for User response (excludes password)
class UserResponse(BaseModel):
    id: int
    email: str
    is_active: int
    class Config:
        from_attributes = True

#Pydantic schema for Token (response after login)
class Token(BaseModel):
    access_token: str
    token_type: str

#Pydantic schema for Token Data (what's inside the token)
class TokenData(BaseModel):
    email: str | None = None

#Pydantic schema for OrderItem creation (request body)
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

#Pydantic schema for OrderItem response
class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float

    class Config:
        from_attributes = True

#pydantic schema for Order creation (request body)
class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = [] # List of items for the order

#pydantic schema for Order response
class OrderResponse(BaseModel):
    id: int
    user_id: int
    order_date: datetime
    total_amount: float
    status: str
    items: list[OrderItemResponse] = []
    class Config:
        from_attributes = True

#Initialize FastAPI app
app = FastAPI(
    title="AI-Enahnced E-commerce API",
    description = "Backend for a smart e-commerce",
    version="0.1.0",
)

# Create the database tables when the application starts
@app.on_event("startup")
def on_startup():
    database.Base.metadata.create_all(bind=database.engine)
    print("Database tables created.")


# Basic product Model
# class Product(BaseModel):
#     id: int
#     name: str
#     description: str
#     price: float
#     category: str

# #In-memory "database" for demonstration purpose

# products_db = [
#     Product(id=1, name="Wireless Earbuds", description="High-fidelity audio, noise-cancelling.", price=99.99, category="Electronics"),
#     Product(id=2, name="Smartwatch", description="Fitness tracker, heart rate monitor, notifications.", price=199.99, category="Electronics"),
#     Product(id=3, name="Gaming Keyboard", description="Mechanical keys, RGB lighting, customizable macros.", price=120.00, category="Peripherals"),
#     Product(id=4, name="Ergonomic Mouse", description="Designed for comfort and precision.", price=45.50, category="Peripherals"),
# ]

@app.get("/")
async def read_root():
    return {"message": "Welcome to the AI-Enhanced E-commerce API!"}

@app.get("/products", response_model=list[ProductResponse])
async def get_products(db: Session = Depends(database.get_db)):
    """
    Retrieve a list of all products.
    """
    products = db.query(models.Product).all()
    return products

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: Annotated[models.User, Depends(auth.get_current_user)]):
    return current_user

#Protected Product Routes (Requies Authentication)

@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, sb: Session = Depends(database.get_db)):
    """
    Retrieve a single product by its ID from the database.
    """
    # for product in products_db:
    #     if product.id == product_id:
    #         return product
    # return {"error": "product not found"}
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
"""

Below is the route using POST method


"""

@app.post("/products", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    current_user: Annotated[models.User, Depends(auth.get_current_user)], # Moved
    db: Session = Depends(database.get_db) # Moved
):
    """
    Add a new product to the catalog.
    """
    db_product = models.Product(**product.dict())#Create SQLALCHEMY model instance
    db.add(db_product)  # Add the product to the session
    db.commit()  # Commit the transaction
    db.refresh(db_product)  # Refresh the instance to get the new ID and other defaults
    return db_product


@app.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/orders", response_model=OrderResponse)
async def create_order(
    order: OrderCreate,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Session = Depends(database.get_db)
):
    # Calculate total amount and store price at purchase
    total_amount = 0.0
    order_items_db = []

    for item_data in order.items:
        product = db.query(models.Product).filter(models.Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item_data.product_id} not found")
        
        #Store price at time of purchase
        price_at_purchase = product.price
        total_amount += price_at_purchase * item_data.quantity

        db_order_item = models.OrderItem(
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            price_at_purchase=price_at_purchase
        )
        order_items_db.append(db_order_item)

    db_order = models.Order(
        user_id=current_user.id,
        total_amount=total_amount,
        items=order_items_db
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    return db_order

@app.get("/orders/", response_model=list[OrderResponse])
async def get_my_orders(
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Session = Depends(database.get_db),
    
):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).all()
    return orders

@app.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
    order_id: int,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Session = Depends(database.get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order