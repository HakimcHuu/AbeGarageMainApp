// Import from the env
const api_url = import.meta.env.VITE_API_URL;

// A function to send POST request to create a new vehicle
// Return the raw Response so callers can `.json()` like other services
const createVehicle = async (formData, token) => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify(formData),
  };
  // Backend route is singular: POST /api/vehicle
  const response = await fetch(`${api_url}/api/vehicle`, requestOptions);
  return response;
};

// A function to send GET request to get all vehicles
const getAllVehicles = async (token) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  };
  
  try {
    const response = await fetch(`${api_url}/api/vehicles`, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch vehicles');
    }
    
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return {
      success: false,
      message: error.message || 'Error fetching vehicles'
    };
  }
};

// A function to send GET request to get a vehicle by ID
const getVehicle = async (vehicleId, token) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  };
  
  try {
    const response = await fetch(`${api_url}/api/vehicles/${vehicleId}`, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch vehicle');
    }
    
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.error(`Error fetching vehicle ${vehicleId}:`, error);
    return {
      success: false,
      message: error.message || 'Error fetching vehicle'
    };
  }
};

// A function to send PUT request to update a vehicle
const updateVehicle = async (vehicleId, formData, token) => {
  const requestOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify(formData),
  };
  
  try {
    const response = await fetch(`${api_url}/api/vehicles/${vehicleId}`, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update vehicle');
    }
    
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.error(`Error updating vehicle ${vehicleId}:`, error);
    return {
      success: false,
      message: error.message || 'Error updating vehicle'
    };
  }
};

// A function to send DELETE request to remove a vehicle
const deleteVehicle = async (vehicleId, token) => {
  const requestOptions = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  };
  
  try {
    const response = await fetch(`${api_url}/api/vehicles/${vehicleId}`, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete vehicle');
    }
    
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.error(`Error deleting vehicle ${vehicleId}:`, error);
    return {
      success: false,
      message: error.message || 'Error deleting vehicle'
    };
  }
};

// Get vehicles by customer ID
const getVehiclesByCustomerId = async (customerId, token) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  };
  
  try {
    const response = await fetch(`${api_url}/api/customers/${customerId}/vehicles`, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch customer vehicles');
    }
    
    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.error(`Error fetching vehicles for customer ${customerId}:`, error);
    return {
      success: false,
      message: error.message || 'Error fetching customer vehicles'
    };
  }
};

// Add Vehicle helper that maps page form fields to backend schema (aligned with DB columns)
const addVehicle = async (customerId, raw) => {
  const token =
    localStorage.getItem("employee_token") ||
    localStorage.getItem("customer_token") ||
    "";

  const numOrNull = (v) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? null : n;
  };

  const payload = {
    customer_id: customerId,
    vehicle_make: raw?.vehicle_make ?? "",
    vehicle_model: raw?.vehicle_model ?? "",
    vehicle_year: numOrNull(raw?.vehicle_year) ?? new Date().getFullYear(),
    vehicle_license_plate: raw?.vehicle_license_plate ?? "",
    vehicle_vin: raw?.vehicle_vin || null,
    vehicle_color: raw?.vehicle_color || null,
    vehicle_mileage: numOrNull(raw?.vehicle_mileage),
    vehicle_engine_number: raw?.vehicle_engine_number || null,
    vehicle_chassis_number: raw?.vehicle_chassis_number || null,
    vehicle_transmission_type: raw?.vehicle_transmission_type || "Automatic",
    vehicle_fuel_type: raw?.vehicle_fuel_type || "Gasoline",
    last_service_date: raw?.last_service_date || null,
    next_service_date: raw?.next_service_date || null,
    insurance_provider: raw?.insurance_provider || null,
    insurance_expiry: raw?.insurance_expiry || null,
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify(payload),
  };

  try {
    // Backend route is singular: POST /api/vehicle
    const response = await fetch(`${api_url}/api/vehicle`, requestOptions);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Surface backend details to help diagnose 500 errors
      const details = data.details ? `: ${data.details}` : "";
      return {
        success: false,
        message:
          (data.error || data.message || "Failed to create vehicle") + details,
      };
    }
    return { success: true, data };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return {
      success: false,
      message: error.message || "Error creating vehicle",
    };
  }
};

// Export all the functions
const vehicleService = {
  createVehicle,
  addVehicle,
  getAllVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByCustomerId
};

export default vehicleService;