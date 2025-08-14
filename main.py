from fastapi import FastAPI
from pydantic import BaseModel

#Initialize FastAPI app
app = FastAPI(
    title="AI-Enahnced E-commerce API",
    description = "Backend for a smart e-commerce",
    version="0.1.0",
)

# Basic product Model
class Product(BaseModel):
    id: int
    name: str
    description: str
    price: float
    category: str

#In-memory "database" for demonstration purpose

products_db = [
    Product(id=1, name="Wireless Earbuds", description="High-fidelity audio, noise-cancelling.", price=99.99, category="Electronics"),
    Product(id=2, name="Smartwatch", description="Fitness tracker, heart rate monitor, notifications.", price=199.99, category="Electronics"),
    Product(id=3, name="Gaming Keyboard", description="Mechanical keys, RGB lighting, customizable macros.", price=120.00, category="Peripherals"),
    Product(id=4, name="Ergonomic Mouse", description="Designed for comfort and precision.", price=45.50, category="Peripherals"),
]

@app.get("/")
async def read_root():
    return {"message": "Welcome to the AI-Enhanced E-commerce API!"}

@app.get("/products", response_model=list[Product])
async def get_products():
    """
    Retrieve a list of all products.
    """
    return products_db

@app.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: int):
    """
    Retrieve a single product by its ID.
    """
    for product in products_db:
        if product.id == product_id:
            return product
    return {"error": "product not found"}

@app.post("/products", response_model=Product)
async def create_product(product: Product):
    """
    Add a new product to the catalog.
    """
    products_db.append(product)
    return product