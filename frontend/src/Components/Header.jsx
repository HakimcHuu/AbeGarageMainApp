import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png";
import iconBar from "../assets/template_assets/images/icons/icon-bar.png";
import { loginService } from "./services/login.service.js";
import { useAuth } from "../Contexts/AuthContext.jsx";
import getAuth from "./util/auth.js";
// import jwtDecode from 'jwt-decode';
function Header(props) {
  const {
    isLogged,
    setIsLogged,
    employee,
    customer,
    setEmployee,
    setCustomer,
    setIsAdmin,
  } = useAuth();
  // console.log(customer);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const loggedInUser = await getAuth();
      if (loggedInUser) {
        if (loggedInUser.employee_id) {
          setEmployee(loggedInUser);
        } else {
          setCustomer(loggedInUser);
          console.log("Customer Data:", {
            firstName: loggedInUser.customer_first_name,
            id: loggedInUser.customer_id,
          });
        }
      }
    };

    fetchUserData();
  }, [setEmployee, setCustomer]);

  const logOut = () => {
    loginService.logOut();
    setIsLogged(false);
    localStorage.removeItem("employee");
    localStorage.removeItem("customer");
    localStorage.removeItem("employee_token");
    localStorage.removeItem("customer_token");
    setEmployee(null);
    setCustomer(null);
    if (setIsAdmin) setIsAdmin(false);
  };

  const openMobileMenu = () => {
    document.body.classList.add("mobile-menu-visible");
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    document.body.classList.remove("mobile-menu-visible");
    setIsMobileMenuOpen(false);
  };

  const isAdmin = isLogged && employee && employee.employee_role === 3;
  const isEmployee = isLogged && employee && employee.employee_role === 1;

  return (
    <header className="main-header header-style-one">
      <div className="header-top">
        <div className="auto-container">
          <div className="inner-container">
            <div className="left-column">
              <div className="text">Enjoy the Beso while we fix your car</div>
              <div className="office-hour">Monday - Saturday 7:00AM - 6:00PM</div>
            </div>
            <div className="right-column">
              {isLogged ? (
                <div className="link-btn">
                  <div className="phone-number">
                    <strong>
                      Welcome {employee ? employee.employee_first_name : customer?.customer_first_name}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="phone-number">
                  Schedule Appointment: <strong>1800 456 7890</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="header-upper">
        <div className="auto-container">
          <div className="inner-container">
            <div className="logo-box">
              <div className="logo">
                <Link to="/">
                  <img src={logo} alt="" />
                </Link>
              </div>
            </div>
            <div className="right-column">
              <div className="nav-outer">
                <div className="mobile-nav-toggler" onClick={openMobileMenu}>
                  <img src={iconBar} alt="" />
                </div>
                <nav className="main-menu navbar-expand-md navbar-light">
                  <ul className="navigation">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About Us</Link></li>
                    <li><Link to="/services">Services</Link></li>
                    <li><Link to="/contact">Contact Us</Link></li>
                      {isAdmin && (
                        <li><Link to="/admin/admin-landing">Admin</Link></li>
                      )}
                      <li><Link to="/my-orders">My Orders</Link></li>
                  </ul>
                </nav>
              </div>
              {isLogged ? (
                <div className="link-btn">
                  <Link to="/" className="theme-btn btn-style-one blue" onClick={logOut}>Log out</Link>
                </div>
              ) : (
                <div className="link-btn">
                  <Link to="/login" className="theme-btn btn-style-one">Login</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky-header">
        <div className="header-upper">
          <div className="auto-container">
            <div className="inner-container">
              <div className="logo-box">
                <div className="logo">
                  <Link to="/"><img src={logo} alt="" /></Link>
                </div>
              </div>
              <div className="right-column">
                <div className="nav-outer">
                  <div className="mobile-nav-toggler" onClick={openMobileMenu}>
                    <img src={iconBar} alt="" />
                  </div>
                  <nav className="main-menu navbar-expand-md navbar-light">
                    {/* Intentionally left empty; sticky header clones the main menu via CSS/JS in template */}
                  </nav>
                </div>
                {isLogged ? (
                  <div className="link-btn">
                    <Link to="/" className="theme-btn btn-style-one blue" onClick={logOut}>Log out</Link>
                  </div>
                ) : (
                  <div className="link-btn"><Link to="/login" className="theme-btn btn-style-one">Login</Link></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-menu">
        <div className="menu-backdrop" onClick={closeMobileMenu}></div>
        <div className="close-btn" onClick={closeMobileMenu}><span className="icon flaticon-remove"></span></div>

        <nav className="menu-box">
          <div className="nav-logo">
            <Link to="/" onClick={closeMobileMenu}>
              <img src={logo} alt="" title="" />
            </Link>
          </div>
          <div className="menu-outer">
            <ul className="navigation">
              <li className="dropdown"><Link to="/" onClick={closeMobileMenu}>Home</Link></li>
              <li className="dropdown"><Link to="/about" onClick={closeMobileMenu}>About Us</Link></li>
              <li className="dropdown"><Link to="/services" onClick={closeMobileMenu}>Services</Link></li>
              <li><Link to="/contact" onClick={closeMobileMenu}>Contact Us</Link></li>
              {isAdmin && (
                <li><Link to="/admin/admin-landing" onClick={closeMobileMenu}>Admin</Link></li>
              )}
              {isLogged ? (
                <li><Link to="/" onClick={() => { logOut(); closeMobileMenu(); }}>Log out</Link></li>
              ) : (
                <li><Link to="/login" onClick={closeMobileMenu}>Login</Link></li>
              )}
            </ul>
          </div>
        </nav>
      </div>

      <div className="nav-overlay">
        <div className="cursor"></div>
        <div className="cursor-follower"></div>
      </div>
    </header>
  );
}

export default Header;