import React, { useState, useEffect } from 'react';
import './Header.css';
import logo from '../assets/images/logo.png';
import apiUrl from '../config/apiConfig';


const Header = () => {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [navItems, setNavItems] = useState([]);

    useEffect(() => {
        const fetchNavItems = async () => {
            const response = await fetch(apiUrl);

//const response = await fetch('/data.json'); // Adjust path if needed
            const data = await response.json();
            setNavItems(data.navItems);
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
                <div className="logo-container">
                    {/* <span className="short-name">mcs</span> */}
                    {/* <div className="long-name">
                        <span>MIROKU</span>
                        <span>CONSULTANCY</span>
                        <span>SERVICES</span>
                    </div> */}
                     <div className="company-name">
                        <span>Connect4U</span>
                    </div>
                </div>
                <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
                    {isMenuOpen ? '✖' : '☰'}
                </button>
            </div>

            <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
                <ul className="nav-list">
                    {navItems.map((item, index) => (
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
                                    {item.description.map((desc, descIndex) => (
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
