import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import './App.css';

// Extract Product list logic into its own component
function ProductList({ token }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const headers = {};
        if (token) {
          // Adds authorization header if token is available
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch('http://localhost:8000/products', { headers });
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
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
  }, [token]);

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
    <div className="product-list-container">
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

// Main App component
function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [userEmail, setUserEmail] = useState("");

  // function to fetch user details (Corrected: useEffect should wrap the call to fetchUserMe)
  useEffect(() => {
    if (token) {
      const fetchUserMe = async (currentToken) => {
        try {
          const response = await fetch('http://localhost:8000/users/me/', {
            headers: {
              'Authorization': `Bearer ${currentToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setUserEmail(data.email);
          } else {
            console.error('Failed to fetch user details:', response.status);
            handleLogout(); // Log out if token is invalid or user details can't be fetched
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          handleLogout(); // Log out on network error
        }
      };
      fetchUserMe(token);
    }
  }, [token]); // Only re-run when token changes

  const handleLoginSuccess = () => {
    const newToken = localStorage.getItem('access_token');
    setToken(newToken); // Update state to trigger re-render and user details fetch
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    setToken(null);
    setUserEmail("");
  };

  return (
    <div className="App">
      <header className="app-header"> {/* Changed to app-header for consistency with CSS */}
        <h1>AI Enhanced E-commerce</h1>
        {token ? (
          <div className="user-info">
            <span>Welcome, {userEmail || 'User'}!</span> {/* Added ! for consistency */}
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : null}
      </header>

      {!token ? (
        <Auth onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {/* If logged in, show product list and other features */}
          <ProductList token={token} />
          {/* More features like 'Create Order', 'My Orders' will go here */}
        </>
      )}
    </div>
  );
}

export default App;