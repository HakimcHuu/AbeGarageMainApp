import { useState } from "react";
import { loginService } from "../Components/services/login.service";
import { useAuth } from "../Contexts/AuthContext.jsx";

const MyOrders = () => {
  const { isLogged, customer, setIsLogged, setCustomer } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await (await loginService.logInCustomer({ email, phone })).json();
      if (response.status === "success") {
        const customerData = {
          customer_token: response.data.customer_token,
          customer_first_name: response.data.customer_first_name,
          customer_id: response.data.customer_id,
        };
        localStorage.setItem("customer", JSON.stringify(customerData));
        setCustomer(customerData);
        setIsLogged(true);
        window.location.href = `/customer-profile/${customerData.customer_id}`;
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  if (isLogged && customer?.customer_token && customer?.customer_id) {
    window.location.href = `/customer-profile/${customer.customer_id}`;
    return null;
  }

  return (
    <section className="contact-section">
      <div className="auto-container">
        <div className="sec-title style-two">
          <h2>Login to view your orders</h2>
        </div>
        <div className="row clearfix">
          <div className="form-column col-lg-6">
            <div className="inner-column">
              <div className="contact-form">
                <form onSubmit={handleLogin}>
                  <div className="row clearfix">
                    <div className="form-group col-md-12">
                      {error && <div className="validation-error">{error}</div>}
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group col-md-12">
                      <input
                        type="text"
                        placeholder="Phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group col-md-12">
                      <button className="theme-btn btn-style-one" type="submit">
                        <span>View Orders</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyOrders;


