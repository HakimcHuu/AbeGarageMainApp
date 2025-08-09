import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Service from "../../services/order.service";
import ServiceSelection from "../AddServiceForm/SelectService";
import './EditOrderForm.css';

const EditOrderForm = () => {
  const location = useLocation();
  const { orderId: routeOrderId } = useParams();
  const { orderData } = location.state || {}; // May come from list shortcut

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceAssignments, setServiceAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [additionalRequest, setAdditionalRequest] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const initFromData = (data) => {
      console.log('Order Data:', orderData); // Debugging: Log the orderData received
  
      setSelectedCustomer({
        customer_first_name: data.customer_first_name,
        customer_last_name: data.customer_last_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        active_customer: data.active_customer,
      });
  
      setSelectedVehicle({
        vehicle_make: data.vehicle_make,
        vehicle_model: data.vehicle_model,
        vehicle_year: data.vehicle_year,
        vehicle_type: data.vehicle_type,
        vehicle_mileage: data.vehicle_mileage,
        vehicle_tag: data.vehicle_tag,
        vehicle_serial: data.vehicle_serial,
      });
  
      // Check and populate additionalRequest, orderPrice, and estimatedCompletionDate
      setAdditionalRequest(data.additional_request || "");
      setOrderPrice(data.order_total_price || "");
      setEstimatedCompletionDate(data.estimated_completion_date || "");
  
      // If selectedServices exist in orderData, set them in the state
      if (data.services || data.selectedServices) {
        const src = data.services || data.selectedServices;
        const formattedServices = src.map((service) => ({
          service_id: service.service_id,
          service_completed: service.service_completed || 0,
        }));
        setSelectedServices(formattedServices);
        // Initialize empty assignments (no employee) for now
        setServiceAssignments(formattedServices.map(s => ({ service_id: s.service_id, employee_id: null })));
        console.log('Pre-selected services:', formattedServices);
      }
    };

    if (orderData) {
      initFromData(orderData);
    } else if (routeOrderId) {
      // Fallback: fetch by id
      (async () => {
        try {
          const data = await Service.getOrderDetails(routeOrderId);
          initFromData({ ...data, order_id: routeOrderId, selectedServices: data.services || [] });
        } catch (e) {
          console.error('Failed to load order details for editing:', e);
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
    const updatedServiceData = services.map(serviceId => ({
      service_id: serviceId,
      service_completed: 0,
    }));
    setSelectedServices(updatedServiceData);
    setServiceAssignments(updatedServiceData.map(s => ({ service_id: s.service_id, employee_id: null })));
  };

  const handleAssignEmployeeToService = (serviceId, employeeId) => {
    const parsed = employeeId === '' ? null : Number(employeeId);
    setServiceAssignments(prev =>
      prev.map(a => (String(a.service_id) === String(serviceId) ? { ...a, employee_id: parsed } : a))
    );
  };

  const handleUpdateOrder = async () => {
    try {
      const orderInfoData = {
        order_total_price: Number(orderPrice) || 0,
        additional_request: additionalRequest,
        estimated_completion_date: estimatedCompletionDate,
      };

      // Update order using Service
      const idToUpdate = orderData?.order_id || routeOrderId;
      const resp = await Service.updateOrder({
        orderId: idToUpdate,
        orderInfoData,
        orderServiceData: serviceAssignments.length ? serviceAssignments : selectedServices,
      });

      if (!resp || resp.status !== 'success') {
        throw new Error('Update failed');
      }
      alert("Order updated successfully.");
      navigate(`/admin/orders/${idToUpdate}`);
    } catch (err) {
      console.error("Error updating the order:", err);
    }
  };

  return (
    <div className="edit-order-container">
      <h2 className="page-title">Edit Order</h2>

      {selectedCustomer && (
        <div className="card-panel">
          <h3>{`${selectedCustomer.customer_first_name} ${selectedCustomer.customer_last_name}`}</h3>
          <p>Email: {selectedCustomer.customer_email}</p>
          <p>Phone Number: {selectedCustomer.customer_phone}</p>
          <p>Active Customer: {selectedCustomer.active_customer ? "Yes" : "No"}</p>
        </div>
      )}

      {selectedVehicle && (
        <div className="card-panel mt-4">
          <h4 className="section-title">Vehicle</h4>
          <div className="vehicle-grid">
            <div><strong>Model:</strong> {selectedVehicle.vehicle_model}</div>
            <div><strong>Year:</strong> {selectedVehicle.vehicle_year}</div>
            <div><strong>Type:</strong> {selectedVehicle.vehicle_type}</div>
            <div><strong>Mileage:</strong> {selectedVehicle.vehicle_mileage}</div>
            <div><strong>Tag:</strong> {selectedVehicle.vehicle_tag}</div>
            <div><strong>Plate:</strong> {selectedVehicle.vehicle_serial}</div>
          </div>
        </div>
      )}

      {/* Service selection */}
      <div className="card-panel mt-4">
        <h4 className="section-title">Select Services</h4>
        <ServiceSelection
          onSelectServices={handleSelectServices}
          selectedServices={selectedServices.map((service) => service.service_id)}
        />

        {selectedServices.length > 0 && (
          <div className="mt-3">
            <h5 className="section-subtitle">Assignments</h5>
            <div className="assign-table">
              <div className="assign-header">
                <div>Service</div>
                <div>Assign To</div>
              </div>
              {selectedServices.map((svc) => (
                <div key={svc.service_id} className="assign-row">
                  <div>{svc.service_name ?? `Service #${svc.service_id}`}</div>
                  <div>
                    <select
                      className="assign-select"
                      value={(serviceAssignments.find(a => String(a.service_id) === String(svc.service_id))?.employee_id ?? '')}
                      onChange={(e) => handleAssignEmployeeToService(svc.service_id, e.target.value)}
                    >
                      <option value="">Assign employee</option>
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

      {/* Additional Request, Price, and Estimated Completion Date Inputs */}
      <div className="card-panel mt-4">
        <h4 className="section-title">Order Info</h4>
        <div className="form-grid">
          <div className="form-item">
            <label>Notes</label>
            <textarea
              rows={3}
              value={additionalRequest}
              onChange={(e) => setAdditionalRequest(e.target.value)}
            />
          </div>
          <div className="form-item">
            <label>Total Price</label>
            <input
              type="number"
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
            />
          </div>
          <div className="form-item">
            <label>Estimated Completion Date</label>
            <input
              type="date"
              value={estimatedCompletionDate?.slice(0,10) || ''}
              onChange={(e) => setEstimatedCompletionDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="actions">
        <button className="btn-primary" onClick={handleUpdateOrder}>
          Update Order
        </button>
      </div>
    </div>
  );
};

export default EditOrderForm;
