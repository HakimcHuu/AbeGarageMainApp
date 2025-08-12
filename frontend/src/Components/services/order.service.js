const api_url = import.meta.env.VITE_API_URL;

const getCustomers = async (searchQuery = '') => {
    console.log("Search Query in Service:", searchQuery); 
    const response = await fetch(`${api_url}/api/customers?search=${searchQuery}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('employee_token')}`,
        },
    });

    console.log("Response status:", response.status);
    if (!response.ok) {
        throw new Error('Failed to fetch customers');
    }

    const data = await response.json();
    console.log("Data received from API:", data);

    return data;
};

const getVehicles = async (customerId) => {
    console.log("API URL:", api_url);
    console.log("Customer ID in Service:", customerId);
  
    try {
      const response = await fetch(
        `${api_url}/api/customers/${customerId}/vehicles`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("employee_token")}`,
          },
        }
      );
  
      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text(); 
        throw new Error(
          `Failed to fetch vehicles: ${response.status} ${response.statusText}. ${errorText}`
        );
      }
  
      const data = await response.json();
      console.log("Data received from API (vehicles):", data);
  
      // Accessing vehicles from data field
      return data.data;
    } catch (error) {
      console.error("Fetch Error:", error);
      throw error;
    }
  };
  
  const getServices = async () => {
    // console.log("API URL:", api_url);
  
    try {
      const response = await fetch(`${api_url}/api/services`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("employee_token")}`,
        },
      });
  
      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch services: ${response.status} ${response.statusText}. ${errorText}`
        );
      }
  
      const data = await response.json();
      console.log(
        "Data received from API (service):",
        JSON.stringify(data, null, 2)
      );
  
      // Accessing services from data field
      return data.data;
    } catch (error) {
      console.error("Fetch Error:", error);
      throw error;
    }
};

// get employees by their role
async function getEmployeesByRole(roleId) {
  console.log(`[Frontend] Fetching employees for role: ${roleId}`);
  
  try {
    const response = await fetch(`${api_url}/api/employees/role/${roleId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('employee_token')}`, 
      },
    });

    console.log(`[Frontend] Response status for role ${roleId}:`, response.status);

    if (!response.ok) {
      throw new Error(`[Frontend] Error fetching employees for role ${roleId}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[Frontend] Data received from API (employees for role ${roleId}):`, data);

    return data.data;
  } catch (error) {
    console.error(`[Frontend] Error fetching employees for role ${roleId}:`, error);
    throw error;
  }
}

// Create an order (for the customer with vehicle, services, and employee assignments)
const createOrder = async (OrderData) => {
  try {
    // Log the entire order data including employee-service assignments
    console.log("Outgoing OrderData:", JSON.stringify(OrderData));

    const response = await fetch(`${api_url}/api/order/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('employee_token')}`, 
      },
      body: JSON.stringify({
        orderData: OrderData.orderData,         
        orderInfoData: OrderData.orderInfoData, 
        orderServiceData: OrderData.orderServiceData, 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create the order');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating the full order:", error);
    throw error;
  }
};


// Fetch all orders
const getAllOrders = async () => {
  try {
    console.log("Sending request to:", `${api_url}/api/orders`);
    
    const token = localStorage.getItem('employee_token');
    const response = await fetch(`${api_url}/api/orders?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token || '',
      },
    });

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Raw API response:", data);
    
    // Handle different response formats
    let orders = [];
    
    // Case 1: Data is directly an array
    if (Array.isArray(data)) {
      console.log("Response is an array");
      orders = data;
    } 
    // Case 2: Data has a data property that's an array
    else if (data.data && Array.isArray(data.data)) {
      console.log("Response has data array");
      orders = data.data;
    }
    // Case 3: Data has a data property with an orders array
    else if (data.data && data.data.orders && Array.isArray(data.data.orders)) {
      console.log("Response has data.orders array");
      orders = data.data.orders;
    }
    // Case 4: Data has an orders array
    else if (data.orders && Array.isArray(data.orders)) {
      console.log("Response has orders array");
      orders = data.orders;
    }
    
    // Remove duplicates by creating a Map with order_id as key
    const uniqueOrdersMap = new Map();
    orders.forEach(order => {
      if (order && order.order_id) {
        uniqueOrdersMap.set(order.order_id, order);
      }
    });
    
    // Convert Map values back to array
    const uniqueOrders = Array.from(uniqueOrdersMap.values());
    
    console.log(`Extracted ${uniqueOrders.length} unique orders from ${orders.length} total orders`);
    
    // Ensure we always return the expected format
    return { 
      status: "success", 
      data: { 
        orders: uniqueOrders
      } 
    };
    
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    // Return empty orders array on error to prevent frontend crash
    return { 
      status: "error", 
      message: error.message,
      data: { 
        orders: [] 
      } 
    };
  }
};

