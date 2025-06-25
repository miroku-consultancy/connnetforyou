import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';  // <-- Import Link here
import './Header.css';
import logo from '../assets/images/logo.png';
import apiUrl from '../config/apiConfig';

const Header = () => {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [navItems, setNavItems] = useState([]);

    useEffect(() => {
        const fetchNavItems = async () => {
            try {
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                if (data && Array.isArray(data.navItems)) {
                    setNavItems(data.navItems);
                } else {
                    setNavItems([]);
                }
            } catch (error) {
                setNavItems([]);
            }
        };

        fetchNavItems();
    }, []);

    const handleMouseEnter = (index) => {
        setExpandedIndex(index);
    };

    const handleMouseLeave = () => {
        setExpandedIndex(null);
    };

    return (
        <header className="header">
            <div className="logo-container">
                <img src={logo} alt="Miroku Consultancy Logo" className="logo" />
                <div className="company-name">
                    <span>ConnectFree4U</span>
                </div>
            </div>

            <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
                <ul className="nav-list">
                    {Array.isArray(navItems) && navItems.map((item, index) => (
                        <li
                            key={item.name}
                            onMouseEnter={() => handleMouseEnter(index)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <Link
                                to={item.id}    // <-- use Link and to prop here
                                className="dropdown-toggle"
                                aria-label={`Toggle ${item.name} dropdown`}
                            >
                                {item.name}
                            </Link>
                            {expandedIndex === index && (
                                <div className="dropdown-content">
                                    {Array.isArray(item.description) && item.description.map((desc, descIndex) => (
                                        <div key={descIndex} className="dropdown-item">
                                            {desc}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
};

export default Header;
