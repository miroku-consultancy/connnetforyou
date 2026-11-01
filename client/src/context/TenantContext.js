
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const TenantContext = createContext(null);

const API_BASE_URL = "https://connnet4you-server.onrender.com";

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const resolveTenant = async () => {
      const domain = window.location.hostname
        .toLowerCase()
        .trim();

      // Main JusPing platform domains and local development
      const platformDomains = [
        "jusping.com",
        "www.jusping.com",
        "localhost",
        "127.0.0.1",
      ];

      if (platformDomains.includes(domain)) {
        if (isMounted) {
          setTenant(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const url =
          `${API_BASE_URL}/api/tenants/resolve?domain=${encodeURIComponent(domain)}`;

        console.log("[Tenant] Resolving domain:", domain);
        console.log("[Tenant] API URL:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        const responseText = await response.text();

        console.log("[Tenant] HTTP status:", response.status);
        console.log("[Tenant] Response:", responseText);

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? `Tenant not found for domain: ${domain}`
              : `Tenant resolution failed: ${response.status}`
          );
        }

        let data;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("Invalid tenant API response");
        }

        const shop = data?.shop || {};

        const resolvedShopId =
          data.shopId ??
          data.shop_id ??
          shop.id ??
          shop.shopId ??
          shop.shop_id;

        if (
          resolvedShopId === undefined ||
          resolvedShopId === null
        ) {
          throw new Error(
            "Tenant response does not contain a shop ID"
          );
        }

        // Normalize store type from the tenant/shop response.
        const storeType =
          data.store_type ??
          data.storeType ??
          shop.store_type ??
          shop.storeType ??
          null;

        // Normalize shop slug.
        const shopSlug =
          data.shopSlug ??
          data.shop_slug ??
          shop.slug ??
          shop.shopSlug ??
          shop.shop_slug ??
          data.tenantSlug ??
          data.tenant_slug ??
          null;

        const normalizedTenant = {
          ...data,

          shopId: resolvedShopId,
          shopSlug,

          store_type: storeType,

          // Keep the original shop properties and expose
          // normalized values inside the shop object too.
          shop: {
            ...shop,
            id: shop.id ?? resolvedShopId,
            slug: shop.slug ?? shopSlug,
            store_type:
              shop.store_type ??
              shop.storeType ??
              storeType,
          },
        };

        if (isMounted) {
          setTenant(normalizedTenant);
          setError(null);

          console.log(
            "[Tenant] Resolved successfully:",
            normalizedTenant
          );

          console.log(
            "[Tenant] Shop ID:",
            normalizedTenant.shopId
          );

          console.log(
            "[Tenant] Shop slug:",
            normalizedTenant.shopSlug
          );

          console.log(
            "[Tenant] Store type:",
            normalizedTenant.store_type
          );
        }
      } catch (err) {
        console.error("[Tenant] Resolution failed:", err);

        if (isMounted) {
          setTenant(null);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    resolveTenant();

    return () => {
      isMounted = false;
    };
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
    throw new Error(
      "useTenant must be used inside TenantProvider"
    );
  }

  return context;
};
