import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from './BarcodeScanner';
import './AddProduct.css';

const API_BASE_URL = 'https://connnet4you-server.onrender.com';

const AddProduct = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [unitList, setUnitList] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [categoryIdMap, setCategoryIdMap] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const [addingNewUnit, setAddingNewUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  const [addingNewCategory, setAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [addingNewSubcategory, setAddingNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  const [previewImage, setPreviewImage] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    barcode: '',
    unit: '',
    unitPrice: '',
    unitStock: '',
    image: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Fetch units
    fetch(`${API_BASE_URL}/api/units`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUnitList(data);
      });

    // Fetch categories tree
    fetch(`${API_BASE_URL}/api/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('Invalid category response:', data);
          return;
        }

        setCategoryTree(data);
        const map = {};
        const flatten = (cats) => {
          if (!Array.isArray(cats)) return;
          cats.forEach(c => {
            map[c.name] = c.id;
            if (c.children && Array.isArray(c.children)) flatten(c.children);
          });
        };
        flatten(data);
        setCategoryIdMap(map);
      })
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProductData(prev => ({ ...prev, image: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleAddNewUnit = async () => {
    if (!newUnitName.trim()) return alert('Unit name required');
    const token = localStorage.getItem('authToken');
    try {
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
        setUnitList(prev => [...prev, newUnit]);
        setProductData(prev => ({ ...prev, unit: newUnit.name }));
        setNewUnitName('');
        setAddingNewUnit(false);
      } else {
        alert('❌ Failed to add unit');
      }
    } catch (err) {
      console.error('Error adding unit:', err);
      alert('Error adding unit');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return alert('Category name required');
    const token = localStorage.getItem('authToken');
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (res.ok) {
        const newCat = await res.json();
        setCategoryTree(prev => [...prev, { ...newCat, children: [] }]);
        setNewCategoryName('');
        setAddingNewCategory(false);
      } else {
        alert('❌ Failed to add category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Error adding category');
    }
  };

  const handleAddSubcategory = async () => {
    if (!selectedCategory || !newSubcategoryName.trim()) {
      return alert('Select a category and enter subcategory name');
    }

    const parentId = categoryIdMap[selectedCategory];
    const token = localStorage.getItem('authToken');

    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSubcategoryName, parent_id: parentId }),
      });

      if (res.ok) {
        const newSub = await res.json();
        setCategoryTree(prev =>
          prev.map(cat =>
            cat.name === selectedCategory
              ? { ...cat, children: [...(cat.children || []), newSub] }
              : cat
          )
        );
        setCategoryIdMap(prev => ({ ...prev, [newSub.name]: newSub.id }));
        setNewSubcategoryName('');
        setAddingNewSubcategory(false);
      } else {
        alert('❌ Failed to add subcategory');
      }
    } catch (err) {
      console.error('Error adding subcategory:', err);
      alert('Error adding subcategory');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    if (!productData.name || !productData.price || !productData.stock || !selectedSubcategory || !productData.unit) {
      return alert('Please fill in all required fields');
    }

    const category_id = categoryIdMap[selectedSubcategory];
    if (!category_id) return alert('Invalid subcategory selected');

    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    formData.append('category_id', category_id);

    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        alert('✅ Product added or updated successfully!');
        navigate('/demo/products');
      } else {
        const err = await res.json();
        alert(err.message || '❌ Failed to add product');
      }
    } catch (err) {
      console.error('Error submitting product:', err);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="add-product-container">
      <h2>➕ Add Product or Unit</h2>
      <form onSubmit={handleSubmit} className="add-product-form" encType="multipart/form-data">
        <label>Product Name <span className="required">*</span></label>
        <input type="text" name="name" value={productData.name} onChange={handleInputChange} required />

        <label>Description</label>
        <textarea name="description" value={productData.description} onChange={handleInputChange} />

        <label>Default Price <span className="required">*</span></label>
        <input type="number" name="price" value={productData.price} onChange={handleInputChange} required />

        <label>Default Stock <span className="required">*</span></label>
        <input type="number" name="stock" value={productData.stock} onChange={handleInputChange} required />

        <label>Barcode (optional)</label>
        <input type="text" name="barcode" value={productData.barcode} onChange={handleInputChange} />
        <button type="button" className="barcode-btn" onClick={() => setShowScanner(!showScanner)}>
          {showScanner ? '📷 Close Scanner' : '📷 Scan Barcode'}
        </button>
        {showScanner && (
          <BarcodeScanner
            onScanSuccess={(code) => {
              setProductData(prev => ({ ...prev, barcode: code }));
              setShowScanner(false);
            }}
          />
        )}

        <label>Category <span className="required">*</span></label>
        <div className="category-group">
          <select value={selectedCategory} onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory('');
          }} required>
            <option value="">-- Select Category --</option>
            {Array.isArray(categoryTree) && categoryTree.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <button type="button" onClick={() => setAddingNewCategory(!addingNewCategory)}>➕ Add Category</button>
        </div>
        {addingNewCategory && (
          <div className="new-unit-form">
            <input type="text" placeholder="New Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            <button type="button" onClick={handleAddCategory}>Save</button>
          </div>
        )}

        <label>Subcategory <span className="required">*</span></label>
        <div className="category-group">
          <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} required>
            <option value="">-- Select Subcategory --</option>
            {categoryTree.find(c => c.name === selectedCategory)?.children?.map(sub => (
              <option key={sub.id} value={sub.name}>{sub.name}</option>
            ))}
          </select>
          <button type="button" onClick={() => setAddingNewSubcategory(!addingNewSubcategory)}>➕ Add Subcategory</button>
        </div>
        {addingNewSubcategory && (
          <div className="new-unit-form">
            <input type="text" placeholder="New Subcategory Name" value={newSubcategoryName} onChange={(e) => setNewSubcategoryName(e.target.value)} />
            <button type="button" onClick={handleAddSubcategory}>Save</button>
          </div>
        )}

        <label>Unit <span className="required">*</span></label>
        <div className="unit-input">
          <select name="unit" value={productData.unit} onChange={handleInputChange} required>
            <option value="">-- Select Unit --</option>
            {unitList.map(unit => (
              <option key={unit.id} value={unit.name}>{unit.name}</option>
            ))}
          </select>
          <button type="button" onClick={() => setAddingNewUnit(!addingNewUnit)}>➕ Add Unit</button>
        </div>

        {addingNewUnit && (
          <div className="new-unit-form">
            <input type="text" placeholder="New Unit Name" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} />
            <button type="button" onClick={handleAddNewUnit}>Save</button>
          </div>
        )}

        <label>Unit Price (optional)</label>
        <input type="number" name="unitPrice" value={productData.unitPrice} onChange={handleInputChange} />

        <label>Unit Stock (optional)</label>
        <input type="number" name="unitStock" value={productData.unitStock} onChange={handleInputChange} />

        <label>Product Image</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {previewImage && <img src={previewImage} alt="Preview" className="preview-image" />}

        <button type="submit" className="submit-btn">📦 Submit Product</button>
      </form>
    </div>
  );
};

export default AddProduct;
