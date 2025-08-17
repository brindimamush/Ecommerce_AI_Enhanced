import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ProductList from './components/ProductList';
import Cart from './components/Cart'
import './App.css';

// Main App component
function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [userEmail, setUserEmail] = useState("");
  const [cartItems, setCartItems] = useState([]); // New state for cart items

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
            handleLogout();
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          handleLogout();
        }
      };
      fetchUserMe(token);
    }
  }, [token]);

  const handleLoginSuccess = () => {
    const newToken = localStorage.getItem('access_token');
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    setToken(null);
    setUserEmail("");
    setCartItems([]); // Clear cart on logout
  };

  // New: Add to cart logic
  const handleAddToCart = (productToAdd) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === productToAdd.id);
      if (existingItem) {
        // If item already in cart, increment quantity
        return prevItems.map(item =>
          item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Otherwise, add new item with quantity 1
        return [...prevItems, { ...productToAdd, quantity: 1 }];
      }
    });
  };

  // New: Remove from cart logic
  const handleRemoveFromCart = (productIdToRemove) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productIdToRemove));
  };

  // New: Clear cart after successful order
  const handleCreateOrderSuccess = (orderData) => {
    // You could redirect, show a confirmation modal, etc.
    setCartItems([]); // Clear the cart
    // Optionally, fetch user's orders to display the new one immediately
    // (we'll add "My Orders" in a future step)
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>AI Enhanced E-commerce</h1>
        {token ? (
          <div className="user-info">
            <span>Welcome, {userEmail || 'User'}!</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : null}
      </header>

      {!token ? (
        <Auth onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {/* Product List */}
          <ProductList token={token} onAddToCart={handleAddToCart} />

          {/* Cart Component */}
          <Cart
            cartItems={cartItems}
            onRemoveFromCart={handleRemoveFromCart}
            onCreateOrder={handleCreateOrderSuccess}
            token={token} // Pass token to Cart for authenticated order creation
          />
        </>
      )}
    </div>
  );
}

export default App;