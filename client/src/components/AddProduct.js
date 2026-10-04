import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import BarcodeScanner from "./BarcodeScanner";
import "./AddProduct.css";

const API_BASE_URL =
  "https://connnet4you-server.onrender.com";

const AddProduct = () => {
  const navigate = useNavigate();

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [unitList, setUnitList] = useState([]);

  const [categoryTree, setCategoryTree] = useState([]);
  const [categoryIdMap, setCategoryIdMap] = useState({});

  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [selectedSubcategory, setSelectedSubcategory] =
    useState("");

  const [subcategories, setSubcategories] =
    useState([]);

  const [addingNewUnit, setAddingNewUnit] =
    useState(false);

  const [newUnitName, setNewUnitName] =
    useState("");

  const [addingNewCategory, setAddingNewCategory] =
    useState(false);

  const [newCategoryName, setNewCategoryName] =
    useState("");

  const [addingNewSubcategory, setAddingNewSubcategory] =
    useState(false);

  const [newSubcategoryName, setNewSubcategoryName] =
    useState("");

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] =
    useState("");

  const [showScanner, setShowScanner] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    barcode: "",
    unit: "",
    unitPrice: "",
    unitStock: "",
  });

  // =========================================================
  // LOAD UNITS + CATEGORIES
  // =========================================================

  useEffect(() => {
    const token =
      localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    // -------------------------------------------------------
    // Units
    // -------------------------------------------------------

    fetch(`${API_BASE_URL}/api/units`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load units");
        }

        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setUnitList(data);
        }
      })
      .catch((err) => {
        console.error(
          "Failed to load units:",
          err
        );
      });

    // -------------------------------------------------------
    // Categories
    // -------------------------------------------------------

    fetch(`${API_BASE_URL}/api/categories`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(
            "Failed to load categories"
          );
        }

        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          return;
        }

        setCategoryTree(data);

        const map = {};

        const flatten = (categories) => {
          categories.forEach((category) => {
            map[category.name] =
              category.id;

            if (category.children) {
              flatten(category.children);
            }
          });
        };

        flatten(data);

        setCategoryIdMap(map);
      })
      .catch((err) => {
        console.error(
          "Failed to load categories:",
          err
        );
      });
  }, [navigate]);

  // =========================================================
  // SUBCATEGORIES
  // =========================================================

  useEffect(() => {
    const category =
      categoryTree.find(
        (cat) =>
          cat.name === selectedCategory
      );

    setSubcategories(
      category?.children || []
    );

    setSelectedSubcategory("");
  }, [
    selectedCategory,
    categoryTree,
  ]);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setProductData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // =========================================================
  // IMAGE HANDLING
  // =========================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5 MB."
      );
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setError("");

    setImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );

    // Allow selecting the same file again
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview("");
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // =========================================================
  // ADD UNIT
  // =========================================================

  const handleAddNewUnit = async () => {
    if (!newUnitName.trim()) {
      return alert("Unit name required");
    }

    const token =
      localStorage.getItem("authToken");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/units`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newUnitName.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Failed to add unit"
        );
      }

      setUnitList((prev) => [
        ...prev,
        data,
      ]);

      setProductData((prev) => ({
        ...prev,
        unit: data.name,
      }));

      setNewUnitName("");
      setAddingNewUnit(false);
    } catch (err) {
      console.error(
        "Error adding unit:",
        err
      );

      alert(
        err.message ||
          "Error adding unit"
      );
    }
  };

  // =========================================================
  // ADD CATEGORY
  // =========================================================

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      return alert(
        "Category name required"
      );
    }

    const token =
      localStorage.getItem("authToken");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newCategoryName.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Failed to add category"
        );
      }

      const newTreeItem = {
        ...data,
        children: [],
      };

      setCategoryTree((prev) => [
        ...prev,
        newTreeItem,
      ]);

      setCategoryIdMap((prev) => ({
        ...prev,
        [data.name]: data.id,
      }));

      setNewCategoryName("");
      setAddingNewCategory(false);

      setTimeout(() => {
        setSelectedCategory(
          data.name
        );
      }, 0);
    } catch (err) {
      console.error(
        "Error adding category:",
        err
      );

      alert(
        err.message ||
          "Error adding category"
      );
    }
  };

  // =========================================================
  // ADD SUBCATEGORY
  // =========================================================

  const handleAddSubcategory = async () => {
    if (
      !selectedCategory ||
      !newSubcategoryName.trim()
    ) {
      return alert(
        "Select a category and enter subcategory name"
      );
    }

    const parentId =
      categoryIdMap[selectedCategory];

    if (!parentId) {
      return alert(
        "Invalid category selected"
      );
    }

    const token =
      localStorage.getItem("authToken");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name:
              newSubcategoryName.trim(),
            parent_id: parentId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Failed to add subcategory"
        );
      }

      setCategoryTree((prev) =>
        prev.map((cat) =>
          cat.name === selectedCategory
            ? {
                ...cat,
                children: [
                  ...(cat.children || []),
                  data,
                ],
              }
            : cat
        )
      );

      setCategoryIdMap((prev) => ({
        ...prev,
        [data.name]: data.id,
      }));

      setSelectedSubcategory(
        data.name
      );

      setNewSubcategoryName("");
      setAddingNewSubcategory(false);
    } catch (err) {
      console.error(
        "Error adding subcategory:",
        err
      );

      alert(
        err.message ||
          "Error adding subcategory"
      );
    }
  };

  // =========================================================
  // SUBMIT PRODUCT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const token =
      localStorage.getItem("authToken");

    if (!token) {
      setError(
        "Please log in to add a product."
      );
      return;
    }

    if (!productData.name.trim()) {
      setError(
        "Please enter a product name."
      );
      return;
    }

    if (
      productData.price === "" ||
      Number(productData.price) < 0
    ) {
      setError(
        "Please enter a valid product price."
      );
      return;
    }

    if (
      productData.stock === "" ||
      Number(productData.stock) < 0
    ) {
      setError(
        "Please enter valid stock."
      );
      return;
    }

    if (!selectedSubcategory) {
      setError(
        "Please select a subcategory."
      );
      return;
    }

    if (!productData.unit) {
      setError(
        "Please select a unit."
      );
      return;
    }

    const category_id =
      categoryIdMap[
        selectedSubcategory
      ];

    if (!category_id) {
      setError(
        "Invalid subcategory selected."
      );
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "name",
      productData.name.trim()
    );

    formData.append(
      "description",
      productData.description
    );

    formData.append(
      "price",
      productData.price
    );

    formData.append(
      "stock",
      productData.stock
    );

    formData.append(
      "unit",
      productData.unit
    );

    formData.append(
      "category_id",
      category_id
    );

    if (productData.barcode) {
      formData.append(
        "barcode",
        productData.barcode
      );
    }

    if (productData.unitPrice !== "") {
      formData.append(
        "unitPrice",
        productData.unitPrice
      );
    }

    if (productData.unitStock !== "") {
      formData.append(
        "unitStock",
        productData.unitStock
      );
    }

    if (image) {
      formData.append(
        "image",
        image
      );
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/api/products`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to add product."
        );
      }

      console.log(
        "[AddProduct] Product created successfully",
        data
      );

      alert(
        "Product added successfully!"
      );

      navigate(
        "/my-product-store",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "[AddProduct] Submit error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while adding the product."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="add-product-page">

      {/* HEADER */}

      <div className="add-product-page-header">

        <div>
          <span className="add-product-eyebrow">
            JUSPING BUSINESS
          </span>

          <h1>
            Add a Product
          </h1>

          <p>
            Create a professional product
            listing and make it easy for
            customers to discover and buy.
          </p>
        </div>

        <button
          type="button"
          className="add-product-back-btn"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          ← Back
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="add-product-error">

          <div className="add-product-error-icon">
            !
          </div>

          <div>
            <strong>
              Please check the following
            </strong>

            <p>{error}</p>
          </div>

        </div>
      )}

      {/* FORM */}

      <form
        className="add-product-layout"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="add-product-main-column">

          {/* PRODUCT INFORMATION */}

          <section className="add-product-card">

            <div className="add-product-section-header">

              <div className="add-product-section-number">
                01
              </div>

              <div>
                <h2>
                  Product information
                </h2>

                <p>
                  Tell customers about the
                  product you are selling.
                </p>
              </div>

            </div>

            {/* NAME */}

            <div className="add-product-field">

              <label htmlFor="product-name">
                Product Name
                <span>*</span>
              </label>

              <input
                id="product-name"
                type="text"
                name="name"
                value={productData.name}
                onChange={handleInputChange}
                placeholder="e.g. Cotton Shirt, Basmati Rice"
                maxLength={200}
                required
              />

              <div className="add-product-field-hint">
                Use a clear product name
                customers can understand quickly.
              </div>

            </div>

            {/* DESCRIPTION */}

            <div className="add-product-field">

              <div className="add-product-label-row">

                <label htmlFor="product-description">
                  Description
                </label>

                <span>
                  {productData.description.length}
                  /1000
                </span>

              </div>

              <textarea
                id="product-description"
                name="description"
                value={productData.description}
                onChange={handleInputChange}
                placeholder="Describe the product, features, quality, material, etc."
                rows={6}
                maxLength={1000}
              />

              <div className="add-product-field-hint">
                Give customers useful
                information before they order.
              </div>

            </div>

            {/* CATEGORY */}

            <div className="add-product-field">

              <label htmlFor="product-category">
                Category
                <span>*</span>
              </label>

              <div className="add-product-inline-control">

                <select
                  id="product-category"
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  {categoryTree.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.name}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  className="add-product-secondary-btn"
                  onClick={() =>
                    setAddingNewCategory(
                      !addingNewCategory
                    )
                  }
                >
                  + Add
                </button>

              </div>

              {addingNewCategory && (
                <div className="add-product-inline-form">

                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) =>
                      setNewCategoryName(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      handleAddCategory
                    }
                  >
                    Save
                  </button>

                </div>
              )}

            </div>

            {/* SUBCATEGORY */}

            <div className="add-product-field">

              <label htmlFor="product-subcategory">
                Subcategory
                <span>*</span>
              </label>

              <div className="add-product-inline-control">

                <select
                  id="product-subcategory"
                  value={selectedSubcategory}
                  onChange={(e) =>
                    setSelectedSubcategory(
                      e.target.value
                    )
                  }
                  required
                  disabled={
                    !selectedCategory
                  }
                >
                  <option value="">
                    Select subcategory
                  </option>

                  {subcategories.map(
                    (subcategory) => (
                      <option
                        key={subcategory.id}
                        value={
                          subcategory.name
                        }
                      >
                        {subcategory.name}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  className="add-product-secondary-btn"
                  disabled={!selectedCategory}
                  onClick={() =>
                    setAddingNewSubcategory(
                      !addingNewSubcategory
                    )
                  }
                >
                  + Add
                </button>

              </div>

              {addingNewSubcategory && (
                <div className="add-product-inline-form">

                  <input
                    type="text"
                    placeholder="New subcategory name"
                    value={
                      newSubcategoryName
                    }
                    onChange={(e) =>
                      setNewSubcategoryName(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      handleAddSubcategory
                    }
                  >
                    Save
                  </button>

                </div>
              )}

            </div>

          </section>

          {/* PRICING & STOCK */}

          <section className="add-product-card">

            <div className="add-product-section-header">

              <div className="add-product-section-number">
                02
              </div>

              <div>
                <h2>
                  Pricing & inventory
                </h2>

                <p>
                  Set your product price,
                  stock and selling unit.
                </p>
              </div>

            </div>

            <div className="add-product-two-column">

              {/* PRICE */}

              <div className="add-product-field">

                <label htmlFor="product-price">
                  Product Price
                  <span>*</span>
                </label>

                <div className="add-product-price-input">

                  <span>₹</span>

                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={productData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />

                </div>

              </div>

              {/* STOCK */}

              <div className="add-product-field">

                <label htmlFor="product-stock">
                  Stock
                  <span>*</span>
                </label>

                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  step="1"
                  name="stock"
                  value={productData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />

              </div>

            </div>

            {/* UNIT */}

            <div className="add-product-field">

              <label htmlFor="product-unit">
                Unit
                <span>*</span>
              </label>

              <div className="add-product-inline-control">

                <select
                  id="product-unit"
                  name="unit"
                  value={productData.unit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Select unit
                  </option>

                  {unitList.map(
                    (unit) => (
                      <option
                        key={unit.id}
                        value={unit.name}
                      >
                        {unit.name}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  className="add-product-secondary-btn"
                  onClick={() =>
                    setAddingNewUnit(
                      !addingNewUnit
                    )
                  }
                >
                  + Add Unit
                </button>

              </div>

              {addingNewUnit && (
                <div className="add-product-inline-form">

                  <input
                    type="text"
                    placeholder="New unit name"
                    value={newUnitName}
                    onChange={(e) =>
                      setNewUnitName(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      handleAddNewUnit
                    }
                  >
                    Save
                  </button>

                </div>
              )}

            </div>

            {/* OPTIONAL UNIT DATA */}

            <div className="add-product-two-column">

              <div className="add-product-field">

                <label htmlFor="unit-price">
                  Unit Price
                </label>

                <div className="add-product-price-input">

                  <span>₹</span>

                  <input
                    id="unit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    name="unitPrice"
                    value={
                      productData.unitPrice
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Optional"
                  />

                </div>

              </div>

              <div className="add-product-field">

                <label htmlFor="unit-stock">
                  Unit Stock
                </label>

                <input
                  id="unit-stock"
                  type="number"
                  min="0"
                  step="1"
                  name="unitStock"
                  value={
                    productData.unitStock
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Optional"
                />

              </div>

            </div>

          </section>

          {/* BARCODE */}

          <section className="add-product-card">

            <div className="add-product-section-header">

              <div className="add-product-section-number">
                03
              </div>

              <div>
                <h2>
                  Product identification
                </h2>

                <p>
                  Add a barcode if your product
                  has one.
                </p>
              </div>

            </div>

            <div className="add-product-field">

              <label htmlFor="product-barcode">
                Barcode
              </label>

              <div className="add-product-barcode-row">

                <input
                  id="product-barcode"
                  type="text"
                  name="barcode"
                  value={
                    productData.barcode
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter or scan barcode"
                />

                <button
                  type="button"
                  className="add-product-scan-btn"
                  onClick={() =>
                    setShowScanner(
                      !showScanner
                    )
                  }
                >
                  {showScanner
                    ? "✕ Close"
                    : "📷 Scan Barcode"}
                </button>

              </div>

            </div>

            {showScanner && (
              <div className="add-product-scanner">

                <BarcodeScanner
                  onScanSuccess={(code) => {
                    setProductData(
                      (prev) => ({
                        ...prev,
                        barcode: code,
                      })
                    );

                    setShowScanner(false);
                  }}
                />

              </div>
            )}

          </section>

        </div>

        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <aside className="add-product-sidebar">

          {/* PRODUCT IMAGE */}

          <section className="add-product-card">

            <div className="add-product-section-header">

              <div>
                <h2>
                  Product image
                </h2>

                <p>
                  Add a clear image that
                  represents your product.
                </p>
              </div>

              <span className="add-product-section-number">
                04
              </span>

            </div>

            {/* CAMERA */}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={
                handleImageChange
              }
              hidden
            />

            {/* GALLERY */}

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                handleImageChange
              }
              hidden
            />

            {!imagePreview ? (
              <div className="product-image-upload-area">

                <div className="product-image-upload-icon">
                  ↑
                </div>

                <strong>
                  Add your product image
                </strong>

                <span>
                  Take a photo or choose
                  one from your gallery.
                </span>

                <div className="product-image-source-buttons">

                  <button
                    type="button"
                    onClick={() =>
                      cameraInputRef.current?.click()
                    }
                  >
                    <span>📷</span>
                    Take Photo
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      galleryInputRef.current?.click()
                    }
                  >
                    <span>🖼️</span>
                    Gallery
                  </button>

                </div>

                <small>
                  JPG, PNG or WEBP · Maximum
                  5 MB
                </small>

              </div>
            ) : (
              <div className="product-selected-image-area">

                <img
                  src={imagePreview}
                  alt="Product preview"
                />

                <div className="product-image-actions">

                  <button
                    type="button"
                    onClick={() =>
                      cameraInputRef.current?.click()
                    }
                  >
                    📷 Replace
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      galleryInputRef.current?.click()
                    }
                  >
                    🖼 Gallery
                  </button>

                  <button
                    type="button"
                    className="product-remove-image"
                    onClick={
                      handleRemoveImage
                    }
                  >
                    Remove
                  </button>

                </div>

              </div>
            )}

            <div className="product-image-help">

              <span>💡</span>

              <p>
                Clear product images help
                customers understand what
                they are buying.
              </p>

            </div>

          </section>

          {/* LIVE PREVIEW */}

          <section className="add-product-card">

            <div className="add-product-section-header">

              <div>
                <h2>
                  Customer preview
                </h2>

                <p>
                  See how your product may
                  appear to customers.
                </p>
              </div>

            </div>

            <div className="product-live-preview">

              <div className="product-preview-image">

                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                  />
                ) : (
                  <div className="product-preview-placeholder">
                    ✦
                  </div>
                )}

              </div>

              <div className="product-preview-content">

                <span className="product-preview-category">
                  {selectedSubcategory ||
                    "Product"}
                </span>

                <h3>
                  {productData.name ||
                    "Your product name"}
                </h3>

                <p>
                  {productData.description ||
                    "Your product description will appear here."}
                </p>

                <strong>
                  ₹
                  {productData.price
                    ? Number(
                        productData.price
                      ).toLocaleString(
                        "en-IN"
                      )
                    : "0"}
                </strong>

                {productData.stock !==
                  "" && (
                  <small>
                    Stock:{" "}
                    {productData.stock}
                  </small>
                )}

              </div>

            </div>

          </section>

          {/* TIPS */}

          <section className="add-product-tips">

            <strong>
              💡 Product listing tips
            </strong>

            <ul>
              <li>
                Use a clear product name.
              </li>

              <li>
                Add a good quality image.
              </li>

              <li>
                Keep stock information
                accurate.
              </li>

              <li>
                Use the correct category
                and unit.
              </li>
            </ul>

          </section>

          {/* ACTIONS */}

          <div className="add-product-actions">

            <button
              type="button"
              className="add-product-cancel-btn"
              onClick={() =>
                navigate(-1)
              }
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="add-product-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Adding Product..."
                : "📦 Add Product"}
            </button>

          </div>

        </aside>

      </form>

    </div>
  );
};

export default AddProduct;