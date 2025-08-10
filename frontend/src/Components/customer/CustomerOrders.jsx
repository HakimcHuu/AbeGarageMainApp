import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import customerService from "../services/customer.service";
import { Card, Badge, Row, Col, Table } from "react-bootstrap";
import { getBootstrapBadgeProps } from "../util/status";

// Map status for customer-visible rules and return centralized style + text
const statusDisplay = (status) => {
  const numToKey = { 1: 'pending', 2: 'in_progress', 3: 'completed', 4: 'ready_for_pickup', 5: 'done', 6: 'cancelled' };
  const key = typeof status === 'string' ? status : (numToKey[Number(status)] || 'pending');
  const mapped = key === 'completed' ? 'in_progress' : key;
  const { text, style } = getBootstrapBadgeProps(mapped);
  return { text, style };
};

export default function CustomerOrders() {
  const { customer_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const token =
          localStorage.getItem("employee_token") ||
          localStorage.getItem("customer_token");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const ordersRes = await customerService.getCustomerOrders(customer_id, token);
        if (!ordersRes.ok) {
          const message = `${ordersRes.status} ${ordersRes.statusText}`;
          throw new Error(message);
        }
        const data = await ordersRes.json();
        setOrders(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        setError(e.message || "Failed to load orders");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [customer_id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">My Orders</h2>
        <Badge bg="dark">{orders.length} total</Badge>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h5>No Orders Found</h5>
            <p className="text-muted mb-0">You don't have any orders yet.</p>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const display = statusDisplay(order.order_status);
                    return (
                      <tr key={order.order_id}>
                        <td>#{order.order_id}</td>
                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                        <td>
                          {order.vehicle_year ? `${order.vehicle_year} ` : ""}
                          {order.vehicle_make} {order.vehicle_model}
                          {order.vehicle_license_plate ? ` • ${order.vehicle_license_plate}` : ""}
                        </td>
                        <td>
                          <span className="badge" style={display.style}>{display.text}</span>
                        </td>
                        <td>${Number(order.total_amount || order.order_total_price || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}


