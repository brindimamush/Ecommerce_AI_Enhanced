// src/components/ProductList.jsx
import { useState, useEffect } from 'react';

// Add onAddToCart prop
function ProductList({ token, onAddToCart , productsToDisplay}) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productsToDisplay === null) { // Only fetch if not in search mode
     
    const fetchProducts = async () => {
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:8000/products/', { headers });
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
  }else {
    // If productsToDisplay is provided (i.e., we are in search mode),
      // update internal state with search results
      setProducts(productsToDisplay);
      setLoading(false); // No loading needed as data is passed
      setError(null); // Clear any previous error
  }
  }, [token, productsToDisplay]);// Re-run if token or productsToDisplay changes

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;
  if (products.length === 0) return <div>No products available</div>;

  return (
    <div className="product-list-container">
      <h1>{productsToDisplay ? "Search Results" : "All Products"}</h1> {/* Dynamic title */}
      <div className="product-list">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>Price: ${product.price.toFixed(2)}</p>
            <p>Category: {product.category}</p>
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