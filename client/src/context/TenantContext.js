import React, { createContext, useContext, useEffect, useState } from "react";

const TenantContext = createContext(null);

const API_BASE_URL = "https://connnet4you-server.onrender.com";

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const resolveTenant = async () => {
    const domain = window.location.hostname.toLowerCase();

    // Root JusPing platform domain — not a tenant
    if (domain === "jusping.com" || domain === "www.jusping.com") {
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/tenants/resolve?domain=${encodeURIComponent(domain)}`
      );

      if (!response.ok) {
        throw new Error("Tenant not found");
      }

      const data = await response.json();

      console.log("[Tenant] Resolved:", data);

      setTenant(data);
    } catch (err) {
      console.error("[Tenant] Resolution failed:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  resolveTenant();
}, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used inside TenantProvider");
  }

  return context;
};