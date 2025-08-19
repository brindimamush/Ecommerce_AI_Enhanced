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
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query
  const [searchResults, setSearchResults] = useState([]); // New state for search results
  const [isSearching, setIsSearching] = useState(false); // To toggle between all products and search results


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

// Function to handle AI search
  const handleAISearch = async (e) => {
    e.preventDefault(); // Prevent form submission if using a form
    if (!searchQuery.trim()) {
      setIsSearching(false); // If query is empty, show all products
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:8000/products/search/?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error during AI search:", error);
      setSearchResults([]);
      alert("Failed to perform search. Please try again.");
    }
  };

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
    setSearchQuery(''); // Clear search on logout
    setSearchResults([]);
    setIsSearching(false);
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
    alert(`Order created successfully! Order ID: ${orderData.id}`);
 
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
        <div className="search-bar">
            <form onSubmit={handleAISearch}>
              <input
                type="text"
                placeholder="Search products with AI (e.g., 'gaming laptop', 'wireless earbuds')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">Search</button>
              {isSearching && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setIsSearching(false); }} className="clear-search-button">
                  Clear Search
                </button>
              )}
            </form>
          </div>
          {/* Conditionally render ProductList with all products or search results */}
          {isSearching && searchResults.length === 0 && searchQuery.trim() !== '' ? (
            <p>No products found for your search query.</p>
          ) : (
          
          <ProductList token={token} onAddToCart={handleAddToCart} productsToDisplay={isSearching ? searchResults : null}/>// Pass search results or null for all
          )}

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