import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import { useUser } from './UserContext';
import BluetoothPrinter from './BluetoothPrinter';
import './OrderSummary.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const MIN_ORDER_FOR_DELIVERY = 200;

// Parse image field to array of strings (handles string, array, or JSON string)
const parseImageList = (image) => {
  if (!image) return [];
  if (Array.isArray(image)) return image;

  try {
    const parsed = JSON.parse(image);

    if (Array.isArray(parsed)) return parsed;

    return [parsed];
  } catch {
    try {
      const cleanImage = image
        .trim()
        .replace(/^["']|["']$/g, '');

      const parsedAgain = JSON.parse(cleanImage);

      if (Array.isArray(parsedAgain)) return parsedAgain;

      return [parsedAgain];
    } catch {
      return [image];
    }
  }
};

// Resolve image URL with fallback to placeholder
const resolveImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/60';

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

const OrderSummary = () => {
  const [order, setOrder] = useState(null);
  const [showPrinter, setShowPrinter] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { clearCart } = useCart();

  const navigationHandled = useRef(false);

  const { user } = useUser();

  useEffect(() => {
    if (searchParams.get('success')) {
      alert(
        '✅ Payment successful! Thank you for your order.'
      );
    } else if (searchParams.get('canceled')) {
      alert(
        '❌ Payment was canceled. You can try again.'
      );
    }

    const saved =
      localStorage.getItem('orderSummary');

    if (saved) {
      try {
        const parsedOrder = JSON.parse(saved);

        setOrder(parsedOrder);
      } catch (err) {
        console.error(
          'Error parsing orderSummary from localStorage:',
          err
        );
      }
    }

    window.history.replaceState(
      { fromSummary: true },
      ''
    );

    const onPopState = (e) => {
      if (
        e.state?.fromSummary &&
        !navigationHandled.current
      ) {
        navigationHandled.current = true;

        clearCart();

        navigate('/products', {
          replace: true,
        });
      }
    };

    window.addEventListener(
      'popstate',
      onPopState
    );

    return () =>
      window.removeEventListener(
        'popstate',
        onPopState
      );
  }, [
    searchParams,
    clearCart,
    navigate,
  ]);

  const handleGoToProducts = () => {
  clearCart();

  navigate(
    isServiceOrder
      ? '/services'
      : '/products'
  );
};

  const handlePrint = () => {
    if (!order) {
      alert('No order data to print.');
      return;
    }

    setShowPrinter(true);
  };

  if (!order) {
    return (
      <div style={{ padding: '2rem' }}>
        Loading summary...
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * SERVICE ORDER DETECTION
   * --------------------------------------------------
   *
   * Product order:
   *   items contain product items.
   *
   * Service order:
   *   all items have cartType === "service".
   */
  const isServiceOrder =
    order.items?.length > 0 &&
    order.items.every(
      (item) => item.cartType === 'service'
    );

  /*
   * Product orders only use the minimum-order
   * delivery/takeaway rule.
   *
   * Service orders should NEVER become takeaway
   * just because the amount is below ₹200.
   */
  const isTakeawayOrder =
    !isServiceOrder &&
    Number(order.total) <
      MIN_ORDER_FOR_DELIVERY;

  const getOrderIdDisplay = () => {
    if (!order.orderId) return null;

    if (
      typeof order.orderId === 'object' &&
      order.orderId !== null
    ) {
      return (
        order.orderId.orderId ??
        JSON.stringify(order.orderId)
      );
    }

    return order.orderId;
  };

  const getItemPrice = (item) => {
    if (typeof item.price === 'string') {
      const p = parseFloat(item.price);

      return isNaN(p) ? 0 : p;
    }

    if (typeof item.price === 'number') {
      return item.price;
    }

    return 0;
  };

  const getItemQuantity = (item) => {
    if (typeof item.quantity === 'string') {
      const q = parseInt(
        item.quantity,
        10
      );

      return isNaN(q) ? 0 : q;
    }

    if (typeof item.quantity === 'number') {
      return item.quantity;
    }

    return 0;
  };

  return (
    <div className="order-summary">

      <h1>Order Summary</h1>

      {showPrinter && (
        <BluetoothPrinter order={order} />
      )}

      {/* ------------------------------------------------ */}
      {/* ORDER ID                                         */}
      {/* ------------------------------------------------ */}

      {order.orderId && (
        <h4>
          Order ID:{' '}
          <span>
            {getOrderIdDisplay()}
          </span>
        </h4>
      )}

      {/* ------------------------------------------------ */}
      {/* ORDER DATE                                       */}
      {/* ------------------------------------------------ */}

      <h3>
        Ordered On:{' '}
        <span>
          {new Date(
            order.orderDate
          ).toLocaleString()}
        </span>
      </h3>

      {/* ------------------------------------------------ */}
      {/* ORDER ITEMS                                      */}
      {/* ------------------------------------------------ */}

      <ul className="order-items">

        {order.items.map(
          (item, index) => {

            const price =
              getItemPrice(item);

            const quantity =
              getItemQuantity(item);

            const images =
              parseImageList(
                item.image
              );

            const firstImage =
              images[0] || '';

            const imageSrc =
              resolveImageUrl(
                firstImage
              );

            /*
             * Product variants.
             *
             * These should not be displayed
             * for service orders.
             */
            const variantLabels = [
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

              item.unit_type
                ? item.unit_type
                : null,
            ]
              .filter(Boolean)
              .join(', ');

            return (
              <li
                key={`${item.product_id || item.id}-${item.unit_type || ''}-${index}`}
                className="order-summary-item"
              >

                {/* IMAGE */}

                <img
                  src={imageSrc}
                  alt={item.name}
                  className="summary-image"
                  onError={(e) => {
                    e.currentTarget.onerror =
                      null;

                    e.currentTarget.src =
                      'https://via.placeholder.com/60';
                  }}
                />

                {/* ITEM DETAILS */}

                <div>

                  <strong>
                    {item.name}
                  </strong>

                  {/* PRODUCT VARIANTS */}

                  {!isServiceOrder &&
                    variantLabels && (
                      <span className="variant-label">
                        {' '}
                        ({variantLabels})
                      </span>
                    )}

                  <br />

                  {/* PRICE / QUANTITY */}

                  Qty: {quantity} × ₹
                  {price.toFixed(2)}

                  <br />

                  Total: ₹
                  {(quantity * price).toFixed(
                    2
                  )}

                  {/* ------------------------------------------------ */}
                  {/* SERVICE DETAILS                                  */}
                  {/* ------------------------------------------------ */}

                  {item.cartType ===
                    'service' && (

                    <div className="summary-service-details">

                      {item.appointmentDate && (
                        <div>
                          📅{' '}
                          <strong>
                            Date:
                          </strong>{' '}
                          {
                            item.appointmentDate
                          }
                        </div>
                      )}

                      {item.appointmentTime && (
                        <div>
                          ⏰{' '}
                          <strong>
                            Time:
                          </strong>{' '}
                          {
                            item.appointmentTime
                          }
                        </div>
                      )}

                      {item.serviceAddress && (
                        <div>
                          📍{' '}
                          <strong>
                            Service Address:
                          </strong>{' '}
                          {
                            item.serviceAddress
                          }
                        </div>
                      )}

                      {item.requirements && (
                        <div>
                          📝{' '}
                          <strong>
                            Requirements:
                          </strong>{' '}
                          {
                            item.requirements
                          }
                        </div>
                      )}

                    </div>
                  )}

                </div>

              </li>
            );
          }
        )}

      </ul>

      {/* ------------------------------------------------ */}
      {/* TOTAL                                            */}
      {/* ------------------------------------------------ */}

      <h3>
        Total Amount: ₹
        {Number(order.total).toFixed(2)}
      </h3>

      {/* ------------------------------------------------ */}
      {/* PAYMENT METHOD                                   */}
      {/* ------------------------------------------------ */}

      <h4>
        Payment Method:{' '}

        <span>
          {order.paymentMethod ===
          'cod'
            ? 'Cash on Delivery'
            : 'Online Payment'}
        </span>
      </h4>

      {/* ------------------------------------------------ */}
      {/* ORDER TYPE                                       */}
      {/* ------------------------------------------------ */}

      <h4>
        Order Type:{' '}

        <span>
          {isServiceOrder
            ? 'Service Booking'
            : isTakeawayOrder
            ? 'Takeaway'
            : 'Delivery'}
        </span>
      </h4>

      {/* ------------------------------------------------ */}
      {/* SERVICE ORDER DETAILS                            */}
      {/* ------------------------------------------------ */}

      {isServiceOrder ? (

        <div className="summary-address">

          <h4>
            Service Booking Details
          </h4>

          {order.items.map(
            (item, index) => (

              <div
                key={index}
                className="summary-service-address"
              >

                <strong>
                  {item.serviceName ||
                    item.name}
                </strong>

                {item.appointmentDate && (
                  <p>
                    📅 Date:{' '}
                    {
                      item.appointmentDate
                    }
                  </p>
                )}

                {item.appointmentTime && (
                  <p>
                    ⏰ Time:{' '}
                    {
                      item.appointmentTime
                    }
                  </p>
                )}

                {item.serviceAddress && (
                  <p>
                    📍 Address:{' '}
                    {
                      item.serviceAddress
                    }
                  </p>
                )}

                {item.requirements && (
                  <p>
                    📝 Requirements:{' '}
                    {
                      item.requirements
                    }
                  </p>
                )}

              </div>

            )
          )}

        </div>

      ) : !isTakeawayOrder ? (

        /* ------------------------------------------------ */
        /* PRODUCT DELIVERY ADDRESS                         */
        /* ------------------------------------------------ */

        <div className="summary-address">

          <h4>
            Delivering To:
          </h4>

          {order.address ? (

            <p>
              {order.address.name}
              <br />

              {order.address.street}
              <br />

              {order.address.city}
              {' – '}
              {order.address.zip}
              <br />

              Phone:{' '}
              {order.address.phone}
            </p>

          ) : (

            <p>
              No delivery address
              provided.
            </p>

          )}

        </div>

      ) : (

        /* ------------------------------------------------ */
        /* PRODUCT TAKEAWAY                                */
        /* ------------------------------------------------ */

        <div className="summary-address">

          <h4>
            Pickup / Takeaway Order
          </h4>

          <p>
            This order is a takeaway
            and does not require
            delivery.
          </p>

        </div>

      )}

      {/* ------------------------------------------------ */}
      {/* ACTIONS                                          */}
      {/* ------------------------------------------------ */}

      <div className="summary-actions">

        {/* Uncomment if you want printing support */}

        {/*
        <button
          className="print-btn"
          onClick={handlePrint}
        >
          🖨️ Print Receipt
        </button>
        */}

        <button
  className="go-to-products-btn"
  onClick={handleGoToProducts}
>
  {isServiceOrder
    ? '🔧 Go to Services'
    : '🛒 Go to Products'}
</button>

      </div>

    </div>
  );
};

export default OrderSummary;