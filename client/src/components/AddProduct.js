import React, { useState } from 'react';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';
import './AddProduct.css'; // Add this if you want custom styling

const categoryOptions = {
  Fresh: [
    'Fresh Fruits',
    'Mangoes & Melons',
    'Plants & Gardening',
    'Fresh Vegetables',
    'Exotics & Premium',
    'Leafy, Herbs & Seasonings',
    'Organics & Hydroponics',
    'Flowers & Leaves',
    'Cuts & Sprouts',
    'Dried & Dehydrated',
  ],
  Dairy: ['Milk', 'Cheese', 'Yogurt'],
  Bakery: ['Breads', 'Cakes', 'Cookies'],
  Beverages: ['Tea', 'Coffee', 'Juice'],
};

const AddProduct = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: null,
    barcode: '',
    category: '',
    subcategory: '',
  });
  const [previewImage, setPreviewImage] = useState(null);

  const API_BASE_URL = 'https://connnet4you-server.onrender.com';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProductData((prev) => ({
      ...prev,
      image: file,
    }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    const formData = new FormData();
    for (const key in productData) {
      if (productData[key]) formData.append(key, productData[key]);
    }

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
        navigate('/products');
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
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit} className="add-product-form" encType="multipart/form-data">
        <label htmlFor="name">Product Name <span className="required">*</span></label>
        <input
          type="text"
          name="name"
          value={productData.name}
          onChange={handleInputChange}
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          name="description"
          value={productData.description}
          onChange={handleInputChange}
        />

        <label htmlFor="price">Price <span className="required">*</span></label>
        <input
          type="number"
          name="price"
          value={productData.price}
          onChange={handleInputChange}
          required
        />

        <label htmlFor="stock">Stock <span className="required">*</span></label>
        <input
          type="number"
          name="stock"
          value={productData.stock}
          onChange={handleInputChange}
          required
        />

        <label htmlFor="barcode">Barcode (Optional)</label>
        <input
          type="text"
          name="barcode"
          value={productData.barcode}
          onChange={handleInputChange}
        />

        <label htmlFor="category">Category <span className="required">*</span></label>
        <select
          name="category"
          value={productData.category}
          onChange={(e) =>
            setProductData((prev) => ({
              ...prev,
              category: e.target.value,
              subcategory: '', // reset subcategory
            }))
          }
          required
        >
          <option value="">-- Select Category --</option>
          {Object.keys(categoryOptions).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <label htmlFor="subcategory">Subcategory</label>
        <select
          name="subcategory"
          value={productData.subcategory}
          onChange={handleInputChange}
          disabled={!productData.category}
        >
          <option value="">-- Select Subcategory --</option>
          {productData.category &&
            categoryOptions[productData.category]?.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
        </select>

        <label htmlFor="image">Product Image</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            style={{ maxWidth: '150px', marginTop: '10px', borderRadius: '8px' }}
          />
        )}

        <button type="submit" className="submit-btn">➕ Add Product</button>
      </form>
    </div>
  );
};

export default AddProduct;
