// Importing React library
import React from "react";
import bg1 from "../../assets/images/banner/bg-1.jpg";

const Section = ({ className, style, children }) => (
  <section className={className} style={style}>
    <div className="auto-container">
      {children}
    </div>
  </section>
);

function Contact() {
  return (
    <div className="page-wrapper">
      <Section className="video-section" style={{ backgroundImage: `url(${bg1})` }}>
        <h2>Contact Us</h2>
        <ul className="page-breadcrumb">
          <li>Home</li>
          <li>Contact Us</li>
        </ul>
      </Section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="auto-container">
          <div className="row clearfix">
            {/* Map Section */}
            <div className="map-section">
              <div className="map-column">
                <div className="map-outer">
                  <div
                    className="map-canvas"
                    data-zoom="12"
                    data-lat="6.8647"
                    data-lng="37.7807"
                    data-type="roadmap"
                    data-hue="#ffc400"
                    data-title="Wolaita Sodo University"
                    data-icon-path="assets/images/icons/map-marker.png"
                    data-content="Wolaita Sodo University, Ethiopia<br><a href='mailto:info@wou.edu.et'>info@wou.edu.et</a>"
                  >
                    {/* MAP */}
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d494.9863343992013!2d39.98060669902661!3d7.0221352113511815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b601d879352791%3A0x500256d7aca04f3f!2sMadda%20Walabu%20University%20Goba%20Campus!5e0!3m2!1sen!2set!4v1752494923172!5m2!1sen!2set"
                      width="600"
                      height="450"
                      style={{ border: "0" }} // Corrected: CSS string converted to a JavaScript object
                      allowFullScreen="" // Corrected: 'allowfullscreen' to 'allowFullScreen' (camelCase)
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade" // Corrected: 'referrerpolicy' to 'referrerPolicy' (camelCase)
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Column */}
            <div className="info-column col-lg-5">
              <div className="inner-column">
                <h4>Our Address</h4>
                <div className="text">
                  Completely synergize resource taxing relationships via premier
                  niche markets. Professionally cultivate one-to-one customer
                  service.
                </div>
                <ul style={{ width: "400px" }}>
                  <li>
                    <i className="flaticon-pin"></i>
                    <span>Address:</span> Madda Walabu University, <br /> Bale
                    Goba, Oromia Region, Ethiopia,
                  </li>
                  <li>
                    <i className="flaticon-email"></i>
                    <span>Email:</span> degefagomora@gmail.com
                  </li>
                  <li>
                    <i className="flaticon-phone"></i>
                    <span>Phone:</span> 1800 456 7890 / +251913 0239 8701
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <Section className="cta-section">
        <div className="wrapper-box" style={{ width: "90%", margin: "0 auto" }}>
          <div className="left-column">
            <h3>Schedule Your Appointment Today</h3>
            <div className="text">
              Your Automotive Repair & Maintenance Service Specialist
            </div>
          </div>
          <div className="right-column">
            <div className="phone">1800.456.7890</div>
            <div className="btn">
              <a href="#" className="theme-btn btn-style-one">
                <span>Appointment</span>
                <i className="flaticon-right"></i>
              </a>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default Contact;