const getOrderDetails = async (orderId) => { 
  try {
    console.log(`Fetching order details for order ID: ${orderId}`);
    const response = await fetch(`${api_url}/api/order/${orderId}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('employee_token')}`,
      },
    });

    const data = await response.json();
    console.log('Order details API response:', data);

    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch order details: ${response.statusText}`);
    }

    // Handle different response formats
    if (data.status === 'success') {
      return data.data || data;
    } else if (data.order) {
      return data.order;
    } else if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    
    return data;
    
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    throw error;
  }
};

// Update an order (info + services)
const updateOrder = async ({ orderId, orderInfoData, orderServiceData }) => {
  try {
    const response = await fetch(`${api_url}/api/order/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('employee_token')}`,
      },
      body: JSON.stringify({
        orderInfoData: {
          additional_request: orderInfoData?.additional_request ?? '',
          order_total_price: orderInfoData?.order_total_price ?? null,
          estimated_completion_date: orderInfoData?.estimated_completion_date ?? null,
          completion_date: null,
          additional_request_employee_id: orderInfoData?.additional_request_employee_id ?? null,
          additional_request_status: orderInfoData?.additional_request_status ?? 'pending'
        },
        order_services: Array.isArray(orderServiceData) ? orderServiceData : [],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to update order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};




// get order id from the task
const getOrderIdFromTask = async (orderServiceId) => {
  try {
    const response = await fetch(`${api_url}/api/order/task/${orderServiceId}/order-id`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching order ID for task ${orderServiceId}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.order_id;
  } catch (error) {
    console.error("Error in getOrderIdFromTask:", error);
    throw error;
  }
};

//get all services for a specific order
const getAllServicesForOrder = async (orderId) => {
  try {
    const response = await fetch(`${api_url}/api/order/${orderId}/services`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching services for order ${orderId}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getAllServicesForOrder:", error);
    throw error;
  }
};


// Update the status of an order
const updateOrderStatus = async (orderId, status, token) => {
  try {
    console.log(`[updateOrderStatus] Updating order ${orderId} to status ${status}`);
    const response = await fetch(`${api_url}/api/order/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token || localStorage.getItem("employee_token") || localStorage.getItem("customer_token"),
        "Authorization": `Bearer ${token || localStorage.getItem("employee_token") || localStorage.getItem("customer_token")}`
      },
      body: JSON.stringify({ status: Number(status) }), // Ensure status is a number
    });

    const data = await response.json();
    console.log(`[updateOrderStatus] Response for order ${orderId}:`, data);

    if (!response.ok) {
      throw new Error(data.message || `Error updating order status: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    throw error;
  }
};

// Fetch order status history
const getOrderStatusHistory = async (orderId) => {
  try {
    const response = await fetch(`${api_url}/api/order/${orderId}/status-history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('employee_token')}`,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch status history');
    return data.data || [];
  } catch (error) {
    console.error('Error fetching order status history:', error);
    return [];
  }
};


// delete order
const deleteOrder = async (orderId) => {
  try {
    const response = await fetch(`${api_url}/api/order/${orderId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("employee_token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete order with ID: ${orderId}`);
    }

    const data = await response.json();
    console.log("Order deleted successfully:", data);
    return data;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

export default {
  getCustomers,
  getVehicles,
  getServices,
  getEmployeesByRole,
  createOrder,
  getAllOrders,
  getOrderDetails,
  getOrderIdFromTask,
  getAllServicesForOrder,
  deleteOrder,
  updateOrderStatus,
  updateOrder,
  getOrderStatusHistory,
};
