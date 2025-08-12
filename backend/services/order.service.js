const db = require("../config/db.config");

// Helper function to get service price by ID
const getServicePrice = async (serviceId) => {
  try {
    const idNum = Number(serviceId);
    const rows = await db.query(
      "SELECT service_price FROM common_services WHERE service_id = ?",
      [idNum]
    );
    if (!rows || rows.length === 0) {
      console.error(
        `Service with ID ${serviceId} not found in common_services`
      );
      return 0;
    }
    return rows[0].service_price || 0;
  } catch (error) {
    console.error(`Error fetching price for service ${serviceId}:`, error);
    throw error;
  }
};

// Service to handle creating the entire order (order + order details + services)
const createOrder = async (orderData, orderInfoData, orderServiceData) => {
  try {
    console.log("Starting order creation");
    let createdOrder = {};

    // Log the input data for debugging
    console.log("Order data:", JSON.stringify(orderData, null, 2));
    console.log("Order info data:", JSON.stringify(orderInfoData, null, 2));
    console.log(
      "Order service data:",
      JSON.stringify(orderServiceData, null, 2)
    );

    // Normalize status to schema (ENUM of strings)
    const normalizedOrderStatus =
      typeof orderData.order_status === "string"
        ? orderData.order_status
        : "pending";

    // Insert the main order details into the `orders` table
    const orderInsertQuery = `
        INSERT INTO orders (customer_id, vehicle_id, employee_id, active_order, order_hash, order_status)
        VALUES (?, ?, ?, ?, ?, ?)
        `;
    console.log("Executing order insert query:", orderInsertQuery, [
      orderData.customer_id,
      orderData.vehicle_id,
      orderData.employee_id,
      orderData.active_order,
      orderData.order_hash,
      normalizedOrderStatus, // ENUM expects string
    ]);

    const orderResult = await db.query(orderInsertQuery, [
      orderData.customer_id,
      orderData.vehicle_id,
      orderData.employee_id,
      orderData.active_order,
      orderData.order_hash,
      normalizedOrderStatus,
    ]);
    console.log("Result of orders table insert:", orderResult);

    // Get the generated order_id from the orders insert
    const orderId = orderResult.insertId;
    console.log("Created order with ID:", orderId);

    // Insert the order information into the `order_info` table
    const orderInfoInsertQuery = `
            INSERT INTO order_info (order_id, order_total_price, additional_request, estimated_completion_date, additional_request_employee_id, additional_request_status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
    console.log("Executing order info insert query:", orderInfoInsertQuery, [
      orderId,
      orderInfoData.order_total_price,
      orderInfoData.additional_request,
      orderInfoData.estimated_completion_date,
      orderInfoData.additional_request_employee_id,
      orderInfoData.additional_request_status,
    ]);
    await db.query(orderInfoInsertQuery, [
      orderId,
      orderInfoData.order_total_price,
      orderInfoData.additional_request,
      orderInfoData.estimated_completion_date,
      orderInfoData.additional_request_employee_id,
      orderInfoData.additional_request_status,
    ]);

    let totalOrderPrice = 0;

    // Process each service in the order to calculate total price and insert services
    for (const [index, service] of orderServiceData.entries()) {
      console.log(
        `Processing service ${index + 1}/${orderServiceData.length}`,
        service
      );

      try {
        // Get the service price from common_services
        console.log(`Fetching price for service ID: ${service.service_id}`);
        const servicePrice = await getServicePrice(service.service_id);
        console.log(
          `Retrieved price for service ${service.service_id}:`,
          servicePrice
        );

        // Add service price to total order price
        totalOrderPrice += parseFloat(servicePrice);

        // Insert the service with its price
        const serviceInsertQuery = `
                INSERT INTO order_services (order_id, service_id, service_price, service_status, service_completed)
                VALUES (?, ?, ?, ?, ?)
                `;
        const params = [
          orderId,
          service.service_id,
          servicePrice,
          "pending",
          service.service_completed,
        ];
        console.log(
          "Executing service insert query:",
          serviceInsertQuery,
          params
        );

        const serviceResult = await db.query(serviceInsertQuery, params);
        const orderServiceId = serviceResult.insertId;
        console.log(`Created order service with ID: ${orderServiceId}`);

        // Assign employees to each service in the `order_service_employee` table
        const serviceEmployeeQuery = `
                INSERT INTO order_service_employee (order_service_id, employee_id, is_primary)
                VALUES (?, ?, 1)
                `;
        console.log("Assigning employee to service:", serviceEmployeeQuery, [
          orderServiceId,
          service.employee_id,
        ]);
        await db.query(serviceEmployeeQuery, [
          orderServiceId,
          service.employee_id,
        ]);

        // Insert the initial service status into the `order_status_history` table
        const orderStatusServiceQuery = `
                INSERT INTO order_status_history (order_id, order_service_id, status, changed_by)
                VALUES (?, ?, 'pending', ?)
                `;
        console.log(
          "Creating initial service status:",
          orderStatusServiceQuery,
          [orderId, orderServiceId, orderData.employee_id]
        );
        await db.query(orderStatusServiceQuery, [
          orderId,
          orderServiceId,
          orderData.employee_id,
        ]);
      } catch (serviceError) {
        console.error(
          `Error processing service ${service.service_id}:`,
          serviceError
        );
        throw serviceError;
      }
    }

    // Update the order_info with the calculated total price
    const updateOrderInfoQuery = `
            UPDATE order_info
            SET order_total_price = ?
            WHERE order_id = ?
        `;
    console.log("Updating order info with total price:", updateOrderInfoQuery, [
      totalOrderPrice,
      orderId,
    ]);
    await db.query(updateOrderInfoQuery, [totalOrderPrice, orderId]);

    // Insert the overall order status into the `order_status_history` table
    const orderStatusQuery = `
            INSERT INTO order_status_history (order_id, status, changed_by)
            VALUES (?, ?, ?)
        `;
    console.log("Creating initial order status:", orderStatusQuery, [
      orderId,
      normalizedOrderStatus,
      orderData.employee_id,
    ]);
    await db.query(orderStatusQuery, [
      orderId,
      normalizedOrderStatus,
      orderData.employee_id,
    ]);

    console.log("Order created successfully");
    createdOrder = { order_id: orderId };
    return { message: "Order created successfully", createdOrder };
  } catch (error) {
    // Log detailed error information
    console.error("Error in createOrder:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack,
    });

    const errorMessage =
      error.sqlMessage || error.message || "Unknown error occurred";
    const dbError = new Error(`Database error: ${errorMessage}`);
    dbError.originalError = error;
    throw dbError;
  }
};

// get all orders
const getAllOrders = async () => {
  try {
    // First, check if there are any orders in the database
    const checkOrdersQuery = `SELECT COUNT(*) as count FROM orders`;
    const countResult = await db.query(checkOrdersQuery);
    console.log(`Total orders in database: ${countResult[0].count}`);

    // If no orders, return empty array
    if (countResult[0].count === 0) {
      console.log("No orders found in the database");
      return [];
    }

    // Get all orders with detailed logging
    const query = `
            SELECT
                o.order_id,
                o.order_date,
                o.order_status,
                o.customer_id,
                o.vehicle_id,
                o.employee_id,
                ci.customer_first_name,
                ci.customer_last_name,
                c.customer_email,
                ci.customer_phone,
                c.active_customer,
                v.vehicle_make,
                v.vehicle_model,
                v.vehicle_year,
                v.vehicle_license_plate,
                v.vehicle_vin,
                v.vehicle_mileage,
                e.employee_first_name,
                e.employee_last_name,
                oi.order_total_price,
                oi.estimated_completion_date,
                oi.additional_request,
                oi.additional_request_employee_id,
                oi.additional_request_status,
                are.employee_first_name AS additional_request_employee_first_name,
                are.employee_last_name AS additional_request_employee_last_name,
                svc.service_items,
                agg.checked_count AS checked_count,
                agg.submitted_count AS submitted_count,
                agg.total_count AS total_count
            FROM orders o
            LEFT JOIN customer_info ci ON o.customer_id = ci.customer_id
            LEFT JOIN customer c ON ci.customer_id = c.customer_id
            LEFT JOIN customer_vehicle_info v ON o.vehicle_id = v.vehicle_id
            LEFT JOIN employee_info e ON o.employee_id = e.employee_id
            LEFT JOIN order_info oi ON o.order_id = oi.order_id
            LEFT JOIN employee_info are ON oi.additional_request_employee_id = are.employee_id
            LEFT JOIN (
                SELECT 
                    os.order_id,
                    GROUP_CONCAT(DISTINCT CONCAT(cs.service_id, ':', cs.service_name, ':', os.service_price) ORDER BY cs.service_name SEPARATOR '|') AS service_items
                FROM order_services os
                LEFT JOIN common_services cs ON os.service_id = cs.service_id
                GROUP BY os.order_id
            ) svc ON svc.order_id = o.order_id
            LEFT JOIN (
                SELECT 
                    os.order_id,
                    SUM(CASE WHEN os.service_completed = 1 THEN 1 ELSE 0 END) AS checked_count,
                    SUM(CASE WHEN COALESCE(os_view.status, os.service_status) = 'completed' THEN 1 ELSE 0 END) AS submitted_count,
                    COUNT(*) AS total_count
                FROM order_services os
                LEFT JOIN order_status os_view ON os_view.order_service_id = os.order_service_id
                GROUP BY os.order_id
            ) agg ON agg.order_id = o.order_id
            ORDER BY o.order_date DESC;
        `;

    console.log("Executing getAllOrders query");
    const rows = await db.query(query);
    console.log(`Query returned ${rows.length} rows`);

    if (rows.length === 0) {
      console.log("No orders found with the current query");
      return [];
    }

    // Log first few orders for debugging
    console.log(
      "First few orders from query:",
      JSON.stringify(rows.slice(0, 3), null, 2)
    );

    // Format the response (use stored order_status as source of truth)
    const formattedOrders = rows.map((row) => {
      // Map order_status strings to numeric codes expected by frontend
      const statusMap = {
        pending: 1,
        in_progress: 2,
        completed: 3,
        ready_for_pickup: 4,
        done: 5,
        cancelled: 6,
      };

      const currentStatus = typeof row.order_status === "string" ? row.order_status : "pending";
      const normalizedStatus = statusMap[currentStatus] ?? 1;

      // Parse service_items into structured array
      const services = (row.service_items || "")
        .split("|")
        .filter(Boolean)
        .map((item) => {
          const [idStr, name, priceStr] = item.split(":");
          return {
            service_id: Number(idStr),
            service_name: name,
            service_price: parseFloat(priceStr || "0") || 0,
          };
        });

      return {
        order_id: row.order_id,
        order_date: row.order_date,
        order_status: normalizedStatus,
        customer_first_name: row.customer_first_name || "N/A",
        customer_last_name: row.customer_last_name || "",
        customer_email: row.customer_email || "",
        customer_phone: row.customer_phone || "",
        vehicle_make: row.vehicle_make || "N/A",
        vehicle_model: row.vehicle_model || "N/A",
        vehicle_year: row.vehicle_year || "",
        vehicle_license_plate: row.vehicle_license_plate || "",
        vehicle_vin: row.vehicle_vin || "",
        vehicle_mileage: row.vehicle_mileage || 0,
        employee_first_name: row.employee_first_name || "N/A",
        employee_last_name: row.employee_last_name || "",
        order_total_price: parseFloat(row.order_total_price) || 0,
        estimated_completion_date: row.estimated_completion_date,
        additional_request: row.additional_request || "",
        additional_request_employee_id: row.additional_request_employee_id || null,
        additional_request_status: row.additional_request_status || 0,
        additional_request_employee_first_name: row.additional_request_employee_first_name || null,
        additional_request_employee_last_name: row.additional_request_employee_last_name || null,
        services,
      };
    });

    console.log(`Returning ${formattedOrders.length} formatted orders`);
    return formattedOrders;
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    // Return an empty array instead of throwing to prevent frontend crash
    return [];
  }
};

// get all services ordered in one order
const getAllServicesForOrder = async (orderId) => {
  const query = `SELECT service_completed FROM order_services WHERE order_id = ?`;
  const rows = await db.query(query, [orderId]);
  return rows;
};

// get order by Id
const getOrderById = async (orderId) => {
  try {
    // Base order info
    const baseQuery = `
            SELECT 
                o.order_id,
                o.order_date,
                o.order_status,
                ci.customer_first_name,
                ci.customer_last_name,
                c.customer_email,
                ci.customer_phone,
                c.active_customer,
                v.vehicle_make,
                v.vehicle_model,
                v.vehicle_year,
                v.vehicle_license_plate,
                v.vehicle_vin,
                v.vehicle_mileage,
                v.vehicle_transmission_type,
                v.vehicle_fuel_type,
                e.employee_first_name,
                e.employee_last_name,
                oi.order_total_price,
                oi.estimated_completion_date,
                oi.additional_request,
                oi.additional_request_employee_id,
                oi.additional_request_status,
                are.employee_first_name AS additional_request_employee_first_name,
                are.employee_last_name AS additional_request_employee_last_name
            FROM orders o
            LEFT JOIN customer_info ci ON o.customer_id = ci.customer_id
            LEFT JOIN customer c ON ci.customer_id = c.customer_id
            LEFT JOIN customer_vehicle_info v ON o.vehicle_id = v.vehicle_id
            LEFT JOIN employee_info e ON o.employee_id = e.employee_id
            LEFT JOIN order_info oi ON o.order_id = oi.order_id
            LEFT JOIN employee_info are ON oi.additional_request_employee_id = are.employee_id
            WHERE o.order_id = ?
            LIMIT 1
        `;
    const rows = await db.query(baseQuery, [orderId]);
    if (rows.length === 0) {
      throw new Error("Order not found");
    }
    const row = rows[0];

    // Services with assignments and latest status
    const svcRows = await db.query(
      `SELECT 
                os.order_service_id,
                os.service_id,
                cs.service_name,
                os.service_price,
                COALESCE(os_view.status, os.service_status) AS service_status,
                os.service_completed,
                ose.employee_id,
                ei.employee_first_name,
                ei.employee_last_name
             FROM order_services os
             LEFT JOIN common_services cs ON cs.service_id = os.service_id
             LEFT JOIN order_service_employee ose ON ose.order_service_id = os.order_service_id
             LEFT JOIN employee_info ei ON ei.employee_id = ose.employee_id
             LEFT JOIN order_status os_view ON os_view.order_service_id = os.order_service_id
             WHERE os.order_id = ?
             ORDER BY cs.service_name ASC`,
      [orderId]
    );

    const idToService = new Map();
    for (const svc of svcRows) {
      const key = svc.order_service_id;
      if (!idToService.has(key)) {
        idToService.set(key, {
          service_id: svc.service_id,
          service_name: svc.service_name,
          service_price: parseFloat(svc.service_price || 0) || 0,
          service_status: svc.service_status,
          service_completed: svc.service_completed,
          assigned: [],
        });
      }
      if (svc.employee_id) {
        idToService.get(key).assigned.push({
          employee_id: svc.employee_id,
          employee_first_name: svc.employee_first_name,
          employee_last_name: svc.employee_last_name,
        });
      }
    }
    const services = Array.from(idToService.values());

    const statusMap = {
      pending: 1,
      in_progress: 2,
      completed: 3,
      ready_for_pickup: 4,
      done: 5,
      cancelled: 6,
    };
    // Use stored order status as source of truth; do not recompute here
    const currentStatus = typeof row.order_status === "string" ? row.order_status : "pending";
    const normalizedStatus = statusMap[currentStatus] ?? 1;

    return {
      order_id: row.order_id,
      order_date: row.order_date,
      order_status: normalizedStatus,
      customer_first_name: row.customer_first_name || "N/A",
      customer_last_name: row.customer_last_name || "",
      customer_email: row.customer_email || "",
      customer_phone: row.customer_phone || "",
      active_customer: row.active_customer,
      vehicle_make: row.vehicle_make || "N/A",
      vehicle_model: row.vehicle_model || "N/A",
      vehicle_year: row.vehicle_year || "",
      vehicle_license_plate: row.vehicle_license_plate || "",
      vehicle_vin: row.vehicle_vin || "",
      vehicle_mileage: row.vehicle_mileage || 0,
      vehicle_type: row.vehicle_fuel_type || "",
      employee_first_name: row.employee_first_name || "N/A",
      employee_last_name: row.employee_last_name || "",
      order_total_price: parseFloat(row.order_total_price) || 0,
      order_subtotal: parseFloat(row.order_total_price) || 0,
      order_tax: 0,
      order_total: parseFloat(row.order_total_price) || 0,
      estimated_completion_date: row.estimated_completion_date,
      additional_request: row.additional_request || "",
      additional_request_employee_id: row.additional_request_employee_id || null,
      additional_request_status: row.additional_request_status || 'pending', // Ensure it's a string for ENUM
      additional_request_employee_first_name: row.additional_request_employee_first_name || null,
      additional_request_employee_last_name: row.additional_request_employee_last_name || null,
      services,
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }
};

//get order id from task
const getOrderIdFromTask = async (task_id) => {
  const query = `SELECT order_id FROM order_services WHERE order_service_id = ?`;
  const rows = await db.query(query, [task_id]);
  return rows.length > 0 ? rows[0].order_id : null;
};

// Update an order (order_info fields)
async function updateOrder(id, updateData) {
  // Map incoming names to order_info columns
  const additional_request =
    updateData.orderInfoData.additional_request ?? updateData.order_description ?? "";

  // Normalize various date shapes to MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
  const toMysqlDateTime = (val) => {
    if (!val) return null;
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return null;
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  };

  const estimated_completion_date = toMysqlDateTime(
    updateData.orderInfoData.estimated_completion_date
  );
  const completion_date = toMysqlDateTime(updateData.orderInfoData.completion_date);
  const order_total_price = updateData.orderInfoData.order_total_price ?? null;
  const additional_request_employee_id = updateData.orderInfoData.additional_request_employee_id ?? null;
  const additional_request_status = updateData.orderInfoData.additional_request_status ?? 'pending';

  console.log("Updating order_info for order ID:", id, {
    additional_request,
    estimated_completion_date,
    completion_date,
    order_total_price,
    additional_request_employee_id,
    additional_request_status,
  });

  // Guard: prevent updates to order_info for cancelled/done orders
  try {
    const statusRow = await db.query(
      `SELECT order_status FROM orders WHERE order_id = ?`,
      [id]
    );
    const status = statusRow?.[0]?.order_status || 'pending';
    if (status === 'cancelled' || status === 'done') {
      throw new Error(
        `Order is ${status}. Change status to 'Received' before editing.`
      );
    }
  } catch (statusErr) {
    if (statusErr.message?.startsWith('Order is')) {
      throw statusErr;
    }
    throw new Error('Unable to verify order status. Cannot update order now.');
  }

  const query = `
        UPDATE order_info
        SET 
            additional_request = ?,
            estimated_completion_date = ?,
            completion_date = ?,
            order_total_price = COALESCE(?, order_total_price),
            additional_request_employee_id = ?,
            additional_request_status = ?
        WHERE order_id = ?
    `;
  try {
    const result = await db.query(query, [
      additional_request,
      estimated_completion_date,
      completion_date,
      order_total_price,
      additional_request_employee_id,
      additional_request_status,
      id,
    ]);
    console.log("Order info updated in DB with result:", result);

    // Re-evaluate and update overall order status
    await recalculateAndSetOrderStatus(id);

    return { message: "Order updated successfully", status: "success" }; // Add status for frontend
  } catch (error) {
    console.error("Error updating order info in DB:", error);
    throw new Error("Failed to update order");
  }
}

// New function to recalculate and set overall order status
const recalculateAndSetOrderStatus = async (orderId) => {
  // --- START: Re-evaluate and update overall order status ---
  const agg = await db.query(
    `SELECT
        COUNT(os.order_service_id) AS total_services,
        SUM(CASE WHEN os_view.status = 'completed' THEN 1 ELSE 0 END) AS submitted_services,
        SUM(CASE WHEN os.service_completed = 1 THEN 1 ELSE 0 END) AS checked_services,
        MAX(oi.additional_request) AS additional_request,
        MAX(oi.additional_request_status) AS additional_request_status
     FROM orders o
     LEFT JOIN order_services os ON o.order_id = os.order_id
     LEFT JOIN order_status os_view ON os_view.order_service_id = os.order_service_id
     LEFT JOIN order_info oi ON o.order_id = oi.order_id
     WHERE o.order_id = ?
     GROUP BY o.order_id`,
    [orderId]
  );

  const totalServices = Number(agg?.[0]?.total_services || 0);
  const submittedServices = Number(agg?.[0]?.submitted_services || 0);
  const checkedServices = Number(agg?.[0]?.checked_services || 0);
  const additionalRequestText = agg?.[0]?.additional_request;
  const additionalRequestStatusFromDB = agg?.[0]?.additional_request_status;

  const isAdditionalRequestCompleted = !additionalRequestText || additionalRequestStatusFromDB === 'completed';
  const allServicesCompleted = totalServices === submittedServices;
  const allTasksCompleted = allServicesCompleted && isAdditionalRequestCompleted;

  // Get current overall order status from the 'orders' table
  const currentOverallStatusRow = await db.query(`SELECT order_status FROM orders WHERE order_id = ?`, [orderId]);
  const currentOverallStatus = currentOverallStatusRow[0]?.order_status || 'pending';

  let newOverallOrderStatus = currentOverallStatus;
  // If order is not locked as 'done' or 'cancelled', recompute status.
  if (currentOverallStatus !== 'done' && currentOverallStatus !== 'cancelled') {
    if (allTasksCompleted) {
      newOverallOrderStatus = 'completed';
    } else if (checkedServices > 0 || submittedServices > 0 || additionalRequestStatusFromDB === 'in_progress') {
      newOverallOrderStatus = 'in_progress';
    } else {
      newOverallOrderStatus = 'pending';
    }
  }

  console.log(`[recalculateAndSetOrderStatus Debug] Order ID: ${orderId}`);
  console.log(`[recalculateAndSetOrderStatus Debug] totalServices: ${totalServices}`);
  console.log(`[recalculateAndSetOrderStatus Debug] submittedServices: ${submittedServices}`);
  console.log(`[recalculateAndSetOrderStatus Debug] checkedServices: ${checkedServices}`);
  console.log(`[recalculateAndSetOrderStatus Debug] additionalRequestText: ${additionalRequestText}`);
  console.log(`[recalculateAndSetOrderStatus Debug] additionalRequestStatusFromDB: ${additionalRequestStatusFromDB}`);
  console.log(`[recalculateAndSetOrderStatus Debug] isAdditionalRequestCompleted: ${isAdditionalRequestCompleted}`);
  console.log(`[recalculateAndSetOrderStatus Debug] allServicesCompleted: ${allServicesCompleted}`);
  console.log(`[recalculateAndSetOrderStatus Debug] allTasksCompleted: ${allTasksCompleted}`);
  console.log(`[recalculateAndSetOrderStatus Debug] currentOverallStatus: ${currentOverallStatus}`);
  console.log(`[recalculateAndSetOrderStatus Debug] newOverallOrderStatus (calculated): ${newOverallOrderStatus}`);

  // Update the overall order record if status changed
  if (newOverallOrderStatus !== currentOverallStatus) {
    const updateOrderResult = await db.query(`UPDATE orders SET order_status = ? WHERE order_id = ?`, [newOverallOrderStatus, orderId]);
    console.log(`[recalculateAndSetOrderStatus Debug] UPDATE orders result for order ID ${orderId}:`, updateOrderResult);
    await db.query(
      `INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, ?, ?)`,
      [orderId, newOverallOrderStatus, 1] // Using employee_id 1 as default for system changes from admin panel
    );
    console.log(`[recalculateAndSetOrderStatus] Overall order_id ${orderId} status updated to: ${newOverallOrderStatus}`);
  } else {
    console.log(`[recalculateAndSetOrderStatus] Overall order_id ${orderId} status remains: ${newOverallOrderStatus}`);
  }
  // --- END: Re-evaluate and update overall order status ---
};

const updateOrderStatus = async (orderId, status, changedByEmployeeId) => {
  // Persist status change in history table using enum strings
  const statusMap = {
    1: "pending",
    2: "in_progress",
    3: "completed",
    4: "ready_for_pickup",
    5: "done",
    6: "cancelled",
  };
  const statusString = statusMap[status] || "pending";

  // Enforce rule: when order is in 'pending' (Received), only allow transition to 'cancelled'
  const currentStatusRow = await db.query(
    `SELECT order_status FROM orders WHERE order_id = ?`,
    [orderId]
  );
  const currentStatus = currentStatusRow?.[0]?.order_status || "pending";
  if (currentStatus === "pending" && statusString !== "cancelled") {
    throw new Error(
      "Only 'Cancel' is allowed when the order is in 'Received' state."
    );
  }

  // When order is In Progress, only allow transition to Cancelled
  if (currentStatus === 'in_progress' && statusString !== 'cancelled') {
    throw new Error("When order is In Progress, only 'Cancel' is allowed.");
  }

  // If admin attempts to set to 'completed' or 'ready_for_pickup', enforce all services completed/submitted
  if (
    statusString === "completed" ||
    statusString === "ready_for_pickup" ||
    statusString === "done"
  ) {
    const svcAgg = await db.query(
      `SELECT COUNT(*) AS total_services, SUM(CASE WHEN COALESCE(os_view.status, os.service_status) = 'completed' THEN 1 ELSE 0 END) AS completed_services,
              oi.additional_request, oi.additional_request_status
       FROM order_services os
       LEFT JOIN order_status os_view ON os_view.order_service_id = os.order_service_id
       LEFT JOIN order_info oi ON os.order_id = oi.order_id
       WHERE os.order_id = ?
       GROUP BY oi.additional_request, oi.additional_request_status`,
      [orderId]
    );
    const totalServices = Number(svcAgg?.[0]?.total_services || 0);
    const completedServices = Number(svcAgg?.[0]?.completed_services || 0);
    const additionalRequest = svcAgg?.[0]?.additional_request;
    const additionalRequestStatus = Number(svcAgg?.[0]?.additional_request_status || 0);

    const isAdditionalRequestCompleted = !additionalRequest || additionalRequestStatus === 2; // 2 means completed

    if (totalServices === 0 && !additionalRequest) {
      // No services and no additional request, allow transition
    } else if (totalServices > 0 && completedServices < totalServices) {
      throw new Error(
        "Cannot update status to '" +
          statusString +
          "' until all assigned services are completed and submitted by their employees."
      );
    } else if (additionalRequest && !isAdditionalRequestCompleted) {
      throw new Error(
        "Cannot update status to '" +
          statusString +
          "' until the additional request is completed."
      );
    }
  }

  // Write history and update orders table
  await db.query(
    `INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, ?, ?)`,
    [orderId, statusString, changedByEmployeeId]
  );

  await db.query(`UPDATE orders SET order_status = ? WHERE order_id = ?`, [
    statusString,
    orderId,
  ]);
};

// Update services and assignments for an order
async function updateOrderServices(order_id, services) {
  console.log(
    "Updating services for order ID:",
    order_id,
    "with services:",
    services
  );

  // Hard guard: block any service modifications when order is cancelled or done
  try {
    const statusRow = await db.query(
      `SELECT order_status FROM orders WHERE order_id = ?`,
      [order_id]
    );
    const currentOrderStatusGuard = statusRow?.[0]?.order_status || 'pending';
    if (currentOrderStatusGuard === 'cancelled' || currentOrderStatusGuard === 'done') {
      console.log(
        `Order ${order_id} is ${currentOrderStatusGuard}. Blocking service modifications until status changes.`
      );
      throw new Error(
        `Order is ${currentOrderStatusGuard}. Change status to 'Received' before editing services.`
      );
    }
  } catch (guardErr) {
    if (guardErr.message?.startsWith('Order is')) {
      // Re-throw for controller to surface as 400
      throw guardErr;
    }
    // If guard query fails for any reason, fail safe and block
    throw new Error('Unable to verify order status. Cannot modify services at this time.');
  }

  // Helper to coerce nested/id shapes to number
  const coerceId = (val) => {
    if (val == null) return null;
    if (typeof val === "number" || typeof val === "string") return Number(val);
    if (typeof val === "object") {
      if ("service_id" in val) return coerceId(val.service_id);
      if ("id" in val) return coerceId(val.id);
    }
    return null;
  };

  // Normalize to array of { service_id: number, employee_id?: number|null }
  const normalized = (services || [])
    .map((s) => {
      const rawId = s && typeof s === "object" ? s.service_id : s;
      const service_id = coerceId(rawId);
      const employee_id =
        s && typeof s === "object" && s.employee_id != null
          ? Number(s.employee_id)
          : null;
      return { service_id, employee_id };
    })
    .filter(
      (s) => typeof s.service_id === "number" && !Number.isNaN(s.service_id)
    );

  if (normalized.length === 0) {
    console.log("No services provided; clearing all services for order ID:", order_id);
    // Remove all existing services
    await db.query("DELETE FROM order_services WHERE order_id = ?", [order_id]);
    // Set overall order status to pending since no services exist
    await db.query(`UPDATE orders SET order_status = 'pending' WHERE order_id = ?`, [order_id]);
    return { message: "Order services cleared successfully" };
  }

  try {
    // Get current services for this order to preserve their status
    const currentServicesQuery = `
      SELECT os.order_service_id, os.service_id, os.service_completed, os.service_status,
             ose.employee_id
      FROM order_services os
      LEFT JOIN order_service_employee ose ON os.order_service_id = ose.order_service_id
      WHERE os.order_id = ?
    `;
    const currentServices = await db.query(currentServicesQuery, [order_id]);
    console.log("Current services for order:", currentServices);

    // Create maps for easy lookup
    const currentServiceMap = new Map();
    currentServices.forEach(service => {
      currentServiceMap.set(service.service_id, {
        order_service_id: service.order_service_id,
        service_completed: service.service_completed,
        service_status: service.service_status,
        employee_id: service.employee_id
      });
    });

    const newServiceIds = new Set(normalized.map(s => s.service_id));
    const currentServiceIds = new Set(currentServices.map(s => s.service_id));

    // Services to remove (in current but not in new)
    const servicesToRemove = currentServices.filter(s => !newServiceIds.has(s.service_id));
    
    // Services to add (in new but not in current)
    const servicesToAdd = normalized.filter(s => !currentServiceIds.has(s.service_id));
    
    // Services to update (in both current and new - check for employee assignment changes)
    const servicesToUpdate = normalized.filter(s => currentServiceIds.has(s.service_id));

    console.log("Services to remove:", servicesToRemove.length);
    console.log("Services to add:", servicesToAdd.length);
    console.log("Services to update:", servicesToUpdate.length);

    // Remove services that are no longer needed
    for (const service of servicesToRemove) {
      console.log(`Removing service ${service.service_id} from order ${order_id}`);
      await db.query("DELETE FROM order_services WHERE order_service_id = ?", [service.order_service_id]);
    }

    // Add new services with "pending" status
    for (const service of servicesToAdd) {
      console.log(`Adding new service ${service.service_id} to order ${order_id}`);
      const price = await getServicePrice(service.service_id);
      
      const result = await db.query(
        `INSERT INTO order_services (order_id, service_id, service_price, service_status, service_completed)
         VALUES (?, ?, ?, 'pending', 0)`,
        [Number(order_id), Number(service.service_id), Number(price || 0)]
      );
      
      const orderServiceId = result.insertId;
      
      if (service.employee_id && !Number.isNaN(Number(service.employee_id))) {
        await db.query(
          `INSERT INTO order_service_employee (order_service_id, employee_id, is_primary)
           VALUES (?, ?, 1)`,
          [orderServiceId, Number(service.employee_id)]
        );
      }
    }

    // Update employee assignments for existing services
    for (const service of servicesToUpdate) {
      const currentService = currentServiceMap.get(service.service_id);
      if (currentService && currentService.employee_id !== service.employee_id) {
        console.log(`Updating employee assignment for service ${service.service_id} from ${currentService.employee_id} to ${service.employee_id}`);
        
        if (service.employee_id && !Number.isNaN(Number(service.employee_id))) {
          // Update existing assignment
          await db.query(
            `UPDATE order_service_employee SET employee_id = ? WHERE order_service_id = ?`,
            [Number(service.employee_id), currentService.order_service_id]
          );
        } else {
          // Remove assignment
          await db.query(
            `DELETE FROM order_service_employee WHERE order_service_id = ?`,
            [currentService.order_service_id]
          );
        }
      }
    }

    // Recalculate and set overall order status after services are updated
    await recalculateAndSetOrderStatus(order_id);

    console.log(
      "Order services updated successfully for order ID:",
      order_id
    );
    return { message: "Order services updated successfully" };
  } catch (error) {
    console.error("Error updating order services in DB:", error);
    throw new Error("Failed to update order services");
  }
}

// Delete an order by its ID
const deleteOrderById = async (orderId) => {
  try {
    await db.query("DELETE FROM order_services WHERE order_id = ?", [orderId]);
    await db.query("DELETE FROM order_info WHERE order_id = ?", [orderId]);
    await db.query("DELETE FROM order_status_history WHERE order_id = ?", [
      orderId,
    ]);
    await db.query("DELETE FROM orders WHERE order_id = ?", [orderId]);
    console.log(`Order ${orderId} and associated records deleted from DB`);
  } catch (error) {
    console.error(`Error deleting order with ID ${orderId}:`, error);
    throw error;
  }
};

// Status history for an order
const getOrderStatusHistory = async (orderId) => {
  const query = `
        SELECT status_history_id, order_id, order_service_id, status, status_notes, changed_by, created_at
        FROM order_status_history
        WHERE order_id = ?
        ORDER BY created_at ASC, status_history_id ASC
    `;
  return db.query(query, [orderId]);
};

// Export all functions at the end
module.exports = {
  createOrder,
  getAllOrders,
  getAllServicesForOrder,
  getOrderById,
  getOrderIdFromTask,
  updateOrder,
  updateOrderStatus,
  updateOrderServices,
  deleteOrderById,
  getOrderStatusHistory,
};
