import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BarcodeScanner from "./BarcodeScanner";
import { secondaryApiUrl } from "../config/apiConfig";
import "./EditProduct.css";

const EditProduct = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [unitList, setUnitList] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [categoryIdMap, setCategoryIdMap] = useState({});

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [subcategories, setSubcategories] = useState([]);

  const [addingNewUnit, setAddingNewUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");

  const [addingNewCategory, setAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [addingNewSubcategory, setAddingNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  const [previewImage, setPreviewImage] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  const [showScanner, setShowScanner] = useState(false);

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    barcode: "",
    unit: "",
    unitPrice: "",
    unitStock: "",
    image: null,
  });

  // ============================================================
  // AUTH
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("authToken");
  };

  // ============================================================
  // LOAD CATEGORIES + UNITS + PRODUCT
  // ============================================================

  useEffect(() => {
    const loadInitialData = async () => {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [unitsResponse, categoriesResponse, productResponse] =
          await Promise.all([
            fetch(`${secondaryApiUrl}/api/units`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),

            fetch(`${secondaryApiUrl}/api/categories`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),

            fetch(`${secondaryApiUrl}/api/products/${productId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        // --------------------------------------------------------
        // Units
        // --------------------------------------------------------

        if (unitsResponse.ok) {
          const unitsData = await unitsResponse.json();

          if (Array.isArray(unitsData)) {
            setUnitList(unitsData);
          }
        }

        // --------------------------------------------------------
        // Categories
        // --------------------------------------------------------

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();

          if (Array.isArray(categoriesData)) {
            setCategoryTree(categoriesData);

            const map = {};

            const flatten = (categories) => {
              categories.forEach((category) => {
                map[category.name] = category.id;

                if (Array.isArray(category.children)) {
                  flatten(category.children);
                }
              });
            };

            flatten(categoriesData);
            setCategoryIdMap(map);
          }
        }

        // --------------------------------------------------------
        // Product
        // --------------------------------------------------------

        if (!productResponse.ok) {
          const data = await productResponse.json().catch(() => ({}));

          throw new Error(
            data?.message || "Failed to load product"
          );
        }

        const product = await productResponse.json();

        console.log("[EditProduct] Loaded product:", product);

        // Existing image
        const imageUrl = getImageUrl(product.image);

        setExistingImage(imageUrl);
        setPreviewImage(imageUrl);

        // Product data
        setProductData({
          name: product.name || "",
          description: product.description || "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          barcode: product.barcode || "",

          unit:
            product.unit?.name ||
            product.unit_name ||
            product.variants?.[0]?.unit?.name ||
            "",

          unitPrice:
            product.unitPrice ??
            product.unit_price ??
            product.variants?.[0]?.price ??
            product.price ??
            "",

          unitStock:
            product.unitStock ??
            product.unit_stock ??
            product.variants?.[0]?.stock ??
            product.stock ??
            "",

          image: null,
        });

        // --------------------------------------------------------
        // Category
        // --------------------------------------------------------

        const categoryName =
          product.category_name ||
          product.category?.name ||
          "";

        if (categoryName) {
          setSelectedCategory(categoryName);
        }

        // If API returns category id, resolve it from category tree.
        if (product.category_id) {
          const found = findCategoryPath(
            categoryTree,
            Number(product.category_id)
          );

          if (found) {
            setSelectedCategory(found.parentName || found.name);
            setSelectedSubcategory(
              found.parentName ? found.name : ""
            );
          }
        }

        // Fallback if product contains subcategory directly.
        if (product.subcategory) {
          setSelectedSubcategory(
            typeof product.subcategory === "object"
              ? product.subcategory.name
              : product.subcategory
          );
        }
      } catch (err) {
        console.error("[EditProduct] Load error:", err);

        setError(
          err.message || "Failed to load product"
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [productId, navigate]);

  // ============================================================
  // FIND CATEGORY PATH
  // ============================================================

  const findCategoryPath = (categories, targetId, parentName = null) => {
    for (const category of categories || []) {
      if (Number(category.id) === Number(targetId)) {
        return {
          name: category.name,
          parentName,
        };
      }

      if (Array.isArray(category.children)) {
        const found = findCategoryPath(
          category.children,
          targetId,
          category.name
        );

        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  // ============================================================
  // IMAGE URL
  // ============================================================

  const getImageUrl = (image) => {
    if (!image) return null;

    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("blob:")
    ) {
      return image;
    }

    return `${secondaryApiUrl}/uploads/${image}`;
  };

  // ============================================================
  // CATEGORY CHANGE
  // ============================================================

  useEffect(() => {
    const category = categoryTree.find(
      (cat) => cat.name === selectedCategory
    );

    setSubcategories(category?.children || []);

    // Only clear when selected category actually changes
    if (
      category &&
      selectedSubcategory &&
      !category.children?.some(
        (child) => child.name === selectedSubcategory
      )
    ) {
      setSelectedSubcategory("");
    }
  }, [selectedCategory, categoryTree]);

  // ============================================================
  // INPUT
  // ============================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setProductData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // IMAGE
  // ============================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5 MB.");
      return;
    }

    setProductData((prev) => ({
      ...prev,
      image: file,
    }));

    const newPreview = URL.createObjectURL(file);

    setPreviewImage(newPreview);
  };

  const handleRemoveImage = () => {
    setProductData((prev) => ({
      ...prev,
      image: null,
    }));

    setPreviewImage(null);

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };

  // ============================================================
  // ADD UNIT
  // ============================================================

  const handleAddNewUnit = async () => {
    if (!newUnitName.trim()) {
      alert("Unit name required");
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(
        `${secondaryApiUrl}/api/units`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newUnitName.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add unit");
      }

      const newUnit = await response.json();

      setUnitList((prev) => [...prev, newUnit]);

      setProductData((prev) => ({
        ...prev,
        unit: newUnit.name,
      }));

      setNewUnitName("");
      setAddingNewUnit(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error adding unit");
    }
  };

  // ============================================================
  // ADD CATEGORY
  // ============================================================

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name required");
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(
        `${secondaryApiUrl}/api/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newCategoryName.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add category");
      }

      const newCategory = await response.json();

      setCategoryTree((prev) => [
        ...prev,
        {
          ...newCategory,
          children: newCategory.children || [],
        },
      ]);

      setCategoryIdMap((prev) => ({
        ...prev,
        [newCategory.name]: newCategory.id,
      }));

      setSelectedCategory(newCategory.name);
      setSelectedSubcategory("");

      setNewCategoryName("");
      setAddingNewCategory(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error adding category");
    }
  };

  // ============================================================
  // ADD SUBCATEGORY
  // ============================================================

  const handleAddSubcategory = async () => {
    if (!selectedCategory) {
      alert("Please select a category first.");
      return;
    }

    if (!newSubcategoryName.trim()) {
      alert("Subcategory name required");
      return;
    }

    const parentId = categoryIdMap[selectedCategory];

    if (!parentId) {
      alert("Invalid category selected.");
      return;
    }

    const token = getToken();

    try {
      const response = await fetch(
        `${secondaryApiUrl}/api/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newSubcategoryName.trim(),
            parent_id: parentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add subcategory");
      }

      const newSubcategory = await response.json();

      setCategoryTree((prev) =>
        prev.map((category) =>
          category.name === selectedCategory
            ? {
                ...category,
                children: [
                  ...(category.children || []),
                  newSubcategory,
                ],
              }
            : category
        )
      );

      setCategoryIdMap((prev) => ({
        ...prev,
        [newSubcategory.name]: newSubcategory.id,
      }));

      setSelectedSubcategory(newSubcategory.name);

      setNewSubcategoryName("");
      setAddingNewSubcategory(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error adding subcategory");
    }
  };

  // ============================================================
  // BARCODE
  // ============================================================

  const handleBarcodeDetected = (barcode) => {
    setProductData((prev) => ({
      ...prev,
      barcode,
    }));

    setShowScanner(false);
  };

  // ============================================================
  // UPDATE PRODUCT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (
      !productData.name.trim() ||
      !productData.price ||
      !productData.stock ||
      !selectedSubcategory ||
      !productData.unit
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const category_id =
      categoryIdMap[selectedSubcategory];

    if (!category_id) {
      alert("Invalid subcategory selected.");
      return;
    }

    const formData = new FormData();

    formData.append("name", productData.name);
    formData.append(
      "description",
      productData.description || ""
    );
    formData.append("price", productData.price);
    formData.append("stock", productData.stock);
    formData.append(
      "barcode",
      productData.barcode || ""
    );

    formData.append("unit", productData.unit);

    formData.append(
      "unitPrice",
      productData.unitPrice || productData.price
    );

    formData.append(
      "unitStock",
      productData.unitStock || productData.stock
    );

    formData.append("category_id", category_id);

    // Only send image when user selected a new one.
    if (productData.image) {
      formData.append("image", productData.image);
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${secondaryApiUrl}/api/products/${productId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to update product"
        );
      }

      alert("✅ Product updated successfully!");

      navigate("/my-product-store", {
        replace: true,
      });
    } catch (err) {
      console.error("[EditProduct] Update error:", err);

      setError(
        err.message || "Failed to update product"
      );

      alert(
        err.message ||
          "Failed to update product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="edit-product-page">
        <div className="edit-product-loading">
          <div className="edit-product-spinner" />
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="edit-product-page">

      {/* HEADER */}
      <div className="edit-product-header">
        <div>
          <button
            type="button"
            className="edit-product-back"
            onClick={() => navigate("/my-product-store")}
          >
            ← Back to Products
          </button>

          <h1>✏️ Edit Product</h1>

          <p>
            Update your product information, pricing,
            stock and image.
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="edit-product-error">
          ⚠️ {error}
        </div>
      )}

      <form
        className="edit-product-layout"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >

        {/* ======================================================
            LEFT COLUMN
        ======================================================= */}

        <div className="edit-product-main">

          {/* BASIC INFORMATION */}
          <section className="edit-product-card">

            <div className="edit-card-header">
              <div>
                <h2>Basic Information</h2>
                <p>Update your product details.</p>
              </div>
            </div>

            <div className="edit-form-grid">

              <div className="edit-field edit-field-full">
                <label>
                  Product Name
                  <span className="required">*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={productData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="edit-field edit-field-full">
                <label>Description</label>

                <textarea
                  name="description"
                  value={productData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product..."
                  rows="5"
                />
              </div>

            </div>
          </section>

          {/* CATEGORY */}
          <section className="edit-product-card">

            <div className="edit-card-header">
              <div>
                <h2>Category</h2>
                <p>Choose where this product belongs.</p>
              </div>
            </div>

            <div className="edit-form-grid">

              <div className="edit-field">
                <label>
                  Category
                  <span className="required">*</span>
                </label>

                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory("");
                  }}
                  required
                >
                  <option value="">
                    -- Select Category --
                  </option>

                  {categoryTree.map((category) => (
                    <option
                      key={category.id}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="inline-add-btn"
                  onClick={() =>
                    setAddingNewCategory(
                      !addingNewCategory
                    )
                  }
                >
                  + Add Category
                </button>
              </div>

              <div className="edit-field">
                <label>
                  Subcategory
                  <span className="required">*</span>
                </label>

                <select
                  value={selectedSubcategory}
                  onChange={(e) =>
                    setSelectedSubcategory(
                      e.target.value
                    )
                  }
                  required
                  disabled={!selectedCategory}
                >
                  <option value="">
                    -- Select Subcategory --
                  </option>

                  {subcategories.map((subcategory) => (
                    <option
                      key={subcategory.id}
                      value={subcategory.name}
                    >
                      {subcategory.name}
                    </option>
                  ))}
                </select>

                {selectedCategory && (
                  <button
                    type="button"
                    className="inline-add-btn"
                    onClick={() =>
                      setAddingNewSubcategory(
                        !addingNewSubcategory
                      )
                    }
                  >
                    + Add Subcategory
                  </button>
                )}
              </div>

            </div>

            {addingNewCategory && (
              <div className="inline-create-box">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) =>
                    setNewCategoryName(e.target.value)
                  }
                  placeholder="New category name"
                />

                <button
                  type="button"
                  onClick={handleAddCategory}
                >
                  Save
                </button>
              </div>
            )}

            {addingNewSubcategory && (
              <div className="inline-create-box">
                <input
                  type="text"
                  value={newSubcategoryName}
                  onChange={(e) =>
                    setNewSubcategoryName(
                      e.target.value
                    )
                  }
                  placeholder="New subcategory name"
                />

                <button
                  type="button"
                  onClick={handleAddSubcategory}
                >
                  Save
                </button>
              </div>
            )}

          </section>

          {/* PRICING & INVENTORY */}
          <section className="edit-product-card">

            <div className="edit-card-header">
              <div>
                <h2>Pricing & Inventory</h2>
                <p>Keep price and stock information updated.</p>
              </div>
            </div>

            <div className="edit-form-grid">

              <div className="edit-field">
                <label>
                  Price
                  <span className="required">*</span>
                </label>

                <div className="input-prefix">
                  <span>₹</span>

                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={productData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="edit-field">
                <label>
                  Stock
                  <span className="required">*</span>
                </label>

                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={productData.stock}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="edit-field">
                <label>
                  Unit
                  <span className="required">*</span>
                </label>

                <select
                  name="unit"
                  value={productData.unit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    -- Select Unit --
                  </option>

                  {unitList.map((unit) => (
                    <option
                      key={unit.id}
                      value={unit.name}
                    >
                      {unit.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="inline-add-btn"
                  onClick={() =>
                    setAddingNewUnit(!addingNewUnit)
                  }
                >
                  + Add Unit
                </button>
              </div>

              <div className="edit-field">
                <label>Unit Price</label>

                <div className="input-prefix">
                  <span>₹</span>

                  <input
                    type="number"
                    name="unitPrice"
                    min="0"
                    step="0.01"
                    value={productData.unitPrice}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="edit-field">
                <label>Unit Stock</label>

                <input
                  type="number"
                  name="unitStock"
                  min="0"
                  value={productData.unitStock}
                  onChange={handleInputChange}
                />
              </div>

            </div>

            {addingNewUnit && (
              <div className="inline-create-box">
                <input
                  type="text"
                  value={newUnitName}
                  onChange={(e) =>
                    setNewUnitName(e.target.value)
                  }
                  placeholder="New unit name"
                />

                <button
                  type="button"
                  onClick={handleAddNewUnit}
                >
                  Save
                </button>
              </div>
            )}

          </section>

          {/* BARCODE */}
          <section className="edit-product-card">

            <div className="edit-card-header">
              <div>
                <h2>Barcode</h2>
                <p>Update the product barcode if required.</p>
              </div>
            </div>

            <div className="barcode-row">

              <input
                type="text"
                name="barcode"
                value={productData.barcode}
                onChange={handleInputChange}
                placeholder="Enter or scan barcode"
              />

              <button
                type="button"
                className="scan-btn"
                onClick={() => setShowScanner(true)}
              >
                📷 Scan
              </button>

            </div>

          </section>

        </div>

        {/* ======================================================
            RIGHT COLUMN
        ======================================================= */}

        <aside className="edit-product-sidebar">

          {/* IMAGE */}
          <section className="edit-product-card image-card">

            <div className="edit-card-header">
              <div>
                <h2>Product Image</h2>
                <p>Replace the existing product image.</p>
              </div>
            </div>

            <div className="product-image-area">

              {previewImage ? (
                <div className="image-preview-wrapper">

                  <img
                    src={previewImage}
                    alt={productData.name || "Product"}
                    className="product-image-preview"
                  />

                  <div className="image-actions">

                    <button
                      type="button"
                      onClick={() =>
                        cameraInputRef.current?.click()
                      }
                    >
                      📷 Camera
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        galleryInputRef.current?.click()
                      }
                    >
                      🖼️ Replace
                    </button>

                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </button>

                  </div>

                </div>
              ) : (
                <div className="image-empty-state">

                  <div className="image-placeholder-icon">
                    🖼️
                  </div>

                  <h3>No product image</h3>

                  <p>
                    Add a clear image to help customers
                    recognize your product.
                  </p>

                  <div className="image-upload-buttons">

                    <button
                      type="button"
                      onClick={() =>
                        cameraInputRef.current?.click()
                      }
                    >
                      📷 Camera
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        galleryInputRef.current?.click()
                      }
                    >
                      🖼️ Gallery
                    </button>

                  </div>

                </div>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                hidden
              />

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                hidden
              />

            </div>

            <div className="image-help">
              <strong>Image guidelines</strong>

              <ul>
                <li>JPG, PNG or WebP</li>
                <li>Maximum 5 MB</li>
                <li>Use a clear product photo</li>
                <li>Square images work best</li>
              </ul>
            </div>

          </section>

          {/* CUSTOMER PREVIEW */}
          <section className="edit-product-card">

            <div className="edit-card-header">
              <div>
                <h2>Customer Preview</h2>
                <p>How the product will appear.</p>
              </div>
            </div>

            <div className="customer-product-preview">

              <div className="customer-preview-image">

                {previewImage ? (
                  <img
                    src={previewImage}
                    alt={productData.name}
                  />
                ) : (
                  <span>🖼️</span>
                )}

              </div>

              <div className="customer-preview-info">

                <h3>
                  {productData.name ||
                    "Product Name"}
                </h3>

                <p>
                  {selectedSubcategory ||
                    selectedCategory ||
                    "Category"}
                </p>

                <strong>
                  ₹
                  {productData.price
                    ? Number(
                        productData.price
                      ).toLocaleString("en-IN")
                    : "0"}
                </strong>

                <small>
                  {productData.stock || 0} in stock
                </small>

              </div>

            </div>

          </section>

          {/* TIPS */}
          <section className="edit-product-tips">

            <div className="tips-icon">💡</div>

            <div>
              <h3>Quick Tip</h3>

              <p>
                Keep product information accurate so
                customers always see the correct price
                and availability.
              </p>
            </div>

          </section>

        </aside>

      </form>

      {/* ACTION BAR */}
      <div className="edit-product-actions">

        <button
          type="button"
          className="cancel-btn"
          onClick={() =>
            navigate("/my-product-store")
          }
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="save-product-btn"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "💾 Save Changes"}
        </button>

      </div>

      {/* BARCODE SCANNER */}
      {showScanner && (
        <div className="scanner-overlay">

          <div className="scanner-modal">

            <div className="scanner-header">
              <h2>Scan Barcode</h2>

              <button
                type="button"
                onClick={() => setShowScanner(false)}
              >
                ✕
              </button>
            </div>

            <BarcodeScanner
              onDetected={handleBarcodeDetected}
              onClose={() => setShowScanner(false)}
            />

          </div>

        </div>
      )}

    </div>
  );
};

export default EditProduct;