// src/components/Cart.jsx
import React from 'react';

function Cart({ cartItems, onRemoveFromCart, onCreateOrder, token }) {
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  };

  const handleCreateOrder = async () => {
    if (!token) {
      alert("You must be logged in to create an order.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const orderItems = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch('http://localhost:8000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderItems }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const orderData = await response.json();
      alert(`Order created successfully! Order ID: ${orderData.id}`);
      onCreateOrder(orderData); // Notify parent to clear cart or show success
    } catch (error) {
      console.error('Error creating order:', error);
      alert(`Failed to create order: ${error.message}`);
    }
  };

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul className="cart-list">
            {cartItems.map(item => (
              <li key={item.id}>
                {item.name} - ${item.price.toFixed(2)} x {item.quantity}
                <button onClick={() => onRemoveFromCart(item.id)} className="remove-from-cart-btn">
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <h3>Total: ${calculateTotal()}</h3>
          <button onClick={handleCreateOrder} className="create-order-btn">
            Create Order
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;