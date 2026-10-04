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

      setShop(currentShop);

      // ------------------------------------
      // Get vendor's products
      // ------------------------------------
      const productResponse = await fetch(
        `${secondaryApiUrl}/api/products`,
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
  // Back to My Business
  // ------------------------------------
  const handleBack = () => {
    navigate("/my-business");
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

      {/* -------------------------------- */}
      {/* Header */}
      {/* -------------------------------- */}
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

        <button
          type="button"
          className="my-product-store-add-btn"
          onClick={handleAddProduct}
        >
          ＋ Add Product
        </button>

      </div>

      {/* -------------------------------- */}
      {/* Error */}
      {/* -------------------------------- */}
      {error && (
        <div className="my-product-store-error">
          {error}
        </div>
      )}

      {/* -------------------------------- */}
      {/* Store Summary */}
      {/* -------------------------------- */}
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

      </div>

      {/* -------------------------------- */}
      {/* Products Section */}
      {/* -------------------------------- */}
      <section className="my-product-store-section">

        <div className="my-product-store-section-header">

          <div>
            <h2>Your Products</h2>

            <p>
              Add and manage the items customers can
              purchase from your store.
            </p>
          </div>

          {products.length > 0 && (
            <button
              type="button"
              className="my-product-store-small-add"
              onClick={handleAddProduct}
            >
              ＋ Add Product
            </button>
          )}

        </div>

        {/* -------------------------------- */}
        {/* No Products */}
        {/* -------------------------------- */}
        {products.length === 0 ? (

          <div className="my-product-store-empty">

            <div className="my-product-store-empty-icon">
              📦
            </div>

            <h3>No products yet</h3>

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

          /* -------------------------------- */
          /* Product Grid */
          /* -------------------------------- */
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

                    <h3>{productName}</h3>

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
                      onClick={() => {
                        alert(
                          "Product editing will be added next."
                        );
                      }}
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