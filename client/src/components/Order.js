import React, { useState } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import './Order.css';
import './AddressPopup.css';

const Order = () => {
  const { cart, cartLoaded, addToCart } = useCart();
  const items = Object.values(cart);
  const navigate = useNavigate();

  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [address, setAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [tempAddress, setTempAddress] = useState({
    name: '',
    street: '',
    city: '',
    zip: '',
    phone: '',
  });
  const [selectedItem, setSelectedItem] = useState(null);

  const API_BASE_URL = 'https://connnet4you-server.onrender.com';
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  const handleAddressSubmit = async () => {
    if (!validatePhone(tempAddress.phone)) {
      alert('Please enter a valid 10-digit phone number starting with 6-9');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempAddress),
      });

      if (!response.ok) throw new Error('Failed to save address');
      const savedAddress = await response.json();
      setAddress(savedAddress);
      setShowAddressPopup(false);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('There was an error saving your address. Please try again.');
    }
  };

  const handleOrder = async () => {
    if (!paymentMethod) return alert('Please select a payment method');
    if (!address) return alert('Please enter your address');

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to place an order.');
      navigate('/');
      return;
    }

    const orderData = {
      items,
      total,
      address,
      paymentMethod,
      orderDate: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // <-- Send the auth token here
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error('Failed to place order');
      const result = await response.json();

      const fullOrder = { ...orderData, orderId: result.orderId };

      // Store order in localStorage for summary page
      localStorage.setItem('orderSummary', JSON.stringify(fullOrder));

      if (paymentMethod === 'cod') {
        navigate('/order-summary');
      } else {
        navigate('/payment', { state: { order: fullOrder } });
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handleQtyChange = (item, delta) => {
    const newQty = Math.max(0, item.quantity + delta);
    const diff = newQty - item.quantity;
    if (diff !== 0) addToCart(item, diff);
  };

  if (!cartLoaded) return <div className="order-page"><h2>Loading cart...</h2></div>;
  if (items.length === 0) return <div className="order-page"><h2>No items in cart to order.</h2></div>;

  return (
    <div className="order-page">
      <h1>🧺 Your Cart</h1>
      <div className="order-list">
        {items.map((item) => (
          <div key={item.id} className="order-row">
            <img
              src={process.env.PUBLIC_URL + item.image}
              alt={item.name}
              className="order-img"
              onClick={() => setSelectedItem(item)}
            />
            <div className="order-details">
              <h3>{item.name}</h3>
              <div className="qty-controls">
                <button onClick={() => handleQtyChange(item, -1)} disabled={item.quantity <= 1}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleQtyChange(item, 1)}>+</button>
              </div>
            </div>
            <div className="order-price">₹{(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="order-total">
        <h2>Total: ₹{total.toFixed(2)}</h2>
      </div>

      {address ? (
        <div className="address-summary">
          <h4>Deliver To:</h4>
          <p>{address.name}, {address.street}, {address.city} - {address.zip}<br />Phone: {address.phone}</p>
          <button
            className="edit-btn"
            onClick={() => {
              setTempAddress(address);
              setShowAddressPopup(true);
            }}
          >
            Edit Address
          </button>

          <div className="payment-options">
            <label>
              <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
              Cash on Delivery
            </label><br />
            <label>
              <input type="radio" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
              Pay Online
            </label>
          </div>

          <button onClick={handleOrder}>Place Order</button>
        </div>
      ) : (
        <button onClick={() => setShowAddressPopup(true)}>Enter Address</button>
      )}

      {showAddressPopup && (
        <div className="address-popup-overlay" onClick={() => setShowAddressPopup(false)}>
          <div className="address-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAddressPopup(false)}>&times;</button>
            <h2>Delivery Address</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleAddressSubmit(); }}>
              <input type="text" placeholder="Name" value={tempAddress.name} onChange={(e) => setTempAddress({ ...tempAddress, name: e.target.value })} required />
              <input type="text" placeholder="Street" value={tempAddress.street} onChange={(e) => setTempAddress({ ...tempAddress, street: e.target.value })} required />
              <input type="text" placeholder="City" value={tempAddress.city} onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })} required />
              <input type="text" placeholder="ZIP Code" value={tempAddress.zip} onChange={(e) => setTempAddress({ ...tempAddress, zip: e.target.value })} required />
              <input type="tel" placeholder="Phone Number" value={tempAddress.phone} onChange={(e) => setTempAddress({ ...tempAddress, phone: e.target.value })} required maxLength={10} />
              <button type="submit">Save Address</button>
            </form>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="address-popup-overlay" onClick={() => setSelectedItem(null)}>
          <div className="address-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedItem(null)}>&times;</button>
            <h2>{selectedItem.name}</h2>
            <img src={process.env.PUBLIC_URL + selectedItem.image} alt={selectedItem.name} />
            <p>{selectedItem.description || "No description available."}</p>
            <p><strong>Price:</strong> ₹{Number(selectedItem.price).toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
