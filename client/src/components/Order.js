import React, { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from './UserContext';
import AddressPopup from './AddressPopup';
import './Order.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const Order = () => {
  const { cart, cartLoaded, addToCart } = useCart();
  const items = Object.values(cart);
  const navigate = useNavigate();
  const { user } = useUser();
  const { shopSlug: paramShopSlug } = useParams();
  const [refreshNotifications, setRefreshNotifications] = useState(0);

  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [addresses, setAddresses] = useState([]);
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

  // Always disable online payment for now
  const isOnlinePaymentDisabled = true;

  // Show minimum order warning if total < minOrderValue
  const [showMinOrderWarning, setShowMinOrderWarning] = useState(false);

  // Takeaway only if order below minOrderValue
  const [isTakeaway, setIsTakeaway] = useState(false);

  // Dynamic min order value fetched from shop
  const [minOrderValue, setMinOrderValue] = useState(200);

  const effectiveShopSlug = user?.shop_slug || paramShopSlug || 'ConnectFREE4U';

  const resolveImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('http') || image.startsWith('/images/')) return image;
    return `${API_BASE_URL}/images/${image}`;
  };

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE_URL}/api/address`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch addresses');
        const data = await res.json();
        setAddresses(data);
        if (data.length > 0) setAddress(data[0]);
        else setAddress(null);
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setAddresses([]);
        setAddress(null);
      }
    };

    fetchAddresses();
  }, [user]);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/shops/${effectiveShopSlug}`);
        if (!res.ok) throw new Error('Failed to fetch shop data');
        const data = await res.json();
        setMinOrderValue(Number(data.minordervalue) || 200);
      } catch (err) {
        console.error(err);
        setMinOrderValue(200);
      }
    };

    fetchShopData();
  }, [effectiveShopSlug]);

  // Update takeaway and warning based on total and minOrderValue
  useEffect(() => {
    if (total >= minOrderValue) {
      setShowMinOrderWarning(false);
      setIsTakeaway(false);
    } else {
      setShowMinOrderWarning(true);
      setIsTakeaway(true);
      if (paymentMethod === 'online') {
        setPaymentMethod('cod'); // fallback
      }
    }
  }, [total, paymentMethod, minOrderValue]);

  const handleAddressSubmit = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!user?.id) {
        alert('User ID missing. Please log in again.');
        return;
      }

      const addressPayload = { ...tempAddress };
      if (tempAddress.id) addressPayload.id = tempAddress.id;

      const response = await fetch(`${API_BASE_URL}/api/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressPayload),
      });

      if (!response.ok) throw new Error('Failed to save address');
      const savedAddress = await response.json();

      if (tempAddress.id) {
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === savedAddress.id ? savedAddress : addr))
        );
      } else {
        setAddresses((prev) => [...prev, savedAddress]);
      }

      setAddress(savedAddress);
      setShowAddressPopup(false);
      setTempAddress({ name: '', street: '', city: '', zip: '', phone: '' });
    } catch (error) {
      console.error('Error saving address:', error);
      alert('There was an error saving your address. Please try again.');
    }
  };

  const handleOrder = async () => {
    if (!paymentMethod) return alert('Please select a payment method');
    if (!isTakeaway && !address) {
      alert('Please select or enter your address.');
      setShowAddressPopup(true);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('You must be logged in to place an order.');
      navigate('/login');
      return;
    }

    const orderData = {
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        shopId: i.shopId ?? i.shop_id,
        unit_id: i.unit_id ?? null,
        unit_type: i.unit_type ?? null,
      })),
      total,
      address: isTakeaway ? null : address,
      paymentMethod,
      takeaway: isTakeaway,
      orderDate: new Date().toISOString(),
    };

    console.log('[handleOrder] Submitting order with payload:', orderData);

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const responseText = await response.text();
      console.log('[handleOrder] Raw response from server:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status} ${response.statusText}`);
      }

      const result = JSON.parse(responseText);

      setRefreshNotifications((prev) => prev + 1);
      const fullOrder = { ...orderData, orderId: result.orderId };
      localStorage.setItem('orderSummary', JSON.stringify(fullOrder));

      // Pay Online disabled, so navigate only COD summary
      navigate(`/${effectiveShopSlug}/order-summary`);
    } catch (error) {
      console.error('[handleOrder] Order placement failed:', error);
      alert('Failed to place order. Please check your address and try again.');
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
              src={resolveImageUrl(item.image)}
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

      {isTakeaway ? (
        <div className="takeaway-info" style={{ marginBottom: '1em', color: 'blue' }}>
          <strong>Your order total is less than ₹{minOrderValue}.</strong> This will be a <em>Takeaway</em> order with payment to be made <strong>directly at the restaurant</strong>.
        </div>
      ) : (
        addresses.length > 0 ? (
          <div className="address-list">
            <h3>Select Delivery Address</h3>
            {addresses.map((addr) => (
              <div key={addr.id} className="address-item-wrapper">
                <label className="address-item">
                  <input
                    type="radio"
                    name="selectedAddress"
                    value={addr.id}
                    checked={address?.id === addr.id}
                    onChange={() => setAddress(addr)}
                  />
                  <div>
                    {addr.name}, {addr.street}, {addr.city} - {addr.zip}
                    <br />
                    Phone: {addr.phone}
                  </div>
                </label>
                <button
                  className="edit-address-btn"
                  onClick={() => {
                    setTempAddress(addr);
                    setShowAddressPopup(true);
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
            <button
              className="add-new-address-btn"
              onClick={() => {
                setTempAddress({ name: '', street: '', city: '', zip: '', phone: '' });
                setShowAddressPopup(true);
              }}
            >
              ➕ Add New Address
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAddressPopup(true)}>Add Delivery Address</button>
        )
      )}

      {showMinOrderWarning && !isTakeaway && (
        <div className="min-order-warning" style={{ color: 'red', marginBottom: '1em' }}>
          Minimum order value for delivery is ₹{minOrderValue}.
        </div>
      )}

      <div className="payment-options">
        <h3>Choose Payment Method</h3>
        <label>
          <input
            type="radio"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={() => setPaymentMethod('cod')}
          />
          Cash on Delivery (COD)
        </label>
        <label>
          <input
            type="radio"
            value="online"
            checked={paymentMethod === 'online'}
            disabled={isOnlinePaymentDisabled}
            onChange={() => setPaymentMethod('online')}
          />
          Pay Online (disabled)
        </label>
      </div>

      <button
        className="order-button"
        disabled={!paymentMethod || (isTakeaway === false && !address)}
        onClick={handleOrder}
      >
        Place Order
      </button>

      {showAddressPopup && (
        <AddressPopup
          tempAddress={tempAddress}
          setTempAddress={setTempAddress}
          onClose={() => setShowAddressPopup(false)}
          onSubmit={handleAddressSubmit}
        />
      )}

      {selectedItem && (
        <div className="popup-overlay" onClick={() => setSelectedItem(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedItem.name}</h2>
            <img
              src={resolveImageUrl(selectedItem.image)}
              alt={selectedItem.name}
              className="popup-img"
            />
            <p>Price: ₹{selectedItem.price}</p>
            <button onClick={() => setSelectedItem(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
