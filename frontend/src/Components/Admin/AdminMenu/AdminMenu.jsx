import { Link, useLocation } from "react-router-dom";

const AdminMenu = () => {
  const location = useLocation();

  // Function to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-menu">
      <h5 className="px-3 py-2 mb-2">Admin Menu</h5>
      <div className="list-group list-group-flush">
        <Link
          to="/admin/admin-landing"
          className={`list-group-item list-group-item-action ${isActive("/admin/admin-landing") ? "active" : ""}`}
        >
          <i className="fas fa-tachometer-alt me-2"></i>Dashboard
        </Link>
        <Link
          to="/admin/employees"
          className={`list-group-item list-group-item-action ${isActive("/admin/employees") ? "active" : ""}`}
        >
          <i className="fas fa-users me-2"></i>Employees
        </Link>
        <Link
          to="/admin/add-employee"
          className={`list-group-item list-group-item-action ${isActive("/admin/add-employee") ? "active" : ""}`}
        >
          <i className="fas fa-user-plus me-2"></i>Add Employee
        </Link>
        <Link
          to="/admin/customers"
          className={`list-group-item list-group-item-action ${isActive("/admin/customers") ? "active" : ""}`}
        >
          <i className="fas fa-user-friends me-2"></i>Customers
        </Link>
        <Link
          to="/admin/add-customer"
          className={`list-group-item list-group-item-action ${isActive("/admin/add-customer") ? "active" : ""}`}
        >
          <i className="fas fa-user-plus me-2"></i>Add Customer
        </Link>
        <Link
          to="/admin/orders"
          className={`list-group-item list-group-item-action ${isActive("/admin/orders") ? "active" : ""}`}
        >
          <i className="fas fa-shopping-cart me-2"></i>Orders
        </Link>
        <Link
          to="/admin/add-order"
          className={`list-group-item list-group-item-action ${isActive("/admin/add-order") ? "active" : ""}`}
        >
          <i className="fas fa-plus-circle me-2"></i>Add Order
        </Link>
        <Link
          to="/admin/services"
          className={`list-group-item list-group-item-action ${isActive("/admin/services") ? "active" : ""}`}
        >
          <i className="fas fa-cogs me-2"></i>Services
        </Link>
      </div>
    </div>
  );
};

export default AdminMenu;