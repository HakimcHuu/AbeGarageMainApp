import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Tag, Button, Input, Space, Badge, Dropdown, Menu, Modal, Descriptions, Divider, Timeline, Progress } from "antd";
import { getAntdTagProps } from "../../util/status";
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  MoreOutlined, 
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  UserOutlined,
  CarOutlined,
  ToolOutlined,
  DollarOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined
} from "@ant-design/icons";
import Service from "../../services/order.service";
import dayjs from "dayjs";
import "../../../pages/admin/admin.css";
import "./OrderList.css";

const { Search } = Input;

// Order View Modal Component
const OrderViewModal = ({ visible, order, onClose }) => {
  if (!order) return null;

  const statusStages = [
    { status: 1, title: 'Order Received', icon: <ClockCircleOutlined />, color: '#1890ff' },
    { status: 2, title: 'In Progress', icon: <SyncOutlined spin />, color: '#faad14' },
    { status: 3, title: 'Ready for Pickup', icon: <CheckCircleOutlined />, color: '#52c41a' },
  ];

  const currentStatusIndex = statusStages.findIndex(stage => stage.status === order.order_status) || 0;
  const progressPercent = Math.round((currentStatusIndex / (statusStages.length - 1)) * 100);

  return (
    <Modal
      title={`Order #${order.order_id}`}
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={800}
      className="order-view-modal"
    >
      <div className="order-view-container">
        {/* Order Progress */}
        <div className="order-progress-section">
          <div className="progress-bar-container">
            <Progress percent={progressPercent} showInfo={false} strokeColor="#4a6cf7" />
            <div className="progress-steps">
              {statusStages.map((stage, index) => (
                <div 
                  key={stage.status} 
                  className={`progress-step ${index <= currentStatusIndex ? 'active' : ''}`}
                >
                  <div className="step-icon" style={{ backgroundColor: index <= currentStatusIndex ? stage.color : '#f0f0f0' }}>
                    {stage.icon}
                  </div>
                  <div className="step-label">{stage.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        <div className="order-details-grid">
          {/* Customer Information */}
          <div className="order-detail-card">
            <div className="detail-card-header">
              <UserOutlined className="detail-card-icon" />
              <h4>Customer Information</h4>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">
                {order.customer_first_name} {order.customer_last_name}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <PhoneOutlined /> {order.customer_phone || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <MailOutlined /> {order.customer_email || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Vehicle Information */}
          <div className="order-detail-card">
            <div className="detail-card-header">
              <CarOutlined className="detail-card-icon" />
              <h4>Vehicle Information</h4>
            </div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Vehicle">
                {order.vehicle_year} {order.vehicle_make} {order.vehicle_model}
              </Descriptions.Item>
              <Descriptions.Item label="VIN">
                {order.vehicle_vin || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="License Plate">
                {order.vehicle_license_plate || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Order Information */}
          <div className="order-detail-card">
            <div className="detail-card-header">
              <ToolOutlined className="detail-card-icon" />
              <h4>Service Information</h4>
            </div>
            {order.services?.length > 0 ? (
              <div className="service-list">
                {order.services.map((service, index) => (
                  <div key={index} className="service-item">
                    <div className="service-name">{service.service_name}</div>
                    <div className="service-price">${service.service_price?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>No services found</div>
            )}
          </div>

          {/* Order Summary */}
          <div className="order-detail-card">
            <div className="detail-card-header">
              <DollarOutlined className="detail-card-icon" />
              <h4>Order Summary</h4>
            </div>
            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${order.order_subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-row">
                <span>Tax:</span>
                <span>${order.order_tax?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>${order.order_total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {/* Order Notes */}
        {order.notes && (
          <div className="order-notes">
            <h4>Notes</h4>
            <div className="notes-content">{order.notes}</div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const OrderList = ({ searchText = "" }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewingOrder, setViewingOrder] = useState(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const navigate = useNavigate();

    const statusMapping = {
        1: { text: 'Received' },
        2: { text: 'In Progress' },
        3: { text: 'Completed' },
        4: { text: 'Ready for Pick Up' },
        5: { text: 'Done' },
        6: { text: 'Cancelled' },
    };

    useEffect(() => {
        fetchOrders();
    }, [pagination.current, pagination.pageSize]);

    useEffect(() => {
        if (searchText) {
            const filtered = orders.filter(order => 
                order.customer_first_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                order.customer_last_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                order.vehicle_make?.toLowerCase().includes(searchText.toLowerCase()) ||
                order.vehicle_model?.toLowerCase().includes(searchText.toLowerCase()) ||
                order.order_id?.toString().includes(searchText)
            );
            setFilteredOrders(filtered);
            setPagination(prev => ({
                ...prev,
                total: filtered.length,
                current: 1
            }));
        } else {
            setFilteredOrders(orders);
            setPagination(prev => ({
                ...prev,
                total: orders.length
            }));
        }
    }, [searchText, orders]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            console.log("Fetching orders...");
            const response = await Service.getAllOrders();
            console.log("Orders API response:", response);
            
            let ordersData = [];
            
            // Handle different response formats
            if (response?.status === "success") {
                if (Array.isArray(response?.data?.orders)) {
                    ordersData = response.data.orders;
                    console.log("Found orders in response.data.orders:", ordersData.length);
                } else if (Array.isArray(response?.data)) {
                    ordersData = response.data;
                    console.log("Found orders in response.data:", ordersData.length);
                } else if (Array.isArray(response)) {
                    ordersData = response;
                    console.log("Found orders directly in response:", ordersData.length);
                }
            } else if (Array.isArray(response)) {
                ordersData = response;
                console.log("Response is an array, using directly:", ordersData.length);
            } else if (response?.data && Array.isArray(response.data)) {
                ordersData = response.data;
                console.log("Found orders in response.data:", ordersData.length);
            } else if (response?.orders) {
                ordersData = response.orders;
                console.log("Found orders in response.orders:", ordersData.length);
            }
            
            // Log the first order for debugging
            if (ordersData.length > 0) {
                console.log("First order data:", ordersData[0]);
            } else {
                console.log("No orders found in the response");
            }
            
            // Ensure we have an array before setting state
            const ordersArray = Array.isArray(ordersData) ? [...ordersData].reverse() : [];
            setOrders(ordersArray);
            
            // Update filtered orders for search
            if (searchText) {
                const filtered = ordersArray.filter(order => 
                    order.customer_first_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                    order.customer_last_name?.toLowerCase().includes(searchText.toLowerCase()) ||
                    order.vehicle_make?.toLowerCase().includes(searchText.toLowerCase()) ||
                    order.vehicle_model?.toLowerCase().includes(searchText.toLowerCase()) ||
                    order.order_id?.toString().includes(searchText)
                );
                setFilteredOrders(filtered);
                setPagination(prev => ({
                    ...prev,
                    total: filtered.length,
                    current: 1
                }));
            } else {
                setFilteredOrders(ordersArray);
                setPagination(prev => ({
                    ...prev,
                    total: ordersArray.length
                }));
            }
            
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Error fetching orders. Please try again.");
            setOrders([]);
            setFilteredOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (orderId) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete order #${orderId}?`);
        if (confirmDelete) {
            try {
                await Service.deleteOrder(orderId);
                setOrders(prevOrders => prevOrders.filter(order => order.order_id !== orderId));
            } catch (err) {
                setError("Error deleting the order. Please try again.");
            }
        }
    };

    const handleTableChange = (pagination, filters, sorter) => {
        setPagination(pagination);
    };

    const handleView = (order) => {
        setViewingOrder(order);
        setIsViewModalVisible(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalVisible(false);
        setViewingOrder(null);
    };

    const columns = [
        {
            title: 'ORDER ID',
            dataIndex: 'order_id',
            key: 'order_id',
            sorter: (a, b) => a.order_id - b.order_id,
        },
        {
            title: 'CUSTOMER',
            key: 'customer',
            render: (_, record) => (
                <div>
                    <div className="font-medium">{`${record.customer_first_name} ${record.customer_last_name}`}</div>
                    <div className="text-gray-500 text-sm">{record.customer_email}</div>
                </div>
            ),
        },
        {
            title: 'VEHICLE',
            key: 'vehicle',
            render: (_, record) => (
                <div>
                    <div className="font-medium">{`${record.vehicle_year} ${record.vehicle_make} ${record.vehicle_model}`}</div>
                    <div className="text-gray-500 text-sm">VIN: {record.vehicle_vin || 'N/A'}</div>
                </div>
            ),
        },
        {
            title: 'ORDER DATE',
            dataIndex: 'order_date',
            key: 'order_date',
            render: (date) => dayjs(date).format('MMM D, YYYY'),
            sorter: (a, b) => new Date(a.order_date) - new Date(b.order_date),
        },
        {
            title: 'STATUS',
            key: 'order_status',
            render: (_, record) => {
                const { color, text } = getAntdTagProps(record.order_status);
                return (<Tag color={color} style={{ color: '#fff' }}>{text}</Tag>);
            },
            filters: [
                { text: 'Received', value: 1 },
                { text: 'In Progress', value: 2 },
                { text: 'Completed', value: 3 },
                { text: 'Ready for Pick Up', value: 4 },
                { text: 'Done', value: 5 },
                { text: 'Cancelled', value: 6 },
            ],
            onFilter: (value, record) => record.order_status === value,
        },
        {
            title: 'TOTAL',
            dataIndex: 'order_total_price',
            key: 'order_total_price',
            render: (price) => `$${parseFloat(price || 0).toFixed(2)}`,
            sorter: (a, b) => (a.order_total_price || 0) - (b.order_total_price || 0),
        },
        {
            title: 'ACTIONS',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="text" 
                        icon={<EyeOutlined />} 
                        onClick={() => navigate(`/admin/orders/${record.order_id}`)}
                        title="View Order"
                    />
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => navigate(`/admin/edit-order/${record.order_id}`, { state: { orderData: record } })}
                        title="Edit Order"
                    />
                    <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDelete(record.order_id)}
                        title="Delete Order"
                    />
                </Space>
            ),
        },
    ];

    if (loading) {
        return <div className="text-center p-8">Loading orders...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    return (
        <>
            <Table
                columns={columns}
                dataSource={filteredOrders}
                rowKey="order_id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
                }}
                onChange={handleTableChange}
                className="order-list-table"
            />
            
            {/* Order View Modal */}
            <OrderViewModal 
                visible={isViewModalVisible}
                order={viewingOrder}
                onClose={handleCloseViewModal}
            />
        </>
    );
};

export default OrderList;
