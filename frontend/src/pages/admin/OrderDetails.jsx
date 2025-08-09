import OrderDetails from "../../Components/Admin/OrderDetails/OrderDetails";
import AdminMenu from "../../Components/Admin/AdminMenu/AdminMenu";

function OrderDetailsPage(props) {
  return (
    <div className="container-fluid admin-pages">
      <div className="row">
        <div className="col-md-3 admin-left-side">
          <AdminMenu />
        </div>
        <div className="col-md-9 admin-right-side">
          <OrderDetails />
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsPage;
