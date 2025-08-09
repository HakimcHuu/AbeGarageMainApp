
// Import the auth hook
import { useAuth } from "../../Contexts/AuthContext";
// Import the login form component
import LoginForm from "../../Components/LoginForm/LoginForm";
// Import the admin menu component
import AdminMenu from "../../Components/Admin/AdminMenu/AdminMenu";
// Import the EmployeesList component
import CustomersList from "../../Components/Admin/CustomerList/CustomerList";
function Customers() {
  // Rely on route guard (PrivateAuthRoute) for role checks.
  // Only require that user is logged (employee) here.
  const { isLogged } = useAuth();

  if (!isLogged) {
    return (
      <div>
        <LoginForm />
      </div>
    );
  }

  return (
    <div>
      <div className="container-fluid admin-pages">
        <div className="row">
          <div className="col-md-3 admin-left-side">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-right-side">
            <CustomersList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customers;
