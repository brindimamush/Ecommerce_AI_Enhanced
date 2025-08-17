// src/components/ProductList.jsx
import { useState, useEffect } from 'react';

// Add onAddToCart prop
function ProductList({ token, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:8000/products', { headers });
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch products:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token]);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;
  if (products.length === 0) return <div>No products available</div>;

  return (
    <div className="product-list-container">
      <h1>Our Products</h1>
      <div className="product-list">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>Price: ${product.price.toFixed(2)}</p>
            <p>Category: {product.category}</p>
            {/* Add to Cart button */}
            <button
              onClick={() => onAddToCart(product)}
              className="add-to-cart-btn"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;