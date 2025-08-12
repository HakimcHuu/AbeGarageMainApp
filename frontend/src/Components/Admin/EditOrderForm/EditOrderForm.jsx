import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { 
  UserOutlined, 
  CarOutlined, 
  ToolOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import Service from "../../services/order.service";
import employeeService from "../../services/employee.service";
import ServiceSelection from "../AddServiceForm/SelectService";
import './EditOrderForm.css';

const EditOrderForm = () => {
  const location = useLocation();
  const { orderId: routeOrderId } = useParams();
  const { orderData } = location.state || {};
  const navigate = useNavigate();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const normalizeActiveFlag = (val) => val === true || val === 1 || val === '1' || String(val).toLowerCase() === 'true';
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceAssignments, setServiceAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const ADDITIONAL_REQUEST_SERVICE_ID = -1; // Unique ID for additional requests
  const [additionalRequest, setAdditionalRequest] = useState("");
  const [additionalRequestEmployeeId, setAdditionalRequestEmployeeId] = useState(null);
  const [additionalRequestStatus, setAdditionalRequestStatus] = useState('pending'); // ENUM: 'pending', 'in_progress', 'completed', 'cancelled'
  const [orderPrice, setOrderPrice] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(1);
  const isEditable = currentStatus !== 5 && currentStatus !== 6; // editable unless Done(5) or Cancelled(6)

  // Function to check if data has changed
  const checkForChanges = (currentData, originalData) => {
    if (!originalData) return true;
    
    // Compare basic fields
    const basicFieldsChanged = 
      currentData.order_total_price !== originalData.order_total_price ||
      currentData.additional_request !== originalData.additional_request ||
      currentData.estimated_completion_date !== originalData.estimated_completion_date ||
      currentData.additional_request_employee_id !== originalData.additional_request_employee_id ||
      currentData.additional_request_status !== originalData.additional_request_status;
    
    if (basicFieldsChanged) return true;
    
    // Compare services and assignments
    const currentServices = currentData.services || [];
    const originalServices = originalData.services || [];
    
    if (currentServices.length !== originalServices.length) return true;
    
    // Check if any service assignments have changed
    for (let i = 0; i < currentServices.length; i++) {
      const current = currentServices[i];
      const original = originalServices[i];
      
      if (current.service_id !== original.service_id ||
          current.employee_id !== original.employee_id) {
        return true;
      }
    }
    
    return false;
  };

  // Initialize form with order data
  useEffect(() => {
    const initFromData = (data) => {
      console.log("Initializing form with data:", data);
      
      // Format estimated completion date for input field
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
      };

      const initial = {
        order_total_price: data.order_total_price || "",
        additional_request: data.additional_request || "",
        estimated_completion_date: formatDateForInput(data.estimated_completion_date),
        additional_request_employee_id: data.additional_request_employee_id || null,
        additional_request_status: data.additional_request_status || 'pending', // Ensure it's a string for ENUM
        services: (data.services || data.selectedServices || []).map(s => {
          let employeeId = null;
          
          // Check if there's an assigned employee in the assigned array
          if (s.assigned && s.assigned.length > 0) {
            employeeId = s.assigned[0].employee_id;
          }
          // Fallback to direct properties if assigned array doesn't exist
          else {
            employeeId = s.assigned_employee_id || s.employee_id || null;
          }
          
          return {
            service_id: s.service_id,
            employee_id: employeeId
          };
        })
      };
      setInitialData(initial);
      if (typeof data.order_status === 'number') setCurrentStatus(Number(data.order_status));

      setSelectedCustomer({
        customer_id: data.customer_id,
        customer_first_name: data.customer_first_name,
        customer_last_name: data.customer_last_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        active_customer: data.active_customer !== undefined ? normalizeActiveFlag(data.active_customer) : undefined,
      });

      setSelectedVehicle({
        vehicle_make: data.vehicle_make,
        vehicle_model: data.vehicle_model,
        vehicle_year: data.vehicle_year,
        vehicle_type: data.vehicle_type,
        vehicle_mileage: data.vehicle_mileage,
        vehicle_tag: data.vehicle_tag,
        vehicle_license_plate: data.vehicle_license_plate,
      });

      setAdditionalRequest(data.additional_request || "");
      setAdditionalRequestEmployeeId(data.additional_request_employee_id || null);
      setAdditionalRequestStatus(data.additional_request_status || 'pending'); // Ensure it's a string for ENUM
      setOrderPrice(data.order_total_price || "");
      setEstimatedCompletionDate(formatDateForInput(data.estimated_completion_date));

      if (data.services || data.selectedServices) {
        const src = data.services || data.selectedServices;
        console.log("Services data structure:", src);
        const formattedServices = src.map((service) => ({
          service_id: service.service_id,
          service_name: service.service_name || `Service #${service.service_id}`,
          service_completed: service.service_completed || 0,
          service_status: service.service_status || 0,
        }));
        setSelectedServices(formattedServices);
        
        const assignments = formattedServices.map((s) => {
          // Find the original service data to get employee assignment
          const originalService = src.find(orig => orig.service_id === s.service_id);
          let employeeId = null;
          
          // Check if there's an assigned employee in the assigned array
          if (originalService && originalService.assigned && originalService.assigned.length > 0) {
            employeeId = originalService.assigned[0].employee_id;
          }
          // Fallback to direct properties if assigned array doesn't exist
          else if (originalService) {
            employeeId = originalService.assigned_employee_id || originalService.employee_id || null;
          }
          
          return {
            service_id: s.service_id,
            employee_id: employeeId,
          };
        });
        console.log("Service assignments:", assignments);
        setServiceAssignments(assignments);
      }
      setIsLoading(false);
    };

    (async () => {
      try {
        setIsLoading(true);
        // Seed immediate view with passed list record if available
        if (orderData) {
          initFromData(orderData);
        }
        // Always fetch full details to hydrate assignments, statuses, etc.
        if (routeOrderId) {
          const full = await Service.getOrderDetails(routeOrderId);
          console.log("Loaded full order details:", full);
          initFromData({ 
            ...full, 
            order_id: routeOrderId, 
            selectedServices: full.services || [],
            additional_request_employee_id: full.additional_request_employee_id,
            additional_request_status: full.additional_request_status,
          });
          if (typeof full.order_status === 'number') setCurrentStatus(Number(full.order_status));
        }
      } catch (e) {
        console.error('Failed to load order details for editing:', e);
        alert('Failed to load order details. Please try again.');
        navigate('/admin/orders');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [orderData, routeOrderId, navigate]);

  // Load employees for service assignments
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        console.log("Loading all employees...");
        const response = await employeeService.getAllEmployees(localStorage.getItem('employee_token'));
        if (response.ok) {
          const data = await response.json();
          console.log("Employees loaded:", data.data);
          setEmployees(data.data || []);
        } else {
          console.error('Failed to load employees:', response.statusText);
        }
      } catch (error) {
        console.error('Failed to load employees:', error);
      }
    };
    loadEmployees();
  }, []);

  // Monitor changes and update hasChanges state
  useEffect(() => {
    const currentData = {
      order_total_price: orderPrice,
      additional_request: additionalRequest,
      estimated_completion_date: estimatedCompletionDate,
      additional_request_employee_id: additionalRequestEmployeeId,
      additional_request_status: additionalRequestStatus,
      services: serviceAssignments
    };
    
    const changed = checkForChanges(currentData, initialData);
    setHasChanges(changed);
  }, [orderPrice, additionalRequest, estimatedCompletionDate, additionalRequestEmployeeId, additionalRequestStatus, serviceAssignments, initialData]);

  const handleSelectServices = (services) => {
    const formattedServices = services.map((service) => ({
      service_id: service.service_id,
      service_name: service.service_name,
      service_completed: 0,
      service_status: 0, // Default to pending
    }));
    setSelectedServices(formattedServices);
    
    // Update assignments to include new services
    const newAssignments = formattedServices.map((s) => ({
      service_id: s.service_id,
      employee_id: serviceAssignments.find(a => a.service_id === s.service_id)?.employee_id || null,
    }));
    setServiceAssignments(newAssignments);
  };

  const handleAssignEmployeeToService = (serviceId, employeeId) => {
    if (serviceId === ADDITIONAL_REQUEST_SERVICE_ID) {
      setAdditionalRequestEmployeeId(employeeId || null);
    } else {
      setServiceAssignments(prev => 
        prev.map(assignment => 
          assignment.service_id === serviceId 
            ? { ...assignment, employee_id: employeeId || null }
            : assignment
        )
      );
    }
  };

  const handleUpdateOrder = async () => {
    try {
      // Check if any changes were made
      const currentData = {
        order_total_price: Number(orderPrice) || 0,
        additional_request: additionalRequest,
        estimated_completion_date: estimatedCompletionDate,
        additional_request_employee_id: additionalRequestEmployeeId,
        additional_request_status: additionalRequestStatus, // Default to current status
        services: serviceAssignments
      };

      // Logic to reset additional_request_status if additional_request text is changed
      let updatedAdditionalRequestStatus = additionalRequestStatus;
      if (initialData && initialData.additional_request !== additionalRequest) {
        updatedAdditionalRequestStatus = 'pending';
        console.log("Additional request text changed, resetting status to 'pending'.");
      }

      if (!hasChanges) {
        alert("No changes were made to save. The order is already up to date.");
        return;
      }

      // Confirm with user before saving
      const confirmSave = window.confirm(
        "Are you sure you want to save these changes to the order?"
      );
      
      if (!confirmSave) {
        return;
      }

      setIsLoading(true);
      const orderInfoData = {
        order_total_price: currentData.order_total_price,
        additional_request: currentData.additional_request,
        estimated_completion_date: currentData.estimated_completion_date,
        additional_request_employee_id: currentData.additional_request_employee_id,
        additional_request_status: updatedAdditionalRequestStatus, // Use the potentially updated status
      };
      console.log("Sending orderInfoData to backend:", orderInfoData); // Add this log

      const idToUpdate = orderData?.order_id || routeOrderId;
      const resp = await Service.updateOrder({
        orderId: idToUpdate,
        orderInfoData,
        orderServiceData: currentData.services,
      });

      if (!resp || resp.status !== 'success') {
        throw new Error('Update failed');
      }
      
      // Show success message and navigate back
      alert("Order updated successfully!");
      // Force a full page reload to ensure all data is fresh
      window.location.reload(); 
      // navigate(`/admin/orders/${idToUpdate}`); // Removed, as reload handles navigation
    } catch (err) {
      console.error("Error updating the order:", err);
      alert("Failed to update order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="edit-order-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-order-container">
      <div className="page-header">
        <button 
          className="btn btn-outline" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeftOutlined /> Back to Orders
        </button>
        <h1 className="page-title">Edit Order #{orderData?.order_id || routeOrderId}</h1>
        {(!isEditable) && (
          <div className="no-changes-alert" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#ef4444' }}>
            <ExclamationCircleOutlined /> This order status is not editable. Change status to Received to make edits.
          </div>
        )}
        {!hasChanges && (
          <div className="no-changes-alert">
            <ExclamationCircleOutlined /> No changes detected
          </div>
        )}
      </div>

      {/* Customer Information */}
      <div className="card-panel">
        <h2 className="section-title">
          <UserOutlined /> Customer Information
        </h2>
        <div className="customer-grid">
          <div className="form-item">
            <label>Name</label>
            <div className="form-control">
              {`${selectedCustomer?.customer_first_name || ''} ${selectedCustomer?.customer_last_name || ''}`}
            </div>
          </div>
          <div className="form-item">
            <label>Email</label>
            <div className="form-control">
              {selectedCustomer?.customer_email || 'N/A'}
            </div>
          </div>
          <div className="form-item">
            <label>Phone</label>
            <div className="form-control">
              {selectedCustomer?.customer_phone || 'N/A'}
            </div>
          </div>
          <div className="form-item">
            <label>Status</label>
            <div className="form-control">
              {selectedCustomer?.active_customer ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="card-panel">
        <h2 className="section-title">
          <CarOutlined /> Vehicle Information
        </h2>
        <div className="vehicle-grid">
          <div className="vehicle-detail">
            <strong>Make</strong>
            {selectedVehicle?.vehicle_make || 'N/A'}
          </div>
          <div className="vehicle-detail">
            <strong>Model</strong>
            {selectedVehicle?.vehicle_model || 'N/A'}
          </div>
          <div className="vehicle-detail">
            <strong>Year</strong>
            {selectedVehicle?.vehicle_year || 'N/A'}
          </div>
          <div className="vehicle-detail">
            <strong>Type</strong>
            {selectedVehicle?.vehicle_type || 'N/A'}
          </div>
          <div className="vehicle-detail">
            <strong>Mileage</strong>
            {selectedVehicle?.vehicle_mileage ? `${selectedVehicle.vehicle_mileage} km` : 'N/A'}
          </div>
          <div className="vehicle-detail">
            <strong>License Plate</strong>
            {selectedVehicle?.vehicle_license_plate || 'N/A'}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="card-panel">
        <h2 className="section-title">
          <ToolOutlined /> Services
        </h2>
        
        <ServiceSelection
          onSelectServices={handleSelectServices}
          selectedServices={selectedServices.map(s => s.service_id)}
          disabled={!isEditable}
        />
        {console.log("Selected services for ServiceSelection:", selectedServices.map(s => s.service_id))}

        {selectedServices.length > 0 && (
          <div className="mt-4">
            <h3 className="section-subtitle">Service Assignments</h3>
            <div className="assign-table">
              <div className="assign-header">
                <div>Service</div>
                <div>Assigned To</div>
              </div>
              {selectedServices.map((service) => (
                <div 
                  key={service.service_id} 
                  className="assign-row"
                  data-label={`Service: ${service.service_name}`}
                >
                  <div className="service-name">{service.service_name}</div>
                  <div className="assign-control">
                    <select
                      value={serviceAssignments.find(a => a.service_id === service.service_id)?.employee_id || ''}
                      onChange={(e) => handleAssignEmployeeToService(service.service_id, e.target.value)}
                      className="assign-select"
                      disabled={!isEditable}
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.employee_first_name} {emp.employee_last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {additionalRequest && (
                <div 
                  key={ADDITIONAL_REQUEST_SERVICE_ID} 
                  className="assign-row"
                  data-label="Service: Additional Requests"
                >
                  <div className="service-name">Additional Requests</div>
                  <div className="assign-control">
                    <select
                      value={additionalRequestEmployeeId || ''}
                      onChange={(e) => handleAssignEmployeeToService(ADDITIONAL_REQUEST_SERVICE_ID, e.target.value)}
                      className="assign-select"
                      disabled={!isEditable}
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.employee_first_name} {emp.employee_last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="card-panel">
        <h2 className="section-title">
          <DollarOutlined /> Order Details
        </h2>
        <div className="form-grid">
          <div className="form-item">
            <label>Total Price ($)</label>
              <input
              type="number"
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              placeholder="Enter total price"
              min="0"
              step="0.01"
                disabled={!isEditable}
            />
          </div>
          <div className="form-item">
            <label>Estimated Completion</label>
              <input
              type="date"
              value={estimatedCompletionDate}
              onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                disabled={!isEditable}
            />
          </div>
        </div>
        <div className="form-item">
          <label>Additional Requests</label>
              <textarea
            value={additionalRequest}
            onChange={(e) => setAdditionalRequest(e.target.value)}
            placeholder="Any special instructions or notes..."
            rows={4}
                disabled={!isEditable}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions">
        <button 
          className="btn btn-outline" 
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleUpdateOrder}
          disabled={isLoading || !hasChanges || !isEditable}
        >
          <SaveOutlined /> {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default EditOrderForm;
