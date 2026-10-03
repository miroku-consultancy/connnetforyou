// components/MenuBar.js
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "./UserContext";
import LogoutButton from "./LogoutButton";
import { useTenant } from "../context/TenantContext";
import {
  FaChevronDown,
  FaInfoCircle,
  FaShieldAlt,
  FaTools,
  FaUser,
  FaClipboardList,
  FaStore,
  FaPlus,
  FaBoxes,
  FaShoppingBag,
} from "react-icons/fa";
import "./MenuBar.css";

const API_BASE_URL = "https://connnet4you-server.onrender.com";

const MenuBar = ({ closeMenu }) => {
  const { user } = useUser();
  const { tenant } = useTenant();

  const shop = tenant?.shop;

  const [navItems, setNavItems] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  const [isVendor, setIsVendor] = useState(false);

  // ==========================================
  // Load navigation
  // ==========================================

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/navigation`
        );

        if (!response.ok) {
          throw new Error("Failed to load navigation");
        }

        const data = await response.json();

        setNavItems(
          Array.isArray(data?.navItems)
            ? data.navItems
            : []
        );
      } catch (error) {
        console.error(
          "Navigation fetch error:",
          error
        );
      }
    };

    fetchNavigation();
  }, []);

  // ==========================================
  // Detect vendor
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setIsVendor(false);
      return;
    }

    try {
      const payload = token.split(".")[1];

      if (!payload) {
        setIsVendor(false);
        return;
      }

      const decoded = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      );

      setIsVendor(decoded?.role === "vendor");
    } catch (error) {
      console.error("Invalid token:", error);
      setIsVendor(false);
    }
  }, []);

  // ==========================================
  // Close menu when clicking outside
  // ==========================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ==========================================
  // Close dropdown on Escape
  // ==========================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // ==========================================
  // Helpers
  // ==========================================

  const handleLinkClick = () => {
    setOpenMenu(null);

    if (closeMenu) {
      closeMenu();
    }
  };

  const toggleMenu = (menuId) => {
    setOpenMenu((current) =>
      current === menuId ? null : menuId
    );
  };

  const handleMenuKeyDown = (event, menuId) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      toggleMenu(menuId);
    }

    if (event.key === "Escape") {
      setOpenMenu(null);
    }
  };

  const handleMouseEnter = (menuId) => {
    setOpenMenu(menuId);
  };

  const handleMouseLeave = () => {
    // Keep dropdown open long enough for mouse movement.
    // CSS handles the actual visual transition.
  };

  // ==========================================
  // Dropdown component
  // ==========================================

  const Dropdown = ({
    menuId,
    children,
    labelledBy,
  }) => {
    if (openMenu !== menuId) {
      return null;
    }

    return (
      <div
        className="menu-dropdown"
        role="menu"
        aria-label={labelledBy}
      >
        {children}
      </div>
    );
  };

  const DropdownLink = ({
    to,
    children,
    icon,
  }) => (
    <Link
      to={to}
      className="menu-dropdown-item"
      role="menuitem"
      onClick={handleLinkClick}
    >
      {icon && (
        <span className="menu-dropdown-icon">
          {icon}
        </span>
      )}

      <span className="menu-dropdown-label">
        {children}
      </span>
    </Link>
  );

  const DropdownText = ({
    children,
  }) => (
    <div
      className="menu-dropdown-description"
      role="menuitem"
      tabIndex={0}
    >
      {children}
    </div>
  );

  // ==========================================
  // Menu button
  // ==========================================

  const MenuButton = ({
    id,
    children,
    icon,
    hasDropdown = false,
  }) => (
    <button
      type="button"
      className={`menu-main-button ${
        openMenu === id ? "active" : ""
      }`}
      aria-expanded={
        hasDropdown
          ? openMenu === id
          : undefined
      }
      aria-haspopup={
        hasDropdown ? "menu" : undefined
      }
      onClick={() =>
        hasDropdown && toggleMenu(id)
      }
      onKeyDown={(event) =>
        hasDropdown &&
        handleMenuKeyDown(event, id)
      }
      onMouseEnter={() =>
        hasDropdown &&
        handleMouseEnter(id)
      }
    >
      {icon && (
        <span className="menu-main-icon">
          {icon}
        </span>
      )}

      <span>{children}</span>

      {hasDropdown && (
        <FaChevronDown
          className={`menu-chevron ${
            openMenu === id
              ? "rotated"
              : ""
          }`}
          aria-hidden="true"
        />
      )}
    </button>
  );

  return (
    <nav
      ref={menuRef}
      className="jp-menu"
      aria-label="Main navigation"
    >
      <ul className="nav-list">
        {/* =====================================
            USER
        ====================================== */}

        {user && (
          <li
            className="nav-item nav-user-item"
            onMouseEnter={() =>
              handleMouseEnter("user")
            }
          >
            <MenuButton
              id="user"
              icon={
                user.profileImage ? (
                  <img
                    src={`https://connnet4you-server.onrender.com${user.profileImage}`}
                    alt=""
                    className="menu-avatar"
                  />
                ) : (
                  <FaUser />
                )
              }
              hasDropdown
            >
              {user.name?.split(" ")[0] ||
                "User"}
            </MenuButton>

            <Dropdown
              menuId="user"
              labelledBy="User menu"
            >
              <DropdownLink
                to="/profile"
                icon={<FaUser />}
              >
                Edit Profile
              </DropdownLink>

              <DropdownLink
                to="/order-history"
                icon={<FaClipboardList />}
              >
                Order History
              </DropdownLink>

              <div className="menu-dropdown-divider" />

              <div className="menu-logout">
                <LogoutButton
                  onClick={handleLinkClick}
                />
              </div>
            </Dropdown>
          </li>
        )}

        {/* =====================================
            API NAVIGATION
        ====================================== */}

        {navItems.map((item, index) => {
          const menuId = `api-${index}`;

          const hasDescription =
            Array.isArray(item.description) &&
            item.description.length > 0;

          return (
            <li
              key={item.id || index}
              className="nav-item"
              onMouseEnter={() =>
                hasDescription &&
                handleMouseEnter(menuId)
              }
            >
              {hasDescription ? (
                <>
                  <MenuButton
                    id={menuId}
                    hasDropdown
                  >
                    {item.name}
                  </MenuButton>

                  <Dropdown
                    menuId={menuId}
                    labelledBy={item.name}
                  >
                    {item.description.map(
                      (description, descriptionIndex) => (
                        <DropdownText
                          key={descriptionIndex}
                        >
                          {description}
                        </DropdownText>
                      )
                    )}
                  </Dropdown>
                </>
              ) : (
                <Link
                  to={item.id}
                  className="menu-main-link"
                  onClick={handleLinkClick}
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}

        {/* =====================================
            INFO
        ====================================== */}

        <li
          className="nav-item"
          onMouseEnter={() =>
            handleMouseEnter("info")
          }
        >
          <MenuButton
            id="info"
            icon={<FaInfoCircle />}
            hasDropdown
          >
            Info
          </MenuButton>

          <Dropdown
            menuId="info"
            labelledBy="Information menu"
          >
            <DropdownLink
              to="/about"
              icon={<FaInfoCircle />}
            >
              About Us
            </DropdownLink>

            <DropdownLink
              to="/help"
              icon={<FaClipboardList />}
            >
              Help & Support
            </DropdownLink>
          </Dropdown>
        </li>

        {/* =====================================
            LEGAL
        ====================================== */}

        <li
          className="nav-item"
          onMouseEnter={() =>
            handleMouseEnter("legal")
          }
        >
          <MenuButton
            id="legal"
            icon={<FaShieldAlt />}
            hasDropdown
          >
            Legal
          </MenuButton>

          <Dropdown
            menuId="legal"
            labelledBy="Legal menu"
          >
            <DropdownLink
              to="/privacy-policy"
              icon={<FaShieldAlt />}
            >
              Privacy Policy
            </DropdownLink>

            <DropdownLink
              to="/terms-of-service"
              icon={<FaClipboardList />}
            >
              Terms of Service
            </DropdownLink>
          </Dropdown>
        </li>

        {/* =====================================
            VENDOR TOOLS
        ====================================== */}

        {user && isVendor && (
          <li
            className="nav-item vendor-menu-item"
            onMouseEnter={() =>
              handleMouseEnter("vendor")
            }
          >
            <MenuButton
              id="vendor"
              icon={<FaTools />}
              hasDropdown
            >
              Store Admin
            </MenuButton>

            <Dropdown
              menuId="vendor"
              labelledBy="Store administration menu"
            >
              <DropdownLink
                to="/vendor/dashboard"
                icon={<FaStore />}
              >
                Dashboard
              </DropdownLink>

              <DropdownLink
                to="/shop-orders"
                icon={<FaShoppingBag />}
              >
                Shop Orders
              </DropdownLink>

              <div className="menu-dropdown-divider" />

              <DropdownLink
                to="/admin/add-product"
                icon={<FaPlus />}
              >
                Add Product
              </DropdownLink>

              <DropdownLink
                to="/admin/add-service"
                icon={<FaPlus />}
              >
                Add Service
              </DropdownLink>

              <DropdownLink
                to="/admin/add-stock"
                icon={<FaBoxes />}
              >
                Add Stock
              </DropdownLink>
            </Dropdown>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default MenuBar;