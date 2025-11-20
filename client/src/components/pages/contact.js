import React from "react";
import "./contact.css";
import withAuth from "../ProtectionHOCs/withAuth";
const Contact = () => {
  return (
    <div className="contact">
      <h1>Contact Us</h1>
      <p>
        Need our services? Contact us today to discuss your marketing needs.
      </p>
      <p>Email: freedmobot@gmail.com</p>
      <p>Phone: +250 787703659</p>
    </div>
  );
};

export default withAuth(Contact);
