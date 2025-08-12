const api_url = import.meta.env.VITE_API_URL; 

// Function to fetch all services
const getAllServices = async () => {
    console.log(`Fetching services from: ${api_url}/api/services`);
    const response = await fetch(`${api_url}/api/services`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
        }
    });

    console.log('Raw response from the API:', response);
    
    const parsedResponse = await response.json();
    console.log('Parsed response data:', parsedResponse);
    
    if (parsedResponse.status !== 'success' || !parsedResponse.services) {
        console.error('Failed to fetch services:', parsedResponse);
        throw new Error('Failed to fetch services. Status: ' + parsedResponse.status);
    }

    console.log('Services data received:', parsedResponse.services);
    return parsedResponse;
};

// Function to add a new service
const addService = async (serviceData) => {
    console.log('Adding new service:', serviceData);
    const response = await fetch(`${api_url}/api/services`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
        },
        body: JSON.stringify(serviceData)
    });

    const json = await response.json().catch(() => ({}));
    console.log('Add service response:', { status: response.status, json });

    if (!response.ok) {
        throw new Error(json.message || 'Failed to add service');
    }

    // Ensure we return a consistent response format
    return {
        ...json.service,
        service_id: json.service.service_id || json.service.id // Handle both formats
    };
};

// Function to delete a service
const deleteService = async (serviceId) => {
    console.log(`Attempting to delete service with ID: ${serviceId}`);
    
    if (!serviceId) {
        console.error('No service ID provided for deletion');
        throw new Error('Service ID is required');
    }

    try {
        const response = await fetch(`${api_url}/api/services/${serviceId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
            }
        });

        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            console.error('Delete service failed:', data);
            throw new Error(data.message || 'Failed to delete service');
        }

        console.log('Service deleted successfully:', data);
        return data;
    } catch (error) {
        console.error('Error in deleteService:', error);
        throw error; // Re-throw to be handled by the component
    }
};

// Function to update a service
const updateService = async (serviceId, serviceData) => {
    console.log(`Updating service ${serviceId}:`, serviceData);
    const response = await fetch(`${api_url}/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('employee_token')}`
        },
        body: JSON.stringify(serviceData)
    });

    const json = await response.json().catch(() => ({}));
    console.log('Update service response:', { status: response.status, json });

    if (!response.ok) {
        throw new Error(json.message || 'Failed to update service');
    }

    // Ensure we return a consistent response format
    return {
        ...json.service,
        service_id: json.service.service_id || json.service.id // Handle both formats
    };
};

// Export the service functions
const serviceService = {
    getAllServices,
    addService,
    deleteService,
    updateService
};

export default serviceService;
