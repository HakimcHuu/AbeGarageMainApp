import { useAuth } from "../../Contexts/AuthContext";
import LoginForm from "../../Components/LoginForm/LoginForm";
import AdminMenu from "../../Components/Admin/AdminMenu/AdminMenu";
import UpdateCustomerForm from "../../Components/Admin/CustomerList/UpdateCustomer";

function EditCustomer() {
  const { isLogged, isAdmin } = useAuth();

  if (!isLogged) {
    return <LoginForm />;
  }

  if (!isAdmin) {
    return <h1>You are not authorized to access this page</h1>;
  }

  return (
    <div className="container-fluid admin-pages">
      <div className="row">
        <div className="col-md-3 admin-left-side">
          <AdminMenu />
        </div>
        <div className="col-md-9 admin-right-side">
          <UpdateCustomerForm />
        </div>
      </div>
    </div>
  );
}

export default EditCustomer;
