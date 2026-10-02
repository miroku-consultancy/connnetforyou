import React, { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import AddressPopup from './AddressPopup';
import { useTenant } from '../context/TenantContext';
import './Order.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

// Parse image field to array of strings robustly
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

  if (
    image.startsWith('http') ||
    image.startsWith('/images/')
  ) {
    return image;
  }

  if (image.startsWith('/uploads/')) {
    return `${API_BASE_URL}${image}`;
  }

  return `${API_BASE_URL}/images/${image}`;
};

const Order = () => {
  const [shop, setShop] = useState(null);

  const {
    cart,
    cartLoaded,
    addToCart,
  } = useCart();

  const items = Object.values(cart);
const isServiceOrder =
  items.length > 0 &&
  items.every(
    (item) => item.cartType === 'service'
  );

  const navigate = useNavigate();

  const { user } = useUser();

  const { tenant } = useTenant();

  const shopSlug = tenant?.shopSlug;

  /*
   * Product and service carts are shop-specific.
   *
   * Product shop:
   *   cart contains product items.
   *
   * Service shop:
   *   cart contains service items.
   */
  const isServiceCart =
    items.length > 0 &&
    items.every(
      (item) => item.cartType === 'service'
    );
useEffect(() => {
  if (items.length === 0) {
    return;
  }

  sessionStorage.setItem(
    'cartReturnType',
    isServiceCart
      ? 'service'
      : 'product'
  );
}, [
  items,
  isServiceCart,
]);
  const [
    initialAddressLoadComplete,
    setInitialAddressLoadComplete,
  ] = useState(false);

  const [
    showAddressPopup,
    setShowAddressPopup,
  ] = useState(false);

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

  const [
    showMinOrderWarning,
    setShowMinOrderWarning,
  ] = useState(false);

  const [isTakeaway, setIsTakeaway] = useState(false);

  const [minOrderValue, setMinOrderValue] = useState(200);

  const total = items.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  // --------------------------------------------------
  // LOAD USER ADDRESSES
  // --------------------------------------------------

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.id) return;

      try {
        const token =
          localStorage.getItem('authToken');

        const res = await fetch(
          `${API_BASE_URL}/api/address`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            'Failed to fetch addresses'
          );
        }

        const data = await res.json();

        setAddresses(data);

        setAddress(
          data.length > 0
            ? data[0]
            : null
        );
      } catch (error) {
        console.error(
          'Error fetching addresses:',
          error
        );

        setAddresses([]);
        setAddress(null);
      } finally {
        setInitialAddressLoadComplete(true);
      }
    };

    fetchAddresses();
  }, [user]);

  // --------------------------------------------------
  // FETCH SHOP DATA
  // --------------------------------------------------

  useEffect(() => {
    const fetchShopData = async () => {
      if (!shopSlug) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/shops/${shopSlug}`
        );

        if (!res.ok) {
          throw new Error(
            `Failed to fetch shop data: ${res.status}`
          );
        }

        const data = await res.json();

        setShop(data);

        setMinOrderValue(
          Number(
            data.minordervalue || 200
          )
        );
      } catch (error) {
        console.error(
          'Error:',
          error
        );
      }
    };

    fetchShopData();
  }, [shopSlug]);

  // --------------------------------------------------
  // REDIRECT IF CART IS EMPTY
  // --------------------------------------------------

  useEffect(() => {
  if (!cartLoaded || items.length !== 0) {
    return;
  }

  const returnType =
    sessionStorage.getItem('cartReturnType');

  sessionStorage.removeItem('cartReturnType');

  navigate(
    returnType === 'service'
      ? '/services'
      : '/products'
  );
}, [
  cartLoaded,
  items.length,
  navigate,
]);

  // --------------------------------------------------
  // PRODUCT MINIMUM ORDER LOGIC
  //
  // Service cart does NOT use:
  // - minimum order
  // - takeaway
  // --------------------------------------------------

  useEffect(() => {
    if (isServiceCart) {
      setShowMinOrderWarning(false);
      setIsTakeaway(false);
      return;
    }

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
  }, [
    isServiceCart,
    total,
    paymentMethod,
    minOrderValue,
  ]);

  // --------------------------------------------------
  // SAVE ADDRESS
  // --------------------------------------------------

  const handleAddressSubmit = async () => {
    try {
      const token =
        localStorage.getItem('authToken');

      if (!user?.id) {
        alert(
          'User ID missing. Please log in again.'
        );
        return;
      }

      const addressPayload = {
        ...tempAddress,
      };

      if (tempAddress.id) {
        addressPayload.id =
          tempAddress.id;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/address`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify(
            addressPayload
          ),
        }
      );

      if (!response.ok) {
        throw new Error(
          'Failed to save address'
        );
      }

      const savedAddress =
        await response.json();

      if (tempAddress.id) {
        setAddresses((prev) =>
          prev.map((addr) =>
            addr.id === savedAddress.id
              ? savedAddress
              : addr
          )
        );
      } else {
        setAddresses((prev) => [
          ...prev,
          savedAddress,
        ]);
      }

      setAddress(savedAddress);

      setShowAddressPopup(false);

      setTempAddress({
        name: '',
        street: '',
        city: '',
        zip: '',
        phone: '',
      });
    } catch (error) {
      console.error(
        'Error saving address:',
        error
      );

      alert(
        'Error saving your address. Please try again.'
      );
    }
  };

  // --------------------------------------------------
  // PLACE ORDER
  // --------------------------------------------------

  const handleOrder = async () => {
    const token =
      localStorage.getItem('authToken');

    if (!token) {
      navigate(
        `/login?redirect=${window.location.pathname}`
      );
      return;
    }

    if (!paymentMethod) {
      alert(
        'Please select a payment method'
      );
      return;
    }

    /*
     * Product cart:
     * use normal saved delivery address.
     *
     * Service cart:
     * address is already stored inside each
     * service item as serviceAddress.
     */
    if (
  !isTakeaway &&
  (addresses.length === 0 || !address)
) {
      alert(
        'Please add your delivery address before placing the order.'
      );

      setShowAddressPopup(true);

      return;
    }

    // ------------------------------------------------
    // COMMON ORDER DATA
    // ------------------------------------------------

    const orderData = {
      items: items.map((i) => ({
        id: i.id,

        name: i.name,

        price: i.price,

        quantity: i.quantity,

        image: i.image,

        shopId:
          i.shopId ??
          i.shop_id,

        // ------------------------------
        // PRODUCT FIELDS
        // ------------------------------

        unit_id:
          i.unit_id ?? null,

        unit_type:
          i.unit_type ?? null,

        size:
          i.size ?? null,

        color:
          i.color ?? null,

        unit:
          i.unit ?? null,

        // ------------------------------
        // SERVICE FIELDS
        // ------------------------------

        cartType:
          i.cartType ?? null,

        serviceId:
          i.serviceId ?? null,

        serviceName:
          i.serviceName ?? null,

        appointmentDate:
          i.appointmentDate ?? null,

        appointmentTime:
          i.appointmentTime ?? null,

        requirements:
          i.requirements ?? null,

        pricingType:
          i.pricingType ?? null,
      })),

      total,

      /*
       * Service order does not use the
       * product delivery address.
       */
      address: isTakeaway ? null : address,

      paymentMethod,

      takeaway:
        isServiceCart
          ? false
          : isTakeaway,

      orderDate:
        new Date().toISOString(),
    };

    // --------------------------------------------------
    // ONLINE PAYMENT
    // --------------------------------------------------

    if (
      paymentMethod === 'online'
    ) {
      try {
        const razorRes =
          await fetch(
            `${API_BASE_URL}/api/razorpay/create-order`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                amount: total,
              }),
            }
          );

        const razorOrder =
          await razorRes.json();

        if (!razorOrder.id) {
          throw new Error(
            'Failed to create Razorpay order'
          );
        }

        const options = {
          key:
            'rzp_live_MkghgTdJwmhcuO',

          amount:
            razorOrder.amount,

          currency: 'INR',

          name:
            'ConnectFree4U',

          description:
            'Order Payment',

          order_id:
            razorOrder.id,

          handler:
            async (response) => {
              try {
                // ------------------------------
                // VERIFY PAYMENT
                // ------------------------------

                const verifyRes =
                  await fetch(
                    `${API_BASE_URL}/api/razorpay/verify-payment`,
                    {
                      method: 'POST',

                      headers: {
                        'Content-Type':
                          'application/json',

                        Authorization:
                          `Bearer ${token}`,
                      },

                      body:
                        JSON.stringify(
                          response
                        ),
                    }
                  );

                const verifyResult =
                  await verifyRes.json();

                if (
                  !verifyResult.success
                ) {
                  alert(
                    'Payment verification failed'
                  );

                  return;
                }

                // ------------------------------
                // CREATE ORDER
                // ------------------------------

                const orderResponse =
                  await fetch(
                    `${API_BASE_URL}/api/orders`,
                    {
                      method: 'POST',

                      headers: {
                        'Content-Type':
                          'application/json',

                        Authorization:
                          `Bearer ${token}`,
                      },

                      body:
                        JSON.stringify(
                          orderData
                        ),
                    }
                  );

                const result =
                  await orderResponse.json();

                if (!orderResponse.ok) {
                  throw new Error(
                    result.error ||
                      'Order creation failed'
                  );
                }

                const fullOrder = {
                  ...orderData,
                  orderId:
                    result.orderId,
                };

                localStorage.setItem(
                  'orderSummary',
                  JSON.stringify(
                    fullOrder
                  )
                );

                navigate(
                  '/order-summary'
                );
              } catch (err) {
                console.error(
                  '[RazorpayHandler] Error:',
                  err
                );

                alert(
                  'Order failed after payment. Please contact support.'
                );
              }
            },

          prefill: {
            name:
              user?.name || '',

            contact:
              user?.mobile || '',
          },

          theme: {
            color: '#3399cc',
          },
        };

        const rzp =
          new window.Razorpay(
            options
          );

        rzp.open();

        return;
      } catch (err) {
        console.error(
          '[Razorpay] Payment flow error:',
          err
        );

        alert(
          'Something went wrong during payment. Please try again.'
        );

        return;
      }
    }

    // --------------------------------------------------
    // COD FLOW
    // --------------------------------------------------

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/orders`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                orderData
              ),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to place order'
        );
      }

      const fullOrder = {
        ...orderData,
        orderId:
          result.orderId,
      };

      localStorage.setItem(
        'orderSummary',
        JSON.stringify(
          fullOrder
        )
      );

      navigate(
        '/order-summary'
      );
    } catch (error) {
      console.error(
        '[handleOrder] COD flow error:',
        error
      );

      alert(
        'Failed to place order. Please try again.'
      );
    }
  };

  // --------------------------------------------------
  // QUANTITY CHANGE
  // --------------------------------------------------

const handleQtyChange = (item, delta) => {
  const newQty = item.quantity + delta;

  if (newQty <= 0) {
    addToCart(item, -item.quantity);
    return;
  }

  const diff = newQty - item.quantity;

  addToCart(item, diff);
};

  // --------------------------------------------------
  // LOADING / EMPTY
  // --------------------------------------------------

  if (!cartLoaded) {
    return (
      <div className="order-page">
        <h2>
          Loading cart...
        </h2>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="order-page">
        <h2>
          No items in cart to order.
        </h2>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="order-page">

      <h1>
        🧺 Your Cart
      </h1>

      <div className="order-list">

        {items.map((item) => {
          const firstImage =
            parseImageList(
              item.image
            )[0] || '';

          return (
            <div
              key={item.id}
              className="order-row"
            >

              {/* IMAGE */}

              <img
                src={resolveImageUrl(
                  firstImage
                )}
                alt={item.name}
                className="order-img"
                onClick={() =>
                  setSelectedItem(item)
                }
              />

              {/* DETAILS */}

              <div className="order-details">

                <h3>
                  {item.name}

                  {!isServiceCart &&
                    (
                      item.size ||
                      item.color ||
                      item.unit
                    ) && (
                      <span className="unit-label">
                        {' '}
                        (
                        {[
                          item.size
                            ? (
                                item.size.name ||
                                item.size
                              )
                            : null,

                          item.color
                            ? (
                                item.color.name ||
                                item.color
                              )
                            : null,

                          item.unit
                            ? (
                                item.unit.name ||
                                item.unit
                              )
                            : null,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        )
                      </span>
                    )}
                </h3>

                {/* -------------------------------- */}
                {/* SERVICE DETAILS                   */}
                {/* -------------------------------- */}

                {isServiceCart ? (

                  <div className="order-service-details">

                    {item.appointmentDate && (
                      <div>
                        📅{' '}
                        <strong>
                          Date:
                        </strong>{' '}
                        {item.appointmentDate}
                      </div>
                    )}

                    {item.appointmentTime && (
                      <div>
                        ⏰{' '}
                        <strong>
                          Time:
                        </strong>{' '}
                        {item.appointmentTime}
                      </div>
                    )}

                    {item.serviceAddress && (
                      <div>
                        📍{' '}
                        <strong>
                          Service Address:
                        </strong>{' '}
                        {item.serviceAddress}
                      </div>
                    )}

                    {item.requirements && (
                      <div>
                        📝{' '}
                        <strong>
                          Requirements:
                        </strong>{' '}
                        {item.requirements}
                      </div>
                    )}

                    <div className="order-service-quantity">
  <div className="qty-controls">
    <button
      onClick={() => handleQtyChange(item, -1)}
    >
      −
    </button>

    <span>{item.quantity}</span>

    <button
      onClick={() => handleQtyChange(item, 1)}
    >
      +
    </button>
  </div>
</div>

                  </div>

                ) : (

                  /* -------------------------------- */
                  /* PRODUCT QUANTITY                  */
                  /* -------------------------------- */

                  <div className="qty-controls">

                    <button
                      onClick={() =>
                        handleQtyChange(
                          item,
                          -1
                        )
                      }
                    >
                      −
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        handleQtyChange(
                          item,
                          1
                        )
                      }
                    >
                      +
                    </button>

                  </div>
                )}

              </div>

              {/* PRICE */}

              <div className="order-price">
                ₹
                {(
                  Number(item.price || 0) *
                  Number(item.quantity || 0)
                ).toFixed(2)}
              </div>

            </div>
          );
        })}

      </div>

      {/* TOTAL */}

      <div className="order-total">

        <h2>
          Total: ₹
          {total.toFixed(2)}
        </h2>

      </div>

      {/* -------------------------------------------- */}
{/* ADDRESS                                      */}
{/* -------------------------------------------- */}

{!isServiceCart && isTakeaway ? (

  <div
    className="takeaway-info"
    style={{
      marginBottom: '1em',
      color: 'blue',
    }}
  >
    <strong>
      Your order total is less than ₹
      {minOrderValue}
    </strong>

    {' — '}

    please pick it up from the shop
    and pay there.
  </div>

) : addresses.length > 0 ? (

  <div className="address-list">

    <h3>
      {isServiceCart
        ? 'Select Service Address'
        : 'Select Delivery Address'}
    </h3>

    {addresses.map((addr) => (

      <div
        key={addr.id}
        className="address-item-wrapper"
      >

        <label className="address-item">

          <input
            type="radio"
            name="selectedAddress"
            value={addr.id}
            checked={
              address?.id === addr.id
            }
            onChange={() =>
              setAddress(addr)
            }
          />

          <div>
            {addr.name},{' '}
            {addr.street},{' '}
            {addr.city} -{' '}
            {addr.zip}

            <br />

            Phone:{' '}
            {addr.phone}
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
        setTempAddress({
          name: '',
          street: '',
          city: '',
          zip: '',
          phone: '',
        });

        setShowAddressPopup(true);
      }}
    >
      ➕ Add New Address
    </button>

  </div>

) : (

  initialAddressLoadComplete && (

    <button
      onClick={() =>
        setShowAddressPopup(true)
      }
    >
      {isServiceCart
        ? 'Add Service Address'
        : 'Add Delivery Address'}
    </button>

  )

)}

      {/* -------------------------------------------- */}
      {/* MIN ORDER WARNING                            */}
      {/* -------------------------------------------- */}

      {!isServiceCart &&
        showMinOrderWarning &&
        !isTakeaway && (

          <div
            className="min-order-warning"
            style={{
              color: 'red',
              marginBottom: '1em',
            }}
          >
            Minimum order value for
            delivery is ₹
            {minOrderValue}.
          </div>

        )}

      {/* -------------------------------------------- */}
      {/* PAYMENT                                      */}
      {/* -------------------------------------------- */}

      <div className="payment-options">

        <h3>
          Choose Payment Method
        </h3>

        <label>

          <input
            type="radio"
            value="cod"
            checked={
              paymentMethod === 'cod'
            }
            onChange={() =>
              setPaymentMethod(
                'cod'
              )
            }
          />

          Cash on Delivery (COD)

        </label>

        <label>

          <input
            type="radio"
            value="online"
            checked={
              paymentMethod === 'online'
            }
            disabled={
              isOnlinePaymentDisabled
            }
            onChange={() =>
              setPaymentMethod(
                'online'
              )
            }
          />

          Pay Online
          {' '}
          (Online payment isn't
          available for this store —
          the store needs to contact
          via Call/Email.)

        </label>

      </div>

      {/* PLACE ORDER */}

      <button
        className="order-button"
        onClick={handleOrder}
      >
        Place Order
      </button>

      {/* ADDRESS POPUP */}

      {showAddressPopup && (

        <AddressPopup
          tempAddress={
            tempAddress
          }

          setTempAddress={
            setTempAddress
          }

          onClose={() =>
            setShowAddressPopup(
              false
            )
          }

          onSubmit={
            handleAddressSubmit
          }
        />

      )}

      {/* -------------------------------------------- */}
      {/* ITEM DETAILS MODAL                           */}
      {/* -------------------------------------------- */}

      {selectedItem && (

        <div
          className="modal-backdrop"
          onClick={() =>
            setSelectedItem(null)
          }
        >

          <div
            className="modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h2>
              {selectedItem.name}
            </h2>

            {!isServiceCart &&
              (
                selectedItem.size ||
                selectedItem.color ||
                selectedItem.unit
              ) && (

                <div
                  style={{
                    marginBottom: '1em',
                  }}
                >

                  {[
                    selectedItem.size
                      ? (
                          selectedItem.size.name ||
                          selectedItem.size
                        )
                      : null,

                    selectedItem.color
                      ? (
                          selectedItem.color.name ||
                          selectedItem.color
                        )
                      : null,

                    selectedItem.unit
                      ? (
                          selectedItem.unit.name ||
                          selectedItem.unit
                        )
                      : null,
                  ]
                    .filter(Boolean)
                    .join(', ')}

                </div>

              )}

            <img
              src={resolveImageUrl(
                parseImageList(
                  selectedItem.image
                )[0] || ''
              )}
              alt={
                selectedItem.name
              }
            />

            <p>
              Price: ₹
              {selectedItem.price}
            </p>

            {isServiceCart ? (

              <>
                {selectedItem.appointmentDate && (
                  <p>
                    📅 Date:{' '}
                    {
                      selectedItem.appointmentDate
                    }
                  </p>
                )}

                {selectedItem.appointmentTime && (
                  <p>
                    ⏰ Time:{' '}
                    {
                      selectedItem.appointmentTime
                    }
                  </p>
                )}

                {selectedItem.serviceAddress && (
                  <p>
                    📍 Service Address:{' '}
                    {
                      selectedItem.serviceAddress
                    }
                  </p>
                )}

                {selectedItem.requirements && (
                  <p>
                    📝 Requirements:{' '}
                    {
                      selectedItem.requirements
                    }
                  </p>
                )}
              </>

            ) : (

              <p>
                Description:{' '}
                {
                  selectedItem.description ||
                  'No description available'
                }
              </p>

            )}

            <button
              onClick={() =>
                setSelectedItem(
                  null
                )
              }
            >
              Close
            </button>

          </div>

        </div>

      )}

    </div>
  );
};

export default Order;