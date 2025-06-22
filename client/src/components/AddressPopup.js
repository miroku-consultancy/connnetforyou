import React from 'react';
import './AddressPopup.css';

const AddressPopup = ({ tempAddress, setTempAddress, onClose, onSubmit }) => {
  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Trim all fields before validation
    const trimmedAddress = {
      name: tempAddress.name.trim(),
      street: tempAddress.street.trim(),
      city: tempAddress.city.trim(),
      zip: tempAddress.zip.trim(),
      phone: tempAddress.phone.trim(),
      id: tempAddress.id, // keep id if editing existing address
    };
    setTempAddress(trimmedAddress);

    if (
      !trimmedAddress.name ||
      !trimmedAddress.street ||
      !trimmedAddress.city ||
      !trimmedAddress.zip ||
      !validatePhone(trimmedAddress.phone)
    ) {
      alert(
        'Please fill all fields correctly. Phone must be 10 digits starting with 6-9.'
      );
      return;
    }
    onSubmit(); // parent handles saving address
  };

  return (
    <div className="address-popup-overlay" onClick={onClose}>
      <div className="address-popup" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>Delivery Address</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={tempAddress.name}
            onChange={(e) =>
              setTempAddress({ ...tempAddress, name: e.target.value })
            }
            required
            autoFocus
          />
          <input
            type="text"
            placeholder="Street"
            value={tempAddress.street}
            onChange={(e) =>
              setTempAddress({ ...tempAddress, street: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="City"
            value={tempAddress.city}
            onChange={(e) =>
              setTempAddress({ ...tempAddress, city: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="ZIP Code"
            value={tempAddress.zip}
            onChange={(e) =>
              setTempAddress({ ...tempAddress, zip: e.target.value })
            }
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={tempAddress.phone}
            onChange={(e) =>
              setTempAddress({ ...tempAddress, phone: e.target.value })
            }
            required
            maxLength={10}
          />
          <button type="submit">Save Address</button>
        </form>
      </div>
    </div>
  );
};

export default AddressPopup;
