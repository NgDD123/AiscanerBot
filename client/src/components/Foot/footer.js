import React from 'react';
import { Link } from 'react-router-dom';
import "./footer.css"

const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-section">
          <h3>Freedom</h3>
          <ul>
            <li><Link to="/" className='massege'>Massaging Us</Link></li>
            <li><Link to="/about" className='About1'>About Us</Link></li>
           
          </ul>
        </div>
        <div className="footer-section">
          <h4>Services we deliver</h4>
          <ul>
            <li><Link to="/trading" className='Bot1'>Tradingbot</Link></li>
            <li><Link to="/sgnals" className='Sgnals'>Tradingsgnals</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
      <p>&copy; {new Date().getFullYear()} Freedom Trading Bot. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
