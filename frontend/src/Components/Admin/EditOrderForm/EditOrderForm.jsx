import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { 
  UserOutlined, 
  CarOutlined, 
  ToolOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  ArrowLeftOutlined,
  SaveOutlined
} from "@ant-design/icons";
import Service from "../../services/order.service";
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
  const [additionalRequest, setAdditionalRequest] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  // Initialize form with order data
  useEffect(() => {
    const initFromData = (data) => {
      const initial = {
        order_total_price: data.order_total_price || "",
        additional_request: data.additional_request || "",
        estimated_completion_date: data.estimated_completion_date || "",
        services: (data.services || data.selectedServices || []).map(s => ({
          service_id: s.service_id,
          employee_id: s.assigned_employee_id || null
        }))
      };
      setInitialData(initial);

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
      setOrderPrice(data.order_total_price || "");
      setEstimatedCompletionDate(data.estimated_completion_date || "");

      if (data.services || data.selectedServices) {
        const src = data.services || data.selectedServices;
        const formattedServices = src.map((service) => ({
          service_id: service.service_id,
          service_name: service.service_name || `Service #${service.service_id}`,
          service_completed: service.service_completed || 0,
        }));
        setSelectedServices(formattedServices);
        setServiceAssignments(
          formattedServices.map((s) => ({
            service_id: s.service_id,
            employee_id: s.assigned_employee_id || null,
          }))
        );
      }
      setIsLoading(false);
    };

    if (orderData) {
      initFromData(orderData);
    } else if (routeOrderId) {
      (async () => {
        try {
          setIsLoading(true);
          const data = await Service.getOrderDetails(routeOrderId);
          initFromData({ ...data, order_id: routeOrderId, selectedServices: data.services || [] });
        } catch (e) {
          console.error('Failed to load order details for editing:', e);
          setIsLoading(false);
        }
      })();
    }
  }, [orderData, routeOrderId]);

  // Load employees if there are services to assign
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const emps = await Service.getEmployeesByRole(1);
        setEmployees(emps || []);
      } catch (e) {
        console.error('Failed to load employees for assignment', e);
      }
    };
    
    if (selectedServices.length > 0) {
      loadEmployees();
    } else {
      setEmployees([]);
    }
  }, [selectedServices]);
  
  const handleSelectServices = (services) => {
    const updatedServiceData = services.map(serviceId => {
      const existing = selectedServices.find(s => s.service_id === serviceId);
      return existing || { 
        service_id: serviceId, 
        service_name: `Service #${serviceId}`,
        service_completed: 0 
      };
    });
    
    setSelectedServices(updatedServiceData);
    setServiceAssignments(prev => [
      ...prev.filter(a => services.includes(a.service_id)),
      ...updatedServiceData
        .filter(s => !prev.some(a => a.service_id === s.service_id))
        .map(s => ({
          service_id: s.service_id,
          employee_id: null
        }))
    ]);
  };

  const handleAssignEmployeeToService = (serviceId, employeeId) => {
    const parsed = employeeId === '' ? null : Number(employeeId);
    setServiceAssignments(prev =>
      prev.map(a => (a.service_id === serviceId ? { ...a, employee_id: parsed } : a))
    );
  };

  const handleUpdateOrder = async () => {
    try {
      // Check if any changes were made
      const currentData = {
        order_total_price: Number(orderPrice) || 0,
        additional_request: additionalRequest,
        estimated_completion_date: estimatedCompletionDate,
        services: serviceAssignments
      };

      // Compare current data with initial data
      const hasChanges = !initialData || 
        JSON.stringify(currentData) !== JSON.stringify({
          ...initialData,
          order_total_price: Number(initialData.order_total_price) || 0,
          services: initialData.services.map(s => ({
            service_id: s.service_id,
            employee_id: s.employee_id
          }))
        });

      if (!hasChanges) {
        alert("No changes were made to save.");
        return;
      }

      setIsLoading(true);
      const orderInfoData = {
        order_total_price: currentData.order_total_price,
        additional_request: currentData.additional_request,
        estimated_completion_date: currentData.estimated_completion_date,
      };

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
      navigate(`/admin/orders/${idToUpdate}`);
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
        />

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
            />
          </div>
          <div className="form-item">
            <label>Estimated Completion</label>
            <input
              type="date"
              value={estimatedCompletionDate}
              onChange={(e) => setEstimatedCompletionDate(e.target.value)}
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
          disabled={isLoading}
        >
          <SaveOutlined /> {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default EditOrderForm;
