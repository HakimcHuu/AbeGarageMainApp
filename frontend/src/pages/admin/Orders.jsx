import { useState } from "react";
import OrderList from "../../Components/Admin/OrderList/OrderList";
import AdminMenu from "../../Components/Admin/AdminMenu/AdminMenu";
import { Input, Button } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import "./admin.css";

function OrdersPage() {
  const [searchText, setSearchText] = useState("");
  
  return (
    <div className="admin-dashboard">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-2 admin-left-side p-0">
            <AdminMenu />
          </div>
          <div className="col-md-10 admin-right-side p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="m-0">Orders</h2>
              <div className="d-flex align-items-center">
                <div className="search-container me-3">
                  <Input
                    placeholder="Search orders..."
                    prefix={<SearchOutlined className="text-muted" />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="search-input"
                  />
                </div>
                <Link to="/admin/add-order">
                  <Button type="primary" icon={<PlusOutlined />}>
                    New Order
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body p-0">
                <OrderList searchText={searchText} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;
