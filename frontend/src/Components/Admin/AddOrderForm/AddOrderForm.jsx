import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Service from "../../services/order.service";
import ServiceSelection from "../AddServiceForm/SelectService";
import getAuth from "../../util/auth";
import { Table, Form, Button, Card, Badge, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaSearch, FaUser, FaCar, FaCalendarAlt, FaDollarSign, FaClipboard, FaArrowLeft } from 'react-icons/fa';
import './AddOrderForm.css';

const AddOrderForm = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [serviceAssignments, setServiceAssignments] = useState([]);
  const [additionalRequest, setAdditionalRequest] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery && searchQuery.trim().length > 1) { 
      const fetchCustomers = async () => {
        setLoading(true);
        try {
          const response = await Service.getCustomers(searchQuery.trim());
          if (response.status === "success") {
            const filtered = response.customers?.filter(customer => 
              `${customer.customer_first_name} ${customer.customer_last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
              customer.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              customer.customer_phone?.includes(searchQuery)
            ) || [];
            setFilteredCustomers(filtered);
          } else {
            setFilteredCustomers([]);
          }
        } catch (err) {
          console.error('Error searching customers:', err);
          setError("Error searching customers. Please try again.");
          setFilteredCustomers([]);
        } finally {
          setLoading(false);
        }
      };
      
      const debounceTimer = setTimeout(() => {
        fetchCustomers();
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setFilteredCustomers([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedServices.length > 0) {
      const fetchEmployees = async () => {
        try {
          const response = await Service.getEmployeesByRole(1);
          setEmployees(response);
        } catch (error) {
          console.error('Error fetching employees:', error);
        }
      };
      fetchEmployees();
    }
  }, [selectedServices]);


  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    try {
      setLoading(true);
      const vehiclesData = await Service.getVehicles(customer.customer_id);
      setVehicles(vehiclesData || []);
      setCurrentStep(2);
    } catch (err) {
      setError("Error fetching vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  // Accept selection from ServiceSelection (now sends objects with id+name)
  const handleSelectServices = (services) => {
    // Normalize to objects { service_id, service_name }
    const normalized = services.map((s) =>
      typeof s === "object"
        ? { service_id: s.service_id, service_name: s.service_name }
        : { service_id: s, service_name: `Service #${s}` }
    );

    // Store selected services with name and completion flag
    const updatedServiceData = normalized.map((s) => ({
      service_id: s.service_id,
      service_name: s.service_name,
      service_completed: 0,
    }));
    setSelectedServices(updatedServiceData);

    // Initialize assignments for each selected service
    const assignments = normalized.map((s) => ({
      service_id: s.service_id,
      employee_id: null,
    }));
    setServiceAssignments(assignments);
  };

  const handleAssignEmployeeToService = (serviceId, employeeId) => {
    const parsedId = employeeId === "" || employeeId === null || employeeId === undefined ? null : Number(employeeId);
    const updatedAssignments = serviceAssignments.map((assignment) => {
      if (assignment.service_id === serviceId) {
        return { ...assignment, employee_id: parsedId };
      }
      return assignment;
    });
    setServiceAssignments(updatedAssignments);
  };

  const allEmployeesAssigned = selectedServices.length > 0 &&
    serviceAssignments.every((assignment) => assignment.employee_id !== null);

  const handleCreateOrder = async () => {
    if (
      !selectedCustomer ||
      !selectedVehicle ||
      !orderPrice ||
      !estimatedCompletionDate ||
      !additionalRequest ||
      selectedServices.length === 0 ||
      serviceAssignments.length === 0
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    
    try {
      const employee = await getAuth();
    
      if (!employee || !employee.employee_id) {
        throw new Error("Employee not found or not authenticated.");
      }
    
      const orderData = {
        customer_id: selectedCustomer.customer_id,
        vehicle_id: selectedVehicle.vehicle_id,
        employee_id: employee.employee_id,
        active_order: 1,
        order_hash: generateOrderHash(),
        order_status: 1,
      };
    
      const orderInfoData = {
        order_total_price: orderPrice,
        additional_request: additionalRequest,
        estimated_completion_date: estimatedCompletionDate,
        additional_requests_completed: 0,
      };
    
      const orderServiceData = serviceAssignments.map((assignment) => ({
        service_id: assignment.service_id,
        employee_id: assignment.employee_id,
        service_completed: 0, 
      }));
    
      await Service.createOrder({
        orderData,
        orderInfoData,
        orderServiceData,
      });
    
      alert("Order created successfully.");
      navigate("/admin/orders");
    } catch (err) {
      setError("Error creating the order. Please try again.");
      console.error("Error in handleCreateOrder:", err);
    }
  };
    
  const generateOrderHash = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  return (
    <Container className="add-order-container py-4">
      <div className="d-flex align-items-center mb-4">
        <Button 
          variant="link" 
          onClick={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : navigate(-1)}
          className="me-3 p-0 back-button"
        >
          <FaArrowLeft size={24} />
        </Button>
        <h2 className="mb-0">Create New Order</h2>
      </div>

      <div className="steps-container mb-5">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className={`step ${currentStep >= step ? 'active' : ''}`}>
            <div className="step-number">{step}</div>
            <div className="step-label">
              {step === 1 ? 'Customer' : step === 2 ? 'Vehicle' : step === 3 ? 'Services' : 'Review'}
            </div>
          </div>
        ))}
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {currentStep === 1 && (
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0"><FaUser className="me-2" /> Select Customer</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <div className="search-section">
              <div className="search-container">
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <Form.Control
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/admin/add-customer')}
                  className="new-customer-btn"
                >
                  <span className="d-none d-md-inline">New Customer</span>
                  <span className="d-inline d-md-none">+ New</span>
                </Button>
              </div>
              
              {loading && (
                <div className="mt-3 text-center">
                  <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                  <span>Searching customers...</span>
                </div>
              )}
              
              {!loading && searchQuery && filteredCustomers.length > 0 && (
                <div className="search-results mt-2">
                  {filteredCustomers.map(customer => (
                    <div 
                      key={customer.customer_id}
                      className={`search-result-item ${
                        selectedCustomer?.customer_id === customer.customer_id ? 'active' : ''
                      }`}
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="customer-name">
                        {customer.customer_first_name} {customer.customer_last_name}
                      </div>
                      <div className="customer-details">
                        <span>{customer.customer_email}</span>
                        {customer.customer_phone && (
                          <span className="ms-2">• {customer.customer_phone}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!loading && searchQuery && filteredCustomers.length === 0 && (
                <div className="no-results mt-3 text-center text-muted">
                  No customers found. Try a different search or add a new customer.
                </div>
              )}
            </div>
            
            {selectedCustomer && (
              <Card className="selected-customer-card mt-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">Selected Customer</h6>
                      <h5 className="mb-2">
                        {selectedCustomer.customer_first_name} {selectedCustomer.customer_last_name}
                      </h5>
                      <div className="text-muted">
                        <div>{selectedCustomer.customer_email}</div>
                        {selectedCustomer.customer_phone && (
                          <div className="mt-1">{selectedCustomer.customer_phone}</div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Change
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Card.Body>
        </Card>
      )}
      
      {currentStep === 2 && selectedCustomer && (
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0"><FaCar className="me-2" /> Select Vehicle</h5>
          </Card.Header>
          <Card.Body>
            <div className="customer-info mb-4 p-3 bg-light rounded">
              <h6>Customer: {selectedCustomer.customer_first_name} {selectedCustomer.customer_last_name}</h6>
              <p className="mb-1">Email: {selectedCustomer.customer_email}</p>
              <p className="mb-0">Phone: {selectedCustomer.customer_phone}</p>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
                <p className="mt-2">Loading vehicles...</p>
              </div>
            ) : vehicles.length > 0 ? (
              <>
                <Table hover responsive className="vehicle-table">
                  <thead>
                    <tr>
                      <th>Make</th>
                      <th>Model</th>
                      <th>Year</th>
                      <th>License Plate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr 
                        key={vehicle.vehicle_id}
                        className={selectedVehicle?.vehicle_id === vehicle.vehicle_id ? 'table-primary' : ''}
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <td>{vehicle.vehicle_make}</td>
                        <td>{vehicle.vehicle_model}</td>
                        <td>{vehicle.vehicle_year}</td>
                        <td>{vehicle.vehicle_serial}</td>
                        <td>
                          <Button 
                            variant={selectedVehicle?.vehicle_id === vehicle.vehicle_id ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVehicle(vehicle);
                            }}
                          >
                            {selectedVehicle?.vehicle_id === vehicle.vehicle_id ? 'Selected' : 'Select'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="d-flex justify-content-between mt-4">
                  <Button variant="outline-secondary" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => setCurrentStep(3)}
                    disabled={!selectedVehicle}
                  >
                    Next: Select Services
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p>No vehicles found for this customer.</p>
                <Button 
                  variant="primary"
                  onClick={() => navigate(`/admin/customer/${selectedCustomer.customer_id}/add-vehicle`)}
                  className="mt-2"
                >
                  + Add New Vehicle
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {currentStep === 3 && selectedCustomer && selectedVehicle && (
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0"><FaClipboard className="me-2" /> Select Services</h5>
          </Card.Header>
          <Card.Body>
            <ServiceSelection onSelectServices={handleSelectServices} />
            
            {selectedServices.length > 0 && (
              <div className="mt-4">
                <h6>Selected Services</h6>
                <Table hover>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedServices.map((service) => (
                      <tr key={service.service_id}>
                        <td>{service.service_name}</td>
                        <td>
                          <Form.Select
                            size="sm"
                            onChange={(e) => handleAssignEmployeeToService(service.service_id, e.target.value)}
                            value={
                              (() => {
                                const assigned = serviceAssignments.find(sa => String(sa.service_id) === String(service.service_id))?.employee_id;
                                return assigned === null || assigned === undefined || assigned === '' ? '' : String(assigned);
                              })()
                            }
                          >
                            <option value="">Assign Employee</option>
                            {employees.map(emp => (
                              <option key={emp.employee_id} value={String(emp.employee_id)}>
                                {emp.employee_first_name} {emp.employee_last_name}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setCurrentStep(4)}
                disabled={!allEmployeesAssigned}
              >
                Next: Review Order
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {currentStep === 4 && selectedCustomer && selectedVehicle && selectedServices.length > 0 && (
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0"><FaClipboard className="me-2" /> Review Order</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header>Customer Information</Card.Header>
                  <Card.Body>
                    <p><strong>Name:</strong> {selectedCustomer.customer_first_name} {selectedCustomer.customer_last_name}</p>
                    <p><strong>Email:</strong> {selectedCustomer.customer_email}</p>
                    <p><strong>Phone:</strong> {selectedCustomer.customer_phone}</p>
                  </Card.Body>
                </Card>
                
                <Card>
                  <Card.Header>Vehicle Information</Card.Header>
                  <Card.Body>
                    <p><strong>Make:</strong> {selectedVehicle.vehicle_make}</p>
                    <p><strong>Model:</strong> {selectedVehicle.vehicle_model}</p>
                    <p><strong>Year:</strong> {selectedVehicle.vehicle_year}</p>
                    <p><strong>License Plate:</strong> {selectedVehicle.vehicle_serial}</p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header>Order Details</Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label><FaDollarSign className="me-2" /> Total Price</Form.Label>
                      <Form.Control 
                        type="number" 
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        placeholder="Enter total price"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label><FaCalendarAlt className="me-2" /> Estimated Completion Date</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={estimatedCompletionDate}
                        onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </Form.Group>
                    
                    <Form.Group>
                      <Form.Label><FaClipboard className="me-2" /> Additional Notes</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={3}
                        value={additionalRequest}
                        onChange={(e) => setAdditionalRequest(e.target.value)}
                        placeholder="Any additional notes or requests..."
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
                
                <Card>
                  <Card.Header>Selected Services</Card.Header>
                  <Card.Body>
                    <Table size="sm">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Assigned To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedServices.map(service => {
                          const assignment = serviceAssignments.find(sa => String(sa.service_id) === String(service.service_id));
                          const employee = employees.find(e => String(e.employee_id) === String(assignment?.employee_id));
                          return (
                            <tr key={service.service_id}>
                              <td>{service.service_name ?? `Service #${service.service_id}`}</td>
                              <td>{employee ? `${employee.employee_first_name} ${employee.employee_last_name}` : 'Unassigned'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button 
                variant="success" 
                onClick={handleCreateOrder}
                disabled={!orderPrice || !estimatedCompletionDate}
              >
                Create Order
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
      
    </Container>
  );
};

export default AddOrderForm;
