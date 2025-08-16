import { useState, useEffect } from 'react';
import './App.css';

function App(){
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/products');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        setError(error.message);
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
};
    fetchProducts();
  }, []);
  
  if (loading) {
    return <div>Loading products...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  if (products.length === 0) {
    return <div>No products available</div>;
  }

  return (
    <div className="App">
      <h1>Our Products</h1>
      <div className="product-list">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>Price: ${product.price.toFixed(2)}</p>
            <p>Category: {product.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;