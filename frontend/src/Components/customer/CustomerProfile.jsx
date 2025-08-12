import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import customerService from "../../Components/services/customer.service";
import { Button, Row, Col, Card, Modal, Form, Tab, Tabs, Table, Badge } from "react-bootstrap";
import { getBootstrapBadgeProps } from "../util/status";
import AddVehicleForm from "../../Components/Admin/AddVehicleForm/AddVehicleForm";
import { FcFullTrash } from "react-icons/fc";
import { FaEdit, FaUser, FaCar, FaClipboardList, FaArrowLeft } from "react-icons/fa";
import "./CustomerProfile.css";

const CustomerProfile = () => {
  const { customer_id } = useParams();
  const navigate = useNavigate();

  const [customerData, setCustomerData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);

  // Normalize active_customer to boolean consistently
  const normalizeActiveFlag = (val) => val === true || val === 1 || val === '1' || String(val).toLowerCase() === 'true';

  const [formData, setFormData] = useState({
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year: "",
    vehicle_license_plate: "",
    vehicle_vin: "",
    vehicle_color: "",
    vehicle_mileage: "",
    vehicle_engine_number: "",
    vehicle_chassis_number: "",
    vehicle_transmission_type: "Automatic",
    vehicle_fuel_type: "Gasoline",
    last_service_date: "",
    next_service_date: "",
    insurance_provider: "",
    insurance_expiry: ""
  });

  // Fetch customer data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
         // Get token (support employee or customer)
         const token = localStorage.getItem("employee_token") || localStorage.getItem("customer_token");
        
        if (!token) {
          console.error("No authentication token found");
          setLoading(false);
          return;
        }
        
         const [customerRes, vehiclesRes, ordersRes] = await Promise.all([
           customerService.getCustomer(customer_id, token),
           customerService.getCustomerVehicles(customer_id, token),
           customerService.getCustomerOrders(customer_id, token)
         ]);
        
        // Handle customer data
        if (!customerRes.ok) {
          console.error("Failed to fetch customer data:", customerRes.status, customerRes.statusText);
          throw new Error("Failed to fetch customer data");
        }
        const customerData = await customerRes.json();
        console.log("Raw customer data response:", customerData);
        const normalizedActive = customerData?.data ? normalizeActiveFlag(customerData.data.active_customer) : false;
        setCustomerData({ ...(customerData?.data || {}), active_customer: normalizedActive });

        // Handle vehicles data
        if (!vehiclesRes.ok) {
          console.error("Failed to fetch vehicles data:", vehiclesRes.status, vehiclesRes.statusText);
          throw new Error("Failed to fetch vehicles data");
        }
        const vehiclesData = await vehiclesRes.json();
        console.log("Raw vehicles data response:", vehiclesData);
        setVehicles(vehiclesData.data || []);

        // Handle orders data
        if (!ordersRes.ok) {
          console.error("Failed to fetch orders data:", ordersRes.status, ordersRes.statusText);
          throw new Error("Failed to fetch orders data");
        }
        const ordersData = await ordersRes.json();
        console.log("Raw orders data response:", ordersData);
        
        // Deduplicate orders by order_id
        const uniqueOrders = [];
        const orderIds = new Set();
        
        if (ordersData.data && Array.isArray(ordersData.data)) {
          ordersData.data.forEach(order => {
            if (order && order.order_id && !orderIds.has(order.order_id)) {
              orderIds.add(order.order_id);
              uniqueOrders.push(order);
            }
          });
        }
        
        console.log(`Deduplicated ${uniqueOrders.length} unique orders from ${ordersData.data?.length || 0} total orders`);
        setOrders(uniqueOrders);

      } catch (error) {
        console.error("Error fetching data in CustomerProfile:", error);
        // Optionally, set an error state to display to the user
        // setError("Failed to load customer profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customer_id]);

  // Map status for customer-visible rules: never show 'Completed'
  // Until admin sets 'Ready for Pick Up', display 'In Progress' instead of 'Completed'
  const mapCustomerVisibleStatus = (status) => {
    // Normalize to string key
    const numToKey = {
      1: 'pending',
      2: 'in_progress',
      3: 'completed',
      4: 'ready_for_pickup',
      5: 'done',
      6: 'cancelled',
    };
    const key = typeof status === 'string' ? status : (numToKey[Number(status)] || 'pending');
    if (key === 'completed') return 'in_progress';
    return key;
  };

  // Poll orders periodically to reflect current status changes
  useEffect(() => {
    const token = localStorage.getItem("employee_token") || localStorage.getItem("customer_token");
    if (!customer_id || !token) return;
    const interval = setInterval(async () => {
      try {
        const res = await customerService.getCustomerOrders(customer_id, token);
        if (res.ok) {
          const ordersData = await res.json();
          setOrders(ordersData.data || []);
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [customer_id]);

  // Refetch customer info on focus/visibility/BFCache restore and periodic polling
  useEffect(() => {
    const token = localStorage.getItem("employee_token") || localStorage.getItem("customer_token");
    if (!customer_id || !token) return;

    const refetch = async () => {
      try {
        const res = await customerService.getCustomer(customer_id, token);
        if (res.ok) {
          const json = await res.json();
          const normalizedActive = json?.data ? normalizeActiveFlag(json.data.active_customer) : false;
          setCustomerData({ ...(json?.data || {}), active_customer: normalizedActive });
        }
      } catch (e) {
        // ignore refetch errors
      }
    };

    const onVis = () => {
      if (document.visibilityState === 'visible') refetch();
    };

    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', refetch);
    const interval = setInterval(refetch, 10000);

    return () => {
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', refetch);
      clearInterval(interval);
    };
  }, [customer_id]);

  // Handler for editing a vehicle
  const handleEditVehicleClick = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_make: vehicle.vehicle_make || "",
      vehicle_model: vehicle.vehicle_model || "",
      vehicle_year: vehicle.vehicle_year || "",
      vehicle_license_plate: vehicle.vehicle_license_plate || "",
      vehicle_vin: vehicle.vehicle_vin || "",
      vehicle_color: vehicle.vehicle_color || "",
      vehicle_mileage: vehicle.vehicle_mileage || "",
      vehicle_engine_number: vehicle.vehicle_engine_number || "",
      vehicle_chassis_number: vehicle.vehicle_chassis_number || "",
      vehicle_transmission_type: vehicle.vehicle_transmission_type || "Automatic",
      vehicle_fuel_type: vehicle.vehicle_fuel_type || "Gasoline",
      last_service_date: vehicle.last_service_date || "",
      next_service_date: vehicle.next_service_date || "",
      insurance_provider: vehicle.insurance_provider || "",
      insurance_expiry: vehicle.insurance_expiry || ""
    });
    setShowEditModal(true);
  };

  // Handler for deleting a vehicle
  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        const token = localStorage.getItem("employee_token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/vehicle/${vehicleId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-access-token": token,
            },
          }
        );
        
        if (response.ok) {
          // Remove the vehicle from the state
          setVehicles(prevVehicles =>
            prevVehicles.filter(vehicle => vehicle.vehicle_id !== vehicleId)
          );
          alert("Vehicle deleted successfully");
        } else {
          alert("Failed to delete vehicle");
        }
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        alert("Error deleting vehicle");
      }
    }
  };

  // Handle vehicle form submission
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("employee_token");
      
      // Format data for submission
      const vehicleData = {
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: formData.vehicle_year ? parseInt(formData.vehicle_year) : null,
        vehicle_license_plate: formData.vehicle_license_plate || null,
        vehicle_vin: formData.vehicle_vin || null,
        vehicle_color: formData.vehicle_color || null,
        vehicle_mileage: formData.vehicle_mileage ? parseInt(formData.vehicle_mileage) : 0,
        vehicle_engine_number: formData.vehicle_engine_number || null,
        vehicle_chassis_number: formData.vehicle_chassis_number || null,
        vehicle_transmission_type: formData.vehicle_transmission_type || "Automatic",
        vehicle_fuel_type: formData.vehicle_fuel_type || "Gasoline",
        last_service_date: formData.last_service_date || null,
        next_service_date: formData.next_service_date || null,
        insurance_provider: formData.insurance_provider || null,
        insurance_expiry: formData.insurance_expiry || null
      };

      const url = editingVehicle 
        ? `${import.meta.env.VITE_API_URL}/api/vehicle/${editingVehicle.vehicle_id}`
        : `${import.meta.env.VITE_API_URL}/api/vehicle`;
      
      const method = editingVehicle ? "PUT" : "POST";
      const body = editingVehicle 
        ? vehicleData 
        : { ...vehicleData, customer_id: parseInt(customer_id) };

      console.log("Submitting vehicle data:", { url, method, body });
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      console.log("Vehicle submission response:", result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save vehicle');
      }

      // Refresh vehicle list
      const vehiclesRes = await customerService.getCustomerVehicles(customer_id, token);
      const vehiclesData = await vehiclesRes.json();
      setVehicles(vehiclesData.data || []);
      
      // Reset form and close modal
      setFormData({
        vehicle_make: "",
        vehicle_model: "",
        vehicle_year: "",
        vehicle_license_plate: "",
        vehicle_vin: "",
        vehicle_color: "",
        vehicle_mileage: "",
        vehicle_engine_number: "",
        vehicle_chassis_number: "",
        vehicle_transmission_type: "Automatic",
        vehicle_fuel_type: "Gasoline",
        last_service_date: "",
        next_service_date: "",
        insurance_provider: "",
        insurance_expiry: ""
      });
      
      // Close the modal by setting both modal states to false
      setShowAddVehicleForm(false);
      setShowEditModal(false);
      setEditingVehicle(null);
      
    } catch (error) {
      console.error("Error submitting vehicle:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Update the vehicle form fields in the modal
  const renderVehicleForm = ({ onCancel }) => (
    <Form onSubmit={handleVehicleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Make <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="vehicle_make"
              value={formData.vehicle_make}
              onChange={(e) => setFormData({...formData, vehicle_make: e.target.value})}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Model <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="vehicle_model"
              value={formData.vehicle_model}
              onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
              required
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Year <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="number"
              name="vehicle_year"
              value={formData.vehicle_year}
              onChange={(e) => setFormData({...formData, vehicle_year: e.target.value})}
              min="1900"
              max={new Date().getFullYear() + 1}
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>License Plate <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="vehicle_license_plate"
              value={formData.vehicle_license_plate}
              onChange={(e) => setFormData({...formData, vehicle_license_plate: e.target.value})}
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>VIN</Form.Label>
            <Form.Control
              type="text"
              name="vehicle_vin"
              value={formData.vehicle_vin}
              onChange={(e) => setFormData({...formData, vehicle_vin: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Color</Form.Label>
            <Form.Control
              type="text"
              name="vehicle_color"
              value={formData.vehicle_color}
              onChange={(e) => setFormData({...formData, vehicle_color: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Mileage</Form.Label>
            <Form.Control
              type="number"
              name="vehicle_mileage"
              value={formData.vehicle_mileage}
              onChange={(e) => setFormData({...formData, vehicle_mileage: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Engine Number</Form.Label>
            <Form.Control
              type="text"
              name="vehicle_engine_number"
              value={formData.vehicle_engine_number}
              onChange={(e) => setFormData({...formData, vehicle_engine_number: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Chassis Number</Form.Label>
            <Form.Control
              type="text"
              name="vehicle_chassis_number"
              value={formData.vehicle_chassis_number}
              onChange={(e) => setFormData({...formData, vehicle_chassis_number: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Transmission Type</Form.Label>
            <Form.Select
              name="vehicle_transmission_type"
              value={formData.vehicle_transmission_type}
              onChange={(e) => setFormData({...formData, vehicle_transmission_type: e.target.value})}
            >
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Fuel Type</Form.Label>
            <Form.Select
              name="vehicle_fuel_type"
              value={formData.vehicle_fuel_type}
              onChange={(e) => setFormData({...formData, vehicle_fuel_type: e.target.value})}
            >
              <option value="Gasoline">Gasoline</option>
              <option value="Diesel">Diesel</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Last Service Date</Form.Label>
            <Form.Control
              type="date"
              name="last_service_date"
              value={formData.last_service_date}
              onChange={(e) => setFormData({...formData, last_service_date: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Next Service Date</Form.Label>
            <Form.Control
              type="date"
              name="next_service_date"
              value={formData.next_service_date}
              onChange={(e) => setFormData({...formData, next_service_date: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Insurance Provider</Form.Label>
            <Form.Control
              type="text"
              name="insurance_provider"
              value={formData.insurance_provider}
              onChange={(e) => setFormData({...formData, insurance_provider: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Insurance Expiry</Form.Label>
            <Form.Control
              type="date"
              name="insurance_expiry"
              value={formData.insurance_expiry}
              onChange={(e) => setFormData({...formData, insurance_expiry: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>
      <div className="d-flex justify-content-end mt-3">
        <Button variant="secondary" onClick={onCancel} className="me-2">
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </div>
    </Form>
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return <div className="alert alert-danger">Customer not found</div>;
  }

  return (
    <div className="customer-profile-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <Button 
            variant="link" 
            onClick={() => navigate(-1)} 
            className="p-0 me-3"
          >
            <FaArrowLeft size={24} />
          </Button>
          Customer Profile
        </h2>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex align-items-center mb-4">
            <div className="customer-avatar me-4">
              <FaUser size={80} className="text-primary" />
            </div>
            <div>
              <h3 className="mb-1">
                {customerData.customer_first_name} {customerData.customer_last_name}
              </h3>
              <p className="text-muted mb-2">{customerData.customer_email}</p>
              <Badge bg={customerData.active_customer ? 'success' : 'secondary'}>
                {customerData.active_customer ? 'Active' : 'Inactive'} Customer
              </Badge>
            </div>
            {/* Hide admin edit for customer view; only show if employee token exists */}
            {localStorage.getItem('employee_token') && (
              <div className="ms-auto">
                <Link
                  to={`/admin/customer/${customer_id}`}
                  className="btn btn-outline-primary"
                >
                  <FaEdit className="me-2" /> Edit Profile
                </Link>
              </div>
            )}
          </div>

          <Tabs
            defaultActiveKey="info"
            id="customer-tabs"
            className="mb-3"
            onSelect={(k) => setActiveTab(k || 'info')}
          >
            <Tab eventKey="info" title={
              <span><FaUser className="me-1" /> Information</span>
            }>
              <div className="mt-4">
                <h5>Contact Information</h5>
                <Row className="mb-3">
                  <Col md={6}>
                    <p><strong>Email:</strong> {customerData.customer_email}</p>
                    <p><strong>Phone:</strong> {customerData.customer_phone || 'N/A'}</p>
                  </Col>
                  <Col md={6}>
                    {customerData.customer_address && (
                      <p><strong>Address:</strong> {customerData.customer_address}</p>
                    )}
                    {customerData.customer_city && (
                      <p><strong>City:</strong> {customerData.customer_city}</p>
                    )}
                  </Col>
                </Row>
              </div>
            </Tab>

            <Tab eventKey="vehicles" title={
              <span><FaCar className="me-1" /> Vehicles</span>
            }>
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>Vehicles</h5>
                  {localStorage.getItem('employee_token') && !showAddVehicleForm && (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowAddVehicleForm(true)}
                    >
                      <FaCar className="me-2" /> Add Vehicle
                    </Button>
                  )}
                </div>

                {localStorage.getItem('employee_token') && showAddVehicleForm && (
                  <Card className="mb-4">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6>Add New Vehicle</h6>
                        <Button 
                          variant="link" 
                          className="text-danger p-0"
                          onClick={() => setShowAddVehicleForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                      {renderVehicleForm({ onCancel: () => setShowAddVehicleForm(false) })}
                    </Card.Body>
                  </Card>
                )}

                {vehicles.length > 0 ? (
                  <Row>
                    {vehicles.map((vehicle) => (
                      <Col md={6} key={vehicle.vehicle_id} className="mb-3">
                        <Card>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h5>{vehicle.vehicle_make} {vehicle.vehicle_model}</h5>
                                <p className="text-muted mb-1">{vehicle.vehicle_year} • {vehicle.vehicle_color}</p>
                                <p className="mb-1"><small>VIN: {vehicle.vehicle_vin || 'N/A'}</small></p>
                                <p className="mb-0"><small>License: {vehicle.vehicle_license_plate || 'N/A'}</small></p>
                              </div>
                              <div>
                                {localStorage.getItem('employee_token') && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEditVehicleClick(vehicle)}
                                >
                                  <FaEdit />
                                </Button>
                                )}
                                {localStorage.getItem('employee_token') && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteVehicle(vehicle.vehicle_id)}
                                >
                                  <FcFullTrash />
                                </Button>
                                )}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Card>
                    <Card.Body className="text-center py-5">
                      <FaCar size={48} className="text-muted mb-3" />
                      <h5>No Vehicles Found</h5>
                      <p className="text-muted">This customer doesn't have any vehicles added yet.</p>
                      <Button 
                        variant="primary" 
                        onClick={() => setShowAddVehicleForm(true)}
                      >
                        Add First Vehicle
                      </Button>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Tab>

            <Tab eventKey="orders" title={
              <span><FaClipboardList className="me-1" /> Orders</span>
            }>
              <div className="mt-4">
                 <h5>Order History</h5>
                {orders.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Vehicle</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.order_id}>
                            <td>#{order.order_id}</td>
                            <td>{new Date(order.order_date).toLocaleDateString()}</td>
                            <td>
                              {order.vehicle_make} {order.vehicle_model}
                            </td>
                            <td>
                              {(() => {
                                const displayStatus = mapCustomerVisibleStatus(order.order_status);
                                const { style, text } = getBootstrapBadgeProps(displayStatus);
                                return <span className="badge" style={style}>{text}</span>;
                              })()}
                            </td>
                            <td>${order.total_amount?.toFixed(2) || '0.00'}</td>
                            <td>
                              <Button variant="link" size="sm" className="p-0">
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Card>
                    <Card.Body className="text-center py-5">
                      <FaClipboardList size={48} className="text-muted mb-3" />
                      <h5>No Orders Found</h5>
                      <p className="text-muted">This customer doesn't have any orders yet.</p>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Edit Vehicle Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Vehicle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renderVehicleForm({ onCancel: () => setShowEditModal(false) })}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CustomerProfile;
