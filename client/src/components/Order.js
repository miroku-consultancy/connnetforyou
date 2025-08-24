import React, { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from './UserContext';
import AddressPopup from './AddressPopup';
import './Order.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

// Parse image field to array of strings robustly (single, array, or JSON-stringified)
const parseImageList = (image) => {
  if (!image) return [];
  if (Array.isArray(image)) return image;
  try {
    const parsed = JSON.parse(image);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    try {
      const cleanImage = image.trim().replace(/^["']|["']$/g, '');
      const parsedAgain = JSON.parse(cleanImage);
      if (Array.isArray(parsedAgain)) return parsedAgain;
      return [parsedAgain];
    } catch {
      return [image];
    }
  }
};

// URL resolution for images
const resolveImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('/images/')) return image;
  if (image.startsWith('/uploads/')) return `${API_BASE_URL}${image}`;
  return `${API_BASE_URL}/images/${image}`;
};

const Order = () => {
  const { cart, cartLoaded, addToCart } = useCart();
  const items = Object.values(cart);
  const navigate = useNavigate();
  const { user } = useUser();
  const { shopSlug: paramShopSlug } = useParams();

  const [initialAddressLoadComplete, setInitialAddressLoadComplete] = useState(false);
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

  const isOnlinePaymentDisabled = false;
  const [showMinOrderWarning, setShowMinOrderWarning] = useState(false);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [minOrderValue, setMinOrderValue] = useState(200);

  const effectiveShopSlug = user?.shop_slug || paramShopSlug || 'ConnectFREE4U';
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  // Load user addresses once
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
        setAddress(data.length > 0 ? data[0] : null);
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setAddresses([]);
        setAddress(null);
      } finally {
        setInitialAddressLoadComplete(true);
      }
    };
    fetchAddresses();
  }, [user]);

  // Fetch shop min order value
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

  // Redirect if cart is empty
  useEffect(() => {
    if (cartLoaded && items.length === 0) {
      navigate(`/${effectiveShopSlug}/products`);
    }
  }, [cartLoaded, items, navigate, effectiveShopSlug]);

  // Handle takeaway/min order warning
  useEffect(() => {
    if (total >= minOrderValue) {
      setShowMinOrderWarning(false);
      setIsTakeaway(false);
    } else {
      setShowMinOrderWarning(true);
      setIsTakeaway(true);
      if (paymentMethod === 'online') {
        setPaymentMethod('cod');
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addressPayload),
      });
      if (!response.ok) throw new Error('Failed to save address');
      const savedAddress = await response.json();
      if (tempAddress.id) {
        setAddresses((prev) => prev.map((addr) => (addr.id === savedAddress.id ? savedAddress : addr)));
      } else {
        setAddresses((prev) => [...prev, savedAddress]);
      }
      setAddress(savedAddress);
      setShowAddressPopup(false);
      setTempAddress({ name: '', street: '', city: '', zip: '', phone: '' });
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Error saving your address. Please try again.');
    }
  };

  const handleOrder = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate(`/${paramShopSlug || 'ConnectFREE4U'}/login?redirect=${window.location.pathname}`);
      return;
    }
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }
    if (!isTakeaway && (addresses.length === 0 || !address)) {
      alert('Please add your delivery address before placing the order.');
      setShowAddressPopup(true);
      return;
    }

    const orderData = {
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        shopId: i.shopId ?? i.shop_id,
        unit_id: i.unit_id ?? null,
        unit_type: i.unit_type ?? null,
        size: i.size ?? null,
        color: i.color ?? null,
        unit: i.unit ?? null,
      })),
      total,
      address: isTakeaway ? null : address,
      paymentMethod,
      takeaway: isTakeaway,
      orderDate: new Date().toISOString(),
    };

    if (paymentMethod === 'online') {
      try {
        const razorRes = await fetch(`${API_BASE_URL}/api/razorpay/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount: total }),
        });
        const razorOrder = await razorRes.json();
        if (!razorOrder.id) throw new Error('Failed to create Razorpay order');

        const options = {
          key: 'rzp_live_MkghgTdJwmhcuO',
          amount: razorOrder.amount,
          currency: 'INR',
          name: 'ConnectFree4U',
          description: 'Order Payment',
          order_id: razorOrder.id,
          handler: async (response) => {
            try {
              const verifyRes = await fetch(`${API_BASE_URL}/api/razorpay/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(response),
              });

              const verifyResult = await verifyRes.json();
              if (!verifyResult.success) {
                alert('Payment verification failed');
                return;
              }

              const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(orderData),
              });
              const result = await orderResponse.json();
              if (!orderResponse.ok) throw new Error(result.error || 'Order creation failed');

              const fullOrder = { ...orderData, orderId: result.orderId };
              localStorage.setItem('orderSummary', JSON.stringify(fullOrder));

              navigate(`/${effectiveShopSlug}/order-summary`);
            } catch (err) {
              console.error('[RazorpayHandler] Error:', err);
              alert('Order failed after payment. Please contact support.');
            }
          },
          prefill: { name: user?.name || '', contact: user?.mobile || '' },
          theme: { color: '#3399cc' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.error('[Razorpay] Payment flow error:', err);
        alert('Something went wrong during payment. Please try again.');
        return;
      }
    }

    // COD flow
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(orderData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to place order');
      const fullOrder = { ...orderData, orderId: result.orderId };
      localStorage.setItem('orderSummary', JSON.stringify(fullOrder));
      navigate(`/${effectiveShopSlug}/order-summary`);
    } catch (error) {
      console.error('[handleOrder] COD flow error:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  // Cart quantity changes are always per variant (including size/color/unit)
  const handleQtyChange = (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      addToCart(item, -item.quantity);
      return;
    }
    const diff = newQty - item.quantity;
    addToCart(item, diff);
  };

  if (!cartLoaded) return <div className="order-page"><h2>Loading cart...</h2></div>;
  if (items.length === 0) return <div className="order-page"><h2>No items in cart to order.</h2></div>;

  return (
    <div className="order-page">
      <h1>🧺 Your Cart</h1>
      <div className="order-list">
        {items.map((item) => {
          const firstImage = parseImageList(item.image)[0] || '';
          return (
            <div key={item.id} className="order-row">
              <img
                src={resolveImageUrl(firstImage)}
                alt={item.name}
                className="order-img"
                onClick={() => setSelectedItem(item)}
              />
              <div className="order-details">
                <h3>
                  {item.name}
                  {(item.size || item.color || item.unit) && (
                    <span className="unit-label">
                      {' '}
                      (
                      {[
                        item.size ? (item.size.name || item.size) : null,
                        item.color ? (item.color.name || item.color) : null,
                        item.unit ? (item.unit.name || item.unit) : null,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                      )
                    </span>
                  )}
                </h3>
                <div className="qty-controls">
                  <button onClick={() => handleQtyChange(item, -1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleQtyChange(item, 1)}>+</button>
                </div>
              </div>
              <div className="order-price">₹{(item.price * item.quantity).toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      <div className="order-total">
        <h2>Total: ₹{total.toFixed(2)}</h2>
      </div>

      {isTakeaway ? (
        <div className="takeaway-info" style={{ marginBottom: '1em', color: 'blue' }}>
          <strong>Your order total is less than ₹{minOrderValue}</strong> — please pick it up from the shop and pay there.
        </div>
      ) : addresses.length > 0 ? (
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
        initialAddressLoadComplete && (
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
          Pay Online (Online payment isn't available for this store — the store needs to contact via Call/Email.)
        </label>
      </div>

      <button className="order-button" onClick={handleOrder}>
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
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedItem.name}</h2>
            {(selectedItem.size || selectedItem.color || selectedItem.unit) && (
              <div style={{ marginBottom: '1em' }}>
                {[
                  selectedItem.size ? (selectedItem.size.name || selectedItem.size) : null,
                  selectedItem.color ? (selectedItem.color.name || selectedItem.color) : null,
                  selectedItem.unit ? (selectedItem.unit.name || selectedItem.unit) : null,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}
            <img
              src={resolveImageUrl(parseImageList(selectedItem.image)[0] || '')}
              alt={selectedItem.name}
            />
            <p>Price: ₹{selectedItem.price}</p>
            <p>Description: {selectedItem.description || 'No description available'}</p>
            <button onClick={() => setSelectedItem(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
