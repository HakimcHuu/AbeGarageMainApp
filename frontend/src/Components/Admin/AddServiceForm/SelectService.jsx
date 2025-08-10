import { useState, useEffect } from "react";
import serviceService from "../../services/service.service";

const ServiceSelection = ({ onSelectServices, selectedServices = [], disabled = false }) => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const resp = await serviceService.getAllServices();
      const list = resp.services || [];
      setServices(list);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      setError("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Set selected IDs when services are loaded and we have selectedServices
  useEffect(() => {
    if (services.length > 0 && selectedServices && selectedServices.length > 0) {
      const ids = selectedServices.map(service => {
        const id = typeof service === 'object' ? service.service_id : service;
        return Number(id); // Ensure it's a number
      });
      console.log("Services loaded, setting selectedIds to:", ids);
      setSelectedIds(ids);
    }
  }, [services, selectedServices]);

  // Initialize selectedIds when selectedServices prop changes
  useEffect(() => {
    console.log("ServiceSelection received selectedServices:", selectedServices);
    console.log("Services loaded:", services.length);
    
    if (selectedServices && selectedServices.length > 0 && services.length > 0) {
      const ids = selectedServices.map(service => {
        const id = typeof service === 'object' ? service.service_id : service;
        return Number(id); // Ensure it's a number
      });
      console.log("Setting selectedIds to:", ids);
      setSelectedIds(ids);
    } else if (selectedServices && selectedServices.length > 0 && services.length === 0) {
      console.log("Services not loaded yet, will set selectedIds when services load");
    } else {
      console.log("Setting selectedIds to empty array");
      setSelectedIds([]);
    }
  }, [selectedServices, services]);

  const handleToggle = (service) => {
    if (disabled) return;
    let updated;
    const serviceId = Number(service.service_id);
    if (selectedIds.includes(serviceId)) {
      updated = selectedIds.filter((id) => id !== serviceId);
    } else {
      updated = [...selectedIds, serviceId];
    }
    setSelectedIds(updated);

    // Pass objects with id+name so parent can display names later
    const selectedObjects = services
      .filter((s) => updated.includes(s.service_id))
      .map((s) => ({ service_id: s.service_id, service_name: s.service_name }));

    onSelectServices(selectedObjects);
  };

  const handleSeedDefaults = async () => {
    try {
      await serviceService.seedDefaults();
      await loadServices();
    } catch (e) {
      console.error("Failed to seed default services", e);
      setError("Failed to seed default services");
    }
  };

  return (
    <div className="service-selection mt-4 container-width">
      <h4>Choose Service & Assign Employee</h4>
      {loading && <p>Loading services...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && services.length === 0 && (
        <div className="d-flex align-items-center gap-2">
          <p className="mb-0">No services available.</p>
          <button className="btn btn-sm btn-outline-primary" onClick={handleSeedDefaults} disabled={disabled}>
            Seed default services
          </button>
        </div>
      )}

      {!loading && services.length > 0 && (
        <div className="list-group">
          {services.map((service) => (
            <div key={service.service_id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5>{service.service_name}</h5>
                  <p>{service.service_description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(Number(service.service_id))}
                  onChange={() => handleToggle(service)}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;
