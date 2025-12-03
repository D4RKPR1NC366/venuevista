import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer-root">
    <div className="footer-col logo-col">
      <img src="/venuevista-logo.png" alt="Venuevista by Goldust Creations" className="footer-logo large" />
      
    </div>
    
    <div className="footer-col contact-col">
      <div className="footer-section-title">GET IN TOUCH</div>
      <ul className="footer-contact">
        <li>📞 0998 195 1757</li>
        
        <li>📧 goldustcreations@gmail.com</li>
        
          <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px'}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#1877F3" style={{display: 'inline', verticalAlign: 'middle'}} aria-label="Facebook">
              <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/>
            </svg>
            <a href="https://web.facebook.com/profile.php?id=100054545105290" target="_blank" rel="noopener noreferrer" style={{color: '#1a2c24', textDecoration: 'none', fontWeight: 500}}>
              facebook.com/goldustcreations
            </a>
          </span>
        
        
      </ul>
      
    </div>
    <div className="footer-col contact-col">
      <div className="footer-section-title">VISIT OUR PLACE</div>
      <ul className="footer-contact">
        <li>⏰ 10AM - 6PM</li>
       <li>🏢 
  <a 
    href="https://maps.app.goo.gl/PTAyHU1MrBvpq7AP7"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: '#1a2c24', textDecoration: 'none', fontWeight: 500 }}
  >
    Brgy. Butiwtiw, KM. 3, Balili, La Trinidad, Benguet
  </a>
</li>

<li>🏢 
  <a 
    href="https://maps.app.goo.gl/AcPecqvTm6qANs15A"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: '#1a2c24', textDecoration: 'none', fontWeight: 500 }}
  >
    Santa Fe, Nueva Vizcaya
  </a>
</li>

<li>🏢 
  <a 
    href="https://maps.app.goo.gl/KrKZUEtbdAsvxATHA"
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: '#1a2c24', textDecoration: 'none', fontWeight: 500 }}
  >
    Maddela, Quirino
  </a>
</li>


      </ul>
      
    </div>

  </footer>
);

export default Footer;
