import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BarcodeScanner from "./BarcodeScanner";
import "./AddProduct.css";

const API_BASE_URL = "https://connnet4you-server.onrender.com";

/* 🔐 JWT parser */
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

const AddStock = () => {
  const navigate = useNavigate();
  const { shopSlug } = useParams(); // only for redirect

  const [shopId, setShopId] = useState(null);
  const [products, setProducts] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  /* searchable dropdown state */
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [stockData, setStockData] = useState({
    product_id: "",
    product_unit_id: "",
    qty: "",
    movement_type: "IN",
    reason: "",
    barcode: ""
  });

  /* ============================
     1️⃣ READ SHOP ID FROM JWT
  ============================ */
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const decoded = parseJwt(token);
    if (!decoded?.shop_id) {
      alert("Shop not linked to this account");
      navigate("/");
      return;
    }

    setShopId(decoded.shop_id);
  }, [navigate]);

  /* ============================
     2️⃣ LOAD PRODUCTS BY shopId
  ============================ */
  useEffect(() => {
    if (!shopId) return;

    fetch(`${API_BASE_URL}/api/products?shopId=${shopId}`)
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, [shopId]);

  /* ============================
     HELPERS
  ============================ */
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProduct = products.find(
    p => p.id === Number(stockData.product_id)
  );

  const variants = selectedProduct?.variants || [];

  const selectedUnit = variants.find(
    v => v.id === Number(stockData.product_unit_id)
  );

  /* ============================
     HANDLERS
  ============================ */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "product_id") {
      setStockData(prev => ({
        ...prev,
        product_id: value,
        product_unit_id: ""
      }));
      return;
    }

    setStockData(prev => ({ ...prev, [name]: value }));
  };

  /* ============================
     SUBMIT
  ============================ */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!stockData.product_unit_id || !stockData.qty) {
      alert("Unit and quantity required");
      return;
    }

    const qtyChange =
      stockData.movement_type === "OUT"
        ? -Math.abs(Number(stockData.qty))
        : Number(stockData.qty);

    const payload = {
      product_id: Number(stockData.product_id),
      product_unit_id: Number(stockData.product_unit_id),
      qty_change: qtyChange,
      movement_type: stockData.movement_type,
      reason: stockData.reason
    };

    console.log("📦 STOCK PAYLOAD", payload);

    alert("✅ Stock entry saved");
    navigate(`/${shopSlug}/products`);
  };

  /* ============================
     UI
  ============================ */
  return (
    <div className="add-product-container">
      <h2>📦 Add Stock</h2>

      {/* ========== FORM ========== */}
      <form onSubmit={handleSubmit} className="add-product-form">

        <label>Stock Movement</label>
        <select
          name="movement_type"
          value={stockData.movement_type}
          onChange={handleChange}
        >
          <option value="IN">Stock IN</option>
          <option value="OUT">Stock OUT</option>
          <option value="ADJUST">Adjustment</option>
        </select>

        {/* ===== SEARCHABLE PRODUCT DROPDOWN ===== */}
        <label>Product</label>
        <div className="searchable-dropdown">
          <input
            type="text"
            placeholder="🔍 Search product..."
            value={
              stockData.product_id
                ? selectedProduct?.name || ""
                : productSearch
            }
            onChange={(e) => {
              setProductSearch(e.target.value);
              setStockData(prev => ({
                ...prev,
                product_id: "",
                product_unit_id: ""
              }));
              setShowProductDropdown(true);
            }}
            onFocus={() => setShowProductDropdown(true)}
          />

          {showProductDropdown && (
            <div className="dropdown-list">
              {filteredProducts.length === 0 && (
                <div className="dropdown-item disabled">
                  No products found
                </div>
              )}

              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  className="dropdown-item"
                  onClick={() => {
                    setStockData(prev => ({
                      ...prev,
                      product_id: p.id,
                      product_unit_id: ""
                    }));
                    setProductSearch("");
                    setShowProductDropdown(false);
                  }}
                >
                  <strong>{p.name}</strong>
                  <small>{p.category_name || "General"}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== UNIT ===== */}
        <label>Unit / Variant</label>
        <select
          name="product_unit_id"
          value={stockData.product_unit_id}
          onChange={handleChange}
          disabled={!variants.length}
          required
        >
          <option value="">
            {variants.length ? "-- Select Unit --" : "No units available"}
          </option>
          {variants.map(v => (
            <option key={v.id} value={v.id}>
              {v.unit?.name || "Unit"} | Stock: {v.stock}
            </option>
          ))}
        </select>

        <label>
          Quantity
          {selectedUnit && <small> (Current: {selectedUnit.stock})</small>}
        </label>
        <input
          type="number"
          name="qty"
          min="1"
          value={stockData.qty}
          onChange={handleChange}
          required
        />

        <label>Barcode</label>
        <input
          type="text"
          name="barcode"
          value={stockData.barcode}
          onChange={handleChange}
        />

        <button
          type="button"
          className="barcode-btn"
          onClick={() => setShowScanner(!showScanner)}
        >
          {showScanner ? "Close Scanner" : "Scan Barcode"}
        </button>

        {showScanner && (
          <BarcodeScanner
            onScanSuccess={(code) => {
              setStockData(prev => ({ ...prev, barcode: code }));
              setShowScanner(false);
            }}
          />
        )}

        <label>Reason</label>
        <textarea
          name="reason"
          value={stockData.reason}
          onChange={handleChange}
        />

        <button type="submit" className="submit-btn">
          💾 Save Stock
        </button>
      </form>

      {/* ========== INVENTORY GRID ========== */}
      <hr />

      <h3>📊 Current Inventory</h3>

      <div className="inventory-grid">
        {products.flatMap(product =>
          (product.variants || []).map(variant => (
            <div
              key={`${product.id}-${variant.id}`}
              className={`inventory-card ${
                variant.stock <= 0
                  ? "stock-zero"
                  : variant.stock < 10
                  ? "stock-low"
                  : "stock-ok"
              }`}
            >
              <h4>{product.name}</h4>
              <p>{variant.unit?.name || "Unit"}</p>
              <strong>{variant.stock}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AddStock;
