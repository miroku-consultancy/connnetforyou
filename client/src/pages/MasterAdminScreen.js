
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./MasterAdminScreen.css";

const API_BASE_URL = "https://connnet4you-server.onrender.com";
const ADMIN_EMAIL = "amarkantk2@gmail.com";

const MasterAdminScreen = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [stores, setStores] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [rejectingStore, setRejectingStore] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const apiRequest = async (endpoint, method = "GET", body = null) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      throw new Error("Please login again.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/shops${endpoint}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }
    );

    const responseText = await response.text();
    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error("Invalid response received from server.");
    }

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Request failed (${response.status})`
      );
    }

    return data;
  };

  const loadAdminData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      // Verify master admin access.
      const adminResult = await apiRequest("/admin/check");

      const adminEmail = adminResult.admin?.email?.toLowerCase();

      if (adminEmail !== ADMIN_EMAIL.toLowerCase()) {
        throw new Error("This account is not the configured master admin.");
      }

      setAuthorized(true);
      setAdminName(adminResult.admin?.name || ADMIN_EMAIL);

      // Load pending stores.
      const pendingResult = await apiRequest("/admin/pending");

      setStores(
        Array.isArray(pendingResult)
          ? pendingResult
          : pendingResult.stores || []
      );
    } catch (error) {
      console.error("Master Admin error:", error);

      setAuthorized(false);
      setStores([]);
      toast.error(error.message || "Unable to load admin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const refreshStores = async () => {
    setRefreshing(true);
    await loadAdminData(false);
  };

  const approveStore = async (shopId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this store?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(shopId);

      await apiRequest(`/admin/${shopId}/approve`, "POST");

      toast.success("Store approved successfully.");

      await loadAdminData(false);
    } catch (error) {
      toast.error(error.message || "Unable to approve store.");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectStore = async () => {
    if (!rejectingStore) return;

    if (!rejectReason.trim()) {
      toast.warning("Please enter a rejection reason.");
      return;
    }

    const shopId = rejectingStore.id;

    try {
      setProcessingId(shopId);

      await apiRequest(
        `/admin/${shopId}/reject`,
        "POST",
        { reason: rejectReason.trim() }
      );

      toast.success("Store rejected successfully.");

      setRejectingStore(null);
      setRejectReason("");

      await loadAdminData(false);
    } catch (error) {
      toast.error(error.message || "Unable to reject store.");
    } finally {
      setProcessingId(null);
    }
  };

  const openStore = (store) => {
    // Connect this to your existing store-review page when available.
    navigate(`/master-admin/store-review/${store.id}`);
  };

  if (loading) {
    return (
      <div className="master-admin-center">
        <div className="master-admin-spinner" />
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="master-admin-center">
        <div className="master-admin-denied">
          <div className="master-admin-denied-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>Only the JusPing Master Admin can access this screen.</p>

          <button
            className="ma-primary-btn"
            onClick={() => loadAdminData()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="master-admin-page">
      <div className="master-admin-header">
        <div>
          <span className="ma-eyebrow">JusPing Administration</span>
          <h1>Store Approvals</h1>
          <p>Welcome, {adminName}</p>
        </div>

        <button
          className="ma-refresh-btn"
          onClick={refreshStores}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div className="ma-summary-card">
        <div>
          <span className="ma-summary-label">
            Pending Store Approvals
          </span>
          <h2>{stores.length}</h2>
          <p>Stores waiting for your review</p>
        </div>

        <div className="ma-summary-icon">🏪</div>
      </div>

      <div className="ma-section-heading">
        <div>
          <h2>Pending Stores</h2>
          <p>Review and manage store applications.</p>
        </div>
        <span className="ma-count">{stores.length} pending</span>
      </div>

      {stores.length === 0 ? (
        <div className="ma-empty-state">
          <div>🏪</div>
          <h3>No Pending Stores</h3>
          <p>All store submissions will appear here.</p>
        </div>
      ) : (
        <div className="ma-store-grid">
          {stores.map((store) => {
            const isProduct = store.store_type === "product";
            const isProcessing = processingId === store.id;

            return (
              <div className="ma-store-card" key={store.id}>
                <div className="ma-store-main">
                  <div className="ma-store-icon">
                    {isProduct ? "🛍️" : "🛠️"}
                  </div>

                  <div className="ma-store-details">
                    <h3>{store.name || "Unnamed Store"}</h3>

                    <span className="ma-store-type">
                      {isProduct ? "Product Store" : "Service Store"}
                    </span>

                    <p>
                      {store.address || "Address not available"}
                    </p>
                    <span className="ma-store-id">
                      Store ID: #{store.id}
                    </span>
                  </div>
                </div>

                <div className="ma-store-actions">
                  <button
                    className="ma-review-btn"
                    onClick={() => openStore(store)}
                  >
                    Review Store
                  </button>

                  <button
                    className="ma-approve-btn"
                    disabled={isProcessing}
                    onClick={() => approveStore(store.id)}
                  >
                    {isProcessing ? "Processing..." : "Approve"}
                  </button>

                  <button
                    className="ma-reject-btn"
                    disabled={isProcessing}
                    onClick={() => {
                      setRejectingStore(store);
                      setRejectReason("");
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectingStore && (
        <div
          className="ma-modal-overlay"
          onClick={() => {
            if (!processingId) setRejectingStore(null);
          }}
        >
          <div
            className="ma-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Reject Store</h2>
            <p>
              Enter the reason for rejecting{" "}
              <strong>{rejectingStore.name}</strong>.
            </p>

            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              disabled={!!processingId}
            />

            <div className="ma-modal-actions">
              <button
                className="ma-cancel-btn"
                disabled={!!processingId}
                onClick={() => setRejectingStore(null)}
              >
                Cancel
              </button>

              <button
                className="ma-reject-btn"
                disabled={!!processingId}
                onClick={rejectStore}
              >
                {processingId ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterAdminScreen;
