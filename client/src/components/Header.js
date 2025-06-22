import React, { useState, useEffect } from 'react';
import './Header.css';
import logo from '../assets/images/logo.png';
import apiUrl from '../config/apiConfig'; // Make sure this is a full valid URL like http://localhost:5000/api/data

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
                console.log('Fetched nav data:', data); // Debugging line

                if (data && Array.isArray(data.navItems)) {
                    setNavItems(data.navItems);
                } else {
                    console.warn("navItems missing or not an array in API response");
                    setNavItems([]);
                }
            } catch (error) {
                console.error('Failed to fetch nav items:', error);
                setNavItems([]); // Fallback to avoid map on undefined
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

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="header">
            <div className="logo-container">
                <img src={logo} alt="Miroku Consultancy Logo" className="logo" />
                <div className="company-name">
                    <span>Connect4U</span>
                </div>
                <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
                    {isMenuOpen ? '✖' : '☰'}
                </button>
            </div>

            <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
                <ul className="nav-list">
                    {Array.isArray(navItems) && navItems.map((item, index) => (
                        <li
                            key={item.name}
                            onMouseEnter={() => handleMouseEnter(index)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <a
                                href={item.id}
                                className="dropdown-toggle"
                                aria-label={`Toggle ${item.name} dropdown`}
                            >
                                {item.name}
                            </a>
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
