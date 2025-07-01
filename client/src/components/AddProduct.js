import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from './BarcodeScanner';
import './AddProduct.css';

const categoryOptions = {
  Fresh: ['Fresh Fruits', 'Mangoes & Melons', 'Plants & Gardening', 'Fresh Vegetables', 'Exotics & Premium', 'Leafy, Herbs & Seasonings', 'Organics & Hydroponics', 'Flowers & Leaves', 'Cuts & Sprouts', 'Dried & Dehydrated'],
  Dairy: ['Milk', 'Cheese', 'Yogurt'],
  Bakery: ['Breads', 'Cakes', 'Cookies'],
  Beverages: ['Tea', 'Coffee', 'Juice'],
};

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const AddProduct = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [unitList, setUnitList] = useState([]);
  const [addingNewUnit, setAddingNewUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    barcode: '',
    category: '',
    subcategory: '',
    unit: '',
    unitPrice: '',
    unitStock: '',
    image: null,
  });

  // 🔄 Load units on mount
  useEffect(() => {
    const fetchUnits = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/units`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setUnitList(data);
      } catch (err) {
        console.error('Failed to load units:', err);
      }
    };

    fetchUnits();
  }, []);

  // 🧩 Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProductData((prev) => ({ ...prev, image: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  // ➕ Add unit dynamically
  const handleAddNewUnit = async () => {
    if (!newUnitName.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newUnitName }),
      });

      if (res.ok) {
        const newUnit = await res.json();
        setUnitList((prev) => [...prev, newUnit]);
        setProductData((prev) => ({ ...prev, unit: newUnit.name }));
        setNewUnitName('');
        setAddingNewUnit(false);
      } else {
        alert('❌ Failed to add unit');
      }
    } catch (err) {
      console.error('Error adding unit:', err);
    }
  };

  // ✅ Final submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    // Validate required fields
    if (!productData.subcategory) {
      alert('Please select a subcategory.');
      return;
    }

    const formData = new FormData();
    for (const key in productData) {
      if (productData[key]) {
        formData.append(key, productData[key]);
      }
    }

    formData.append('shop_id', user.shop_id);

    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('✅ Product added successfully!');
        navigate('/demo/products');
      } else {
        const error = await response.json();
        alert(error.message || '❌ Failed to add product');
      }
    } catch (err) {
      console.error('Add product error:', err);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="add-product-container">
      <h2>➕ Add New Product</h2>
      <form onSubmit={handleSubmit} className="add-product-form" encType="multipart/form-data">
        {/* Product Name */}
        <label htmlFor="name">Product Name <span className="required">*</span></label>
        <input type="text" name="name" value={productData.name} onChange={handleInputChange} required />

        {/* Description */}
        <label htmlFor="description">Description</label>
        <textarea name="description" value={productData.description} onChange={handleInputChange} />

        {/* Price */}
        <label htmlFor="price">Price <span className="required">*</span></label>
        <input type="number" name="price" value={productData.price} onChange={handleInputChange} required />

        {/* Stock */}
        <label htmlFor="stock">Stock <span className="required">*</span></label>
        <input type="number" name="stock" value={productData.stock} onChange={handleInputChange} required />

        {/* Barcode + Scanner */}
        <label htmlFor="barcode">Barcode (Optional)</label>
        <input type="text" name="barcode" value={productData.barcode} onChange={handleInputChange} />
        <button type="button" onClick={() => setShowScanner(!showScanner)} className="barcode-btn">
          {showScanner ? '📷 Close Scanner' : '📷 Scan Barcode'}
        </button>
        {showScanner && (
          <BarcodeScanner
            onScanSuccess={(scannedCode) => {
              setProductData((prev) => ({ ...prev, barcode: scannedCode }));
              setShowScanner(false);
            }}
          />
        )}

        {/* Category */}
        <label htmlFor="category">Category <span className="required">*</span></label>
        <select
          name="category"
          value={productData.category}
          onChange={(e) =>
            setProductData((prev) => ({
              ...prev,
              category: e.target.value,
              subcategory: '',
            }))
          }
          required
        >
          <option value="">-- Select Category --</option>
          {Object.keys(categoryOptions).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Subcategory (mandatory) */}
        <label htmlFor="subcategory">Subcategory <span className="required">*</span></label>
        <select
          name="subcategory"
          value={productData.subcategory}
          onChange={handleInputChange}
          disabled={!productData.category}
          required
        >
          <option value="">-- Select Subcategory --</option>
          {productData.category &&
            categoryOptions[productData.category]?.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
        </select>

        {/* Unit & Add Unit Button */}
        <label htmlFor="unit">Unit <span className="required">*</span></label>
        <div className="unit-input">
          <select name="unit" value={productData.unit} onChange={handleInputChange} required>
            <option value="">-- Select Unit --</option>
            {unitList.map((unit) => (
              <option key={unit.id} value={unit.name}>{unit.name}</option>
            ))}
          </select>
          <button type="button" onClick={() => setAddingNewUnit(!addingNewUnit)}>➕ Add Unit</button>
        </div>

        {addingNewUnit && (
          <div className="new-unit-form">
            <input
              type="text"
              placeholder="New Unit Name"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
            />
            <button type="button" onClick={handleAddNewUnit}>Save Unit</button>
          </div>
        )}

        {/* Unit price & stock */}
        <label htmlFor="unitPrice">Unit Price</label>
        <input type="number" name="unitPrice" value={productData.unitPrice} onChange={handleInputChange} />

        <label htmlFor="unitStock">Unit Stock</label>
        <input type="number" name="unitStock" value={productData.unitStock} onChange={handleInputChange} />

        {/* Image upload */}
        <label htmlFor="image">Product Image</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {previewImage && (
          <img src={previewImage} alt="Preview" className="preview-image" />
        )}

        <button type="submit" className="submit-btn">📦 Add Product</button>
      </form>
    </div>
  );
};

export default AddProduct;
