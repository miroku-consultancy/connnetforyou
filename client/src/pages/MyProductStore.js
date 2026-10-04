import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { secondaryApiUrl } from "../config/apiConfig";
import "./MyProductStore.css";

const MyProductStore = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStore = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");

      if (!token) {
        navigate("/login");
        return;
      }

      // ------------------------------------
      // Get vendor's shop
      // ------------------------------------
      const shopResponse = await fetch(
        `${secondaryApiUrl}/api/shops/vendor`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const shopData = await shopResponse.json();

      if (!shopResponse.ok) {
        throw new Error(
          shopData?.message ||
            shopData?.error ||
            "Failed to load your store"
        );
      }

      const currentShop = Array.isArray(shopData)
        ? shopData[0]
        : shopData;

      if (!currentShop?.id) {
        throw new Error("No business store found");
      }

      console.log(
        "[MyProductStore] Vendor shop:",
        currentShop
      );

      setShop(currentShop);

      // ------------------------------------
      // Get vendor's products
      // ------------------------------------
      const productResponse = await fetch(
        `${secondaryApiUrl}/api/products?shopId=${currentShop.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const productData = await productResponse.json();

      if (!productResponse.ok) {
        throw new Error(
          productData?.message ||
            productData?.error ||
            "Failed to load products"
        );
      }

      const productList = Array.isArray(productData)
        ? productData
        : Array.isArray(productData?.products)
        ? productData.products
        : [];

      setProducts(productList);
    } catch (err) {
      console.error(
        "[MyProductStore] Load error:",
        err
      );

      setError(
        err.message ||
          "Failed to load your product store"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStore();
  }, []);

  // ------------------------------------
  // Add Product
  // ------------------------------------
  const handleAddProduct = () => {
    navigate("/my-product-store/add");
  };

  // ------------------------------------
  // Edit Product
  // ------------------------------------
  const handleEditProduct = (productId) => {
    navigate(`/my-product-store/edit/${productId}`);
  };

  // ------------------------------------
  // Back to My Business
  // ------------------------------------
  const handleBack = () => {
    navigate("/my-business");
  };

  // ------------------------------------
  // Store status helpers
  // ------------------------------------
  const getStatusLabel = (status) => {
    switch (status) {
      case "draft":
        return "Draft";

      case "pending":
        return "Under Review";

      case "active":
        return "Active";

      case "rejected":
        return "Needs Changes";

      default:
        return status || "Unknown";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "draft":
        return "status-draft";

      case "pending":
        return "status-pending";

      case "active":
        return "status-active";

      case "rejected":
        return "status-rejected";

      default:
        return "status-unknown";
    }
  };

  // ------------------------------------
  // Store status content
  // ------------------------------------
  const renderStoreStatus = () => {
    const status = String(
      shop?.tenant_status || "draft"
    ).toLowerCase();

    // ================================
    // DRAFT
    // ================================
    if (status === "draft") {
      return (
        <section className="my-product-status-card status-card-draft">

          <div className="my-product-status-icon">
            🚀
          </div>

          <div className="my-product-status-content">

            <div className="my-product-status-heading">

              <div>
                <span className="my-product-status-label">
                  NEXT STEP
                </span>

                <h3>
                  Complete your product store
                </h3>
              </div>

              <span
                className={`my-product-status-badge ${getStatusClass(
                  status
                )}`}
              >
                {getStatusLabel(status)}
              </span>

            </div>

            <p>
              Add your products and complete your
              business information before submitting
              your store for admin approval.
            </p>

            <div className="my-product-status-actions">

              <button
                type="button"
                className="my-product-status-primary"
                onClick={handleAddProduct}
              >
                Add Products
                <span>→</span>
              </button>

              <button
                type="button"
                className="my-product-status-secondary"
                onClick={() =>
                  navigate("/my-business")
                }
              >
                Submit for Approval
              </button>

            </div>

          </div>

        </section>
      );
    }

    // ================================
    // PENDING
    // ================================
    if (status === "pending") {
      return (
        <section className="my-product-status-card status-card-pending">

          <div className="my-product-status-icon">
            ⏳
          </div>

          <div className="my-product-status-content">

            <span className="my-product-status-label">
              UNDER REVIEW
            </span>

            <div className="my-product-status-heading">

              <h3>
                Your product store is being reviewed
              </h3>

              <span
                className={`my-product-status-badge ${getStatusClass(
                  status
                )}`}
              >
                {getStatusLabel(status)}
              </span>

            </div>

            <p>
              Your business has been submitted for
              admin approval. Once approved, your
              JusPing product store can become
              available to customers.
            </p>

          </div>

        </section>
      );
    }

    // ================================
    // ACTIVE
    // ================================
    if (status === "active") {
      return (
        <section className="my-product-status-card status-card-active">

          <div className="my-product-status-icon">
            ✓
          </div>

          <div className="my-product-status-content">

            <div className="my-product-status-heading">

              <div>
                <span className="my-product-status-label">
                  STORE STATUS
                </span>

                <h3>
                  Your product store is live
                </h3>
              </div>

              <span
                className={`my-product-status-badge ${getStatusClass(
                  status
                )}`}
              >
                {getStatusLabel(status)}
              </span>

            </div>

            <p>
              Your store is active and your products
              can be managed from this page.
            </p>

            <div className="my-product-status-actions">

              <button
                type="button"
                className="my-product-status-primary"
                onClick={handleAddProduct}
              >
                Add Product
                <span>→</span>
              </button>

            </div>

          </div>

        </section>
      );
    }

    // ================================
    // REJECTED
    // ================================
    if (status === "rejected") {
      return (
        <section className="my-product-status-card status-card-rejected">

          <div className="my-product-status-icon">
            ⚠️
          </div>

          <div className="my-product-status-content">

            <div className="my-product-status-heading">

              <div>
                <span className="my-product-status-label">
                  ACTION REQUIRED
                </span>

                <h3>
                  Your store needs some changes
                </h3>
              </div>

              <span
                className={`my-product-status-badge ${getStatusClass(
                  status
                )}`}
              >
                {getStatusLabel(status)}
              </span>

            </div>

            <p>
              Please update the required business
              information before submitting your
              store again for approval.
            </p>

            <div className="my-product-status-actions">

              <button
                type="button"
                className="my-product-status-primary"
                onClick={() =>
                  navigate("/my-business")
                }
              >
                Update Store
                <span>→</span>
              </button>

            </div>

          </div>

        </section>
      );
    }

    return null;
  };

  // ------------------------------------
  // Loading
  // ------------------------------------
  if (loading) {
    return (
      <div className="my-product-store-loading">
        <div className="my-product-store-loader">
          Loading your product store...
        </div>
      </div>
    );
  }

  return (
    <div className="my-product-store-page">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}
      <div className="my-product-store-header">

        <div>
          <button
            type="button"
            className="my-product-store-back"
            onClick={handleBack}
          >
            ← My Business
          </button>

          <h1>
            {shop?.name || "My Product Store"}
          </h1>

          <p>
            Manage your products and inventory
          </p>
        </div>

        {/* ONLY ADD PRODUCT BUTTON */}
        {/* <button
          type="button"
          className="my-product-store-add-btn"
          onClick={handleAddProduct}
        >
          ＋ Add Product1
        </button> */}

      </div>

      {/* ================================= */}
      {/* ERROR */}
      {/* ================================= */}
      {error && (
        <div className="my-product-store-error">
          {error}
        </div>
      )}

      {/* ================================= */}
      {/* STORE SUMMARY */}
      {/* ================================= */}
      <div className="my-product-store-summary">

        <div className="my-product-store-stat">

          <span className="my-product-store-stat-icon">
            📦
          </span>

          <div>
            <strong>{products.length}</strong>
            <span>Total Products</span>
          </div>

        </div>

        <div className="my-product-store-stat">

          <span className="my-product-store-stat-icon">
            🏪
          </span>

          <div>
            <strong>Product Store</strong>
            <span>Business Type</span>
          </div>

        </div>

        <div className="my-product-store-stat">

          <span className="my-product-store-stat-icon">
            {shop?.tenant_status === "active"
              ? "🟢"
              : shop?.tenant_status === "pending"
              ? "🟠"
              : shop?.tenant_status === "rejected"
              ? "🔴"
              : "🟡"}
          </span>

          <div>
            <strong>
              {getStatusLabel(
                shop?.tenant_status
              )}
            </strong>

            <span>
              Store Status
            </span>
          </div>

        </div>

      </div>

      {/* ================================= */}
      {/* STORE STATUS */}
      {/* ================================= */}
      {renderStoreStatus()}

      {/* ================================= */}
      {/* PRODUCTS */}
      {/* ================================= */}
      <section className="my-product-store-section">

        <div className="my-product-store-section-header">

          <div>
            <h2>Your Products</h2>

            <p>
              Add and manage the items customers can
              purchase from your store.
            </p>
          </div>

          {/* Removed duplicate Add Product button */}

        </div>

        {/* ================================= */}
        {/* NO PRODUCTS */}
        {/* ================================= */}
        {products.length === 0 ? (

          <div className="my-product-store-empty">

            <div className="my-product-store-empty-icon">
              📦
            </div>

            <h3>
              No products yet
            </h3>

            <p>
              Start adding products to your store.
            </p>

            <button
              type="button"
              onClick={handleAddProduct}
            >
              ＋ Add Your First Product
            </button>

          </div>

        ) : (

          /* ================================= */
          /* PRODUCT GRID */
          /* ================================= */
          <div className="my-product-store-grid">

            {products.map((product) => {

              const productId =
                product.id ||
                product.product_id;

              const productName =
                product.name ||
                "Product";

              const price =
                product.price ??
                product.base_price ??
                0;

              const stock =
                product.stock ??
                product.quantity ??
                0;

              const productImage =
                product.image_url ||
                product.image ||
                product.imageUrl;

              return (
                <article
                  key={productId}
                  className="my-product-card"
                >

                  {/* Product Image */}
                  <div className="my-product-card-image">

                    {productImage ? (
                      <img
                        src={productImage}
                        alt={productName}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <span>📦</span>
                    )}

                  </div>

                  {/* Product Information */}
                  <div className="my-product-card-content">

                    <h3>
                      {productName}
                    </h3>

                    {product.category_name && (
                      <span className="my-product-card-category">
                        {product.category_name}
                      </span>
                    )}

                    <div className="my-product-card-price">
                      ₹
                      {Number(price).toLocaleString(
                        "en-IN"
                      )}
                    </div>

                    <div className="my-product-card-stock">
                      Stock:{" "}
                      <strong>{stock}</strong>
                    </div>

                    <button
                      type="button"
                      className="my-product-card-edit"
                      onClick={() =>
                        handleEditProduct(productId)
                      }
                    >
                      Edit Product
                    </button>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </section>

    </div>
  );
};

export default MyProductStore;