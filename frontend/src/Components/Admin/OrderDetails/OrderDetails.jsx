import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spin, Alert, Card, Descriptions, Divider, Tag, Popconfirm, message, Select } from "antd";
import { getAntdTagProps } from "../../util/status";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Service from "../../services/order.service";
import "./OrderDetails.css";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError("");
        console.log(`Fetching details for order ID: ${orderId}`);
        
        const data = await Service.getOrderDetails(orderId);
        console.log('Order details received:', data);
        
        if (!data) {
          throw new Error("No order data received from server");
        }
        
        setOrder(data);
      } catch (err) {
        console.error('Error in fetchOrderDetails:', err);
        setError(err.message || "Failed to load order details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
  
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError("No order ID provided");
      setLoading(false);
    }
  }, [orderId]);

  // Service badge rendering helper and live refresh
  const getServiceTagProps = (svc) => {
    const status = svc?.service_status;
    if (status) {
      const { text, color } = getAntdTagProps(status);
      return { text, color };
    }
    // Fallback to boolean if service_status absent
    if (typeof svc?.service_completed === 'number' || typeof svc?.service_completed === 'boolean') {
      const mapped = svc.service_completed ? 'completed' : 'in_progress';
      const { text, color } = getAntdTagProps(mapped);
      return { text, color };
    }
    const { text, color } = getAntdTagProps('pending');
    return { text, color };
  };

  useEffect(() => {
    // Poll for live updates so badges reflect employee changes
    const interval = setInterval(async () => {
      try {
        const data = await Service.getOrderDetails(orderId);
        if (data) setOrder(data);
      } catch (e) {
        // silent failure during polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await Service.deleteOrder(orderId);
      message.success(`Order #${orderId} deleted`);
      navigate('/admin/orders');
    } catch (e) {
      message.error(e.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Alert
          message="Error Loading Order"
          description={error}
          type="error"
          showIcon
        />
        <Button 
          type="primary" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/orders')}
          style={{ marginTop: 16 }}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="no-data">
        <p>No order details found.</p>
        <Button 
          type="primary" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/orders')}
          style={{ marginTop: 16 }}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  // Determine if all services are completed for admin transitions
  const allServicesCompleted = Array.isArray(order?.services) && order.services.every(s => (s.service_status === 'completed') || s.service_completed === 1);
  const currentStatus = Number(order?.order_status);
  const isReceived = currentStatus === 1;
  const isCompleted = currentStatus === 3;
  const isDone = currentStatus === 5;
  const isCancelled = currentStatus === 6;

  return (
    <div className="order-details-container">
      <div className="order-actions">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/orders')}
          className="back-button"
        >
          Back to Orders
        </Button>
      </div>

      <Card 
        title={`Order #${order.order_id || order.id}`}
        extra={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(() => {
              const { color, text } = getAntdTagProps(order.order_status);
              return <Tag color={color} style={{ color: '#fff' }}>{text}</Tag>;
            })()}
            <Select
              size="small"
              value={Number(order.order_status)}
              style={{ width: 200 }}
              onChange={async (val) => {
                // Prevent invalid transitions client-side for immediate feedback
                if (isCancelled && val !== 1) {
                  message.error('From Cancelled, only Received is allowed.');
                  return;
                }
                if (isReceived && val !== 6) {
                  message.error('Only Cancel is allowed when order is Received.');
                  return;
                }
                if (Number(order.order_status) === 2 && val !== 6) {
                  message.error("When order is In Progress, only 'Cancel' is allowed.");
                  return;
                }
                if (isDone && val !== 6) {
                  message.error('Only Cancel is allowed when order is Done.');
                  return;
                }
                if ((val === 3 || val === 4 || val === 5) && !allServicesCompleted) {
                  message.error('All service tasks must be completed and submitted before setting Completed, Ready for Pick Up, or Done.');
                  return;
                }
                if (isCompleted && ![4, 5, 6].includes(val)) {
                  message.error('From Completed, only Ready for Pick Up, Done, or Cancel are allowed.');
                  return;
                }
                try {
                  setUpdatingStatus(true);
                  const resp = await Service.updateOrderStatus(order.order_id, val);
                  if (resp?.status !== 'success') throw new Error(resp?.message || 'Bad response');
                  const data = await Service.getOrderDetails(order.order_id);
                  setOrder(data);
                  message.success('Status updated');
                } catch (e) {
                  message.error(e.message || 'Failed to update status');
                } finally {
                  setUpdatingStatus(false);
                }
              }}
              options={[1,2,3,4,5,6].map(v => ({ 
                value: v, 
                label: getAntdTagProps(v).text, 
                disabled: isCancelled
                  ? v !== 1 // From Cancelled, only Received (1) is allowed
                  : isReceived
                    ? v !== 6
                    : isDone 
                      ? v !== 6 
                      : Number(order.order_status) === 2
                        ? v !== 6 // In Progress: only Cancel allowed
                        : isCompleted 
                          ? ![4, 5, 6].includes(v) 
                          : ((v === 3 || v === 4 || v === 5) && !allServicesCompleted) 
              }))}
              loading={updatingStatus}
            />
            <Button onClick={() => navigate(`/admin/edit-order/${order.order_id}`)} type="default" disabled={isCancelled || isDone}>
              Edit
            </Button>
            <Popconfirm title="Delete this order?" onConfirm={handleDelete} okButtonProps={{ loading: deleting }}>
              <Button danger>Delete</Button>
            </Popconfirm>
          </div>
        }
      >
        <div className="order-details-grid">
          {/* Customer Information */}
          <div className="order-detail-card">
            <div className="detail-card-header">
              <h4>Customer Information</h4>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">
                {order.customer_name || `${order.customer_first_name} ${order.customer_last_name}` || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {order.customer_phone || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {order.customer_email || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Vehicle Information */}
          <div className="order-detail-card">
            <div className="detail-card-header">
              <h4>Vehicle Information</h4>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Vehicle">
                {[order.vehicle_year, order.vehicle_make, order.vehicle_model]
                  .filter(Boolean)
                  .join(' ') || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="VIN">
                {order.vehicle_vin || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="License Plate">
                {order.vehicle_license_plate || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>

        {/* Services */}
        <Divider>Services</Divider>
        {Array.isArray(order.services) && order.services.length > 0 ? (
          <div className="service-list">
            {order.services.map((svc, idx) => (
              <div key={idx} className="service-item">
                <div className="service-name">
                  {svc.service_name}
                  <span style={{ marginLeft: 8 }}>
                    {(() => {
                      const { text, color } = getServiceTagProps(svc);
                      return <Tag color={color} style={{ color: '#fff' }}>{text}</Tag>;
                    })()}
                  </span>
                </div>
                {Array.isArray(svc.assigned) && svc.assigned.length > 0 ? (
                  <div className="service-assigned">
                    Assigned to: {svc.assigned.map(a => `${a.employee_first_name} ${a.employee_last_name}`).join(', ')}
                  </div>
                ) : (
                  <div className="service-assigned">Assigned to: Unassigned</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>No services found for this order.</div>
        )}

        {/* Order Summary */}
        <Divider>Order Summary</Divider>
        <div className="order-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${(order.order_subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax:</span>
            <span>${(order.order_tax || 0).toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>${(order.order_total || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <>
            <Divider>Notes</Divider>
            <div className="order-notes">
              <p>{order.notes}</p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default OrderDetails;
