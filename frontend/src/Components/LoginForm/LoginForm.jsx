import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginService } from "../services/login.service";
import { useAuth } from "../../Contexts/AuthContext"; // Import the AuthContext

function LoginForm() {
  const { setIsLogged, setEmployee, setCustomer } = useAuth(); // Use context to set login state
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Client-side validations
    let valid = true;
    if (!email) {
      setEmailError("Please enter your email address");
      valid = false;
    } else if (!email.includes("@")) {
      setEmailError("Invalid email format");
      valid = false;
    } else {
      const regex = /^\S+@\S+\.\S+$/;
      if (!regex.test(email)) {
        setEmailError("Invalid email format");
        valid = false;
      } else {
        setEmailError("");
      }
    }

    if (!password || password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!valid) return;

    const formData = { email, password };
    console.log("Form Data Submitted:", formData);

    try {
      // Call the appropriate service based on login type
      const loginResponse = await loginService.logInEmployee(formData);

      const response = await loginResponse.json();
      console.log("Response from Server:", response);

      if (response.status === "success") {
        // Clear previous customer data and store new employee data
        localStorage.removeItem("customer");
        const employeeData = {
          employee_token: response.data.employee_token,
          employee_role: response.data.employee_role,
          employee_first_name: response.data.employee_first_name,
        };
        localStorage.setItem("employee", JSON.stringify(employeeData));
        setEmployee(employeeData);

        setIsLogged(true);

        // Redirect to home after successful employee/admin login
        navigate("/");
      } else {
        setServerError(response.message);
      }
    } catch (err) {
      console.log("Error:", err);
      setServerError("An error has occurred. Please try again later.");
    }
  };

  return (
    <section className="contact-section">
      <div className="auto-container">
        <div className="sec-title style-two">
          <h2>Login to your account</h2>
        </div>

        <div className="row clearfix">
          <div className="form-column col-lg-6">
            <div className="inner-column">
              <div className="contact-form">
                <form onSubmit={handleSubmit}>
                  <div className="row clearfix">
                    <div className="form-group col-md-12">
                      {serverError && (
                        <div className="validation-error" role="alert">
                          {serverError}
                        </div>
                      )}
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Email"
                      />
                      {emailError && (
                        <div className="validation-error" role="alert">
                          {emailError}
                        </div>
                      )}
                    </div>

                    <div className="form-group col-md-12">
                      <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Password"
                      />
                      {passwordError && (
                        <div className="validation-error" role="alert">
                          {passwordError}
                        </div>
                      )}
                    </div>

                    <div className="form-group col-md-12">
                      <button
                        className="theme-btn btn-style-one"
                        type="submit"
                        data-loading-text="Please wait..."
                      >
                        <span>Login</span>
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
}

export default LoginForm;
