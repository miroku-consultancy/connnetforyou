import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import './AddProduct.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const UpdateProduct = () => {
  const { user } = useUser();
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    barcode: '',
    category: '',
    subcategory: '',
    image: null,
  });

  const [existingImage, setExistingImage] = useState('');
  const [unitList, setUnitList] = useState([]);
  const [productUnits, setProductUnits] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [newUnit, setNewUnit] = useState({ name: '', price: '', stock: '' });

  // Load all available units
  useEffect(() => {
    const fetchUnits = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const res = await fetch(`${API_BASE_URL}/api/units`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setAllUnits(data);
      } catch (err) {
        console.error('Error fetching units:', err);
      }
    };
    fetchUnits();
  }, []);

  // Load product details
  useEffect(() => {
    const fetchProduct = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProductData({
          name: data.name,
          description: data.description,
          price: data.price,
          stock: data.stock,
          barcode: data.barcode,
          category: data.category,
          subcategory: data.subcategory,
          image: null,
        });
        setProductUnits(data.units);
        setExistingImage(data.image || '');
      } catch (err) {
        console.error('Error loading product:', err);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProductData((prev) => ({ ...prev, image: file }));
  };

  const handleUnitChange = (index, field, value) => {
    const updated = [...productUnits];
    updated[index][field] = value;
    setProductUnits(updated);
  };

  const handleAddNewUnit = () => {
    if (!newUnit.name || !newUnit.price) return;
    setProductUnits([...productUnits, { ...newUnit }]);
    setNewUnit({ name: '', price: '', stock: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    const formData = new FormData();
    for (const key in productData) {
      if (productData[key]) {
        formData.append(key, productData[key]);
      }
    }

    formData.append('shop_id', user.shop_id);
    formData.append('units', JSON.stringify(productUnits));

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('✅ Product updated successfully!');
        navigate('/demo/products');
      } else {
        const error = await response.json();
        alert(error.message || '❌ Failed to update product');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('An error occurred while updating.');
    }
  };

  return (
    <div className="add-product-container">
      <h2>✏️ Update Product</h2>
      <form onSubmit={handleSubmit} className="add-product-form" encType="multipart/form-data">
        <label>Product Name *</label>
        <input type="text" name="name" value={productData.name} onChange={handleInputChange} required />

        <label>Description</label>
        <textarea name="description" value={productData.description} onChange={handleInputChange} />

        <label>Category *</label>
        <input type="text" name="category" value={productData.category} onChange={handleInputChange} required />

        <label>Subcategory *</label>
        <input type="text" name="subcategory" value={productData.subcategory} onChange={handleInputChange} required />

        <label>Barcode</label>
        <input type="text" name="barcode" value={productData.barcode} onChange={handleInputChange} />

        <label>Main Price</label>
        <input type="number" name="price" value={productData.price} onChange={handleInputChange} />

        <label>Main Stock</label>
        <input type="number" name="stock" value={productData.stock} onChange={handleInputChange} />

        <label>Product Units</label>
        {(productUnits || []).map((unit, index) => (

          <div key={index} className="unit-block">
            <input
              type="text"
              value={unit.name}
              onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
              placeholder="Unit Name"
            />
            <input
              type="number"
              value={unit.price}
              onChange={(e) => handleUnitChange(index, 'price', e.target.value)}
              placeholder="Price"
            />
            <input
              type="number"
              value={unit.stock}
              onChange={(e) => handleUnitChange(index, 'stock', e.target.value)}
              placeholder="Stock"
            />
          </div>
        ))}

        <div className="new-unit-form">
          <input
            type="text"
            value={newUnit.name}
            onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
            placeholder="New Unit Name"
          />
          <input
            type="number"
            value={newUnit.price}
            onChange={(e) => setNewUnit({ ...newUnit, price: e.target.value })}
            placeholder="Price"
          />
          <input
            type="number"
            value={newUnit.stock}
            onChange={(e) => setNewUnit({ ...newUnit, stock: e.target.value })}
            placeholder="Stock"
          />
          <button type="button" onClick={handleAddNewUnit}>➕ Add Unit</button>
        </div>

        <label>Product Image</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {existingImage && !productData.image && (
          <img
            src={`${API_BASE_URL}/uploads/${existingImage}`}
            alt="Product"
            style={{ maxWidth: '150px', marginTop: '10px' }}
          />
        )}

        <button type="submit" className="submit-btn">💾 Save Changes</button>
      </form>
    </div>
  );
};

export default UpdateProduct;
