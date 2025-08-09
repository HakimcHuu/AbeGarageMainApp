const conn = require('../config/db.config');

// Service to create a new vehicle
async function createVehicle(vehicleData, customer_id) {
  const query = `
    INSERT INTO customer_vehicle_info
    (customer_id, vehicle_make, vehicle_model, vehicle_year, vehicle_license_plate, vehicle_vin, vehicle_color, vehicle_mileage, vehicle_engine_number, vehicle_chassis_number, vehicle_transmission_type, vehicle_fuel_type, last_service_date, next_service_date, insurance_provider, insurance_expiry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  // Coerce/sanitize to satisfy schema in customer_vehicle_info (no vehicle_type/tag/serial columns)
  const v = {
    make: (vehicleData?.vehicle_make ?? "").toString().trim() || "-",
    model: (vehicleData?.vehicle_model ?? "").toString().trim() || "-",
    year: Number.parseInt(vehicleData?.vehicle_year, 10) || new Date().getFullYear(),
    license_plate: (vehicleData?.vehicle_license_plate ?? "").toString().trim() || "-",
    vin: ((vehicleData?.vehicle_vin ?? "").toString().trim() || null),
    color: ((vehicleData?.vehicle_color ?? "").toString().trim() || null),
    mileage: (Number.isNaN(Number.parseInt(vehicleData?.vehicle_mileage, 10)) ? null : Number.parseInt(vehicleData?.vehicle_mileage, 10)),
    engine_number: ((vehicleData?.vehicle_engine_number ?? "").toString().trim() || null),
    chassis_number: ((vehicleData?.vehicle_chassis_number ?? "").toString().trim() || null),
    transmission_type: (vehicleData?.vehicle_transmission_type ?? "Automatic").toString().trim() || "Automatic",
    fuel_type: (vehicleData?.vehicle_fuel_type ?? "Gasoline").toString().trim() || "Gasoline",
    last_service_date: vehicleData?.last_service_date || null,
    next_service_date: vehicleData?.next_service_date || null,
    insurance_provider: ((vehicleData?.insurance_provider ?? "").toString().trim() || null),
    insurance_expiry: vehicleData?.insurance_expiry || null,
  };

  console.log("[vehicle.service] Inserting vehicle for customer_id:", customer_id, "payload:", v);

  try {
    const result = await conn.query(query, [
      customer_id,
      v.make,
      v.model,
      v.year,
      v.license_plate,
      v.vin,
      v.color,
      v.mileage,
      v.engine_number,
      v.chassis_number,
      v.transmission_type,
      v.fuel_type,
      v.last_service_date,
      v.next_service_date,
      v.insurance_provider,
      v.insurance_expiry,
    ]);

    console.log("[vehicle.service] Insert result:", result);

    if (result.affectedRows === 1) {
      return {
        vehicle_id: result.insertId,
        customer_id,
        vehicle_make: v.make,
        vehicle_model: v.model,
        vehicle_year: v.year,
        vehicle_license_plate: v.license_plate,
        vehicle_vin: v.vin,
        vehicle_color: v.color,
        vehicle_mileage: v.mileage,
        vehicle_engine_number: v.engine_number,
        vehicle_chassis_number: v.chassis_number,
        vehicle_transmission_type: v.transmission_type,
        vehicle_fuel_type: v.fuel_type,
        last_service_date: v.last_service_date,
        next_service_date: v.next_service_date,
        insurance_provider: v.insurance_provider,
        insurance_expiry: v.insurance_expiry,
      };
    }
    throw new Error("Failed to create vehicle");
  } catch (err) {
    console.error("[vehicle.service] Create vehicle error:", err);
    // Re-throw so controller can return details
    throw err;
  }
}

// Service to get all vehicles
async function getAllVehicles() {
    const query = 'SELECT * FROM customer_vehicle_info';
    const vehicles = await conn.query(query);
    return vehicles;
}

// Service to get a vehicle by ID
async function getVehicleById(vehicleId) {
    const query = 'SELECT * FROM customer_vehicle_info WHERE vehicle_id = ?';
    const rows = await conn.query(query, [vehicleId]);
    return rows.length > 0 ? rows[0] : null;
}

// Service to update a vehicle
async function updateVehicle(vehicleId, vehicleData) {
  const query = `
    UPDATE customer_vehicle_info
    SET vehicle_make = ?, vehicle_model = ?, vehicle_year = ?, vehicle_license_plate = ?, vehicle_vin = ?, vehicle_color = ?, vehicle_mileage = ?, vehicle_engine_number = ?, vehicle_chassis_number = ?, vehicle_transmission_type = ?, vehicle_fuel_type = ?, last_service_date = ?, next_service_date = ?, insurance_provider = ?, insurance_expiry = ?
    WHERE vehicle_id = ?`;

  const v = {
    make: (vehicleData?.vehicle_make ?? "").toString().trim() || "-",
    model: (vehicleData?.vehicle_model ?? "").toString().trim() || "-",
    year: Number.parseInt(vehicleData?.vehicle_year, 10) || new Date().getFullYear(),
    license_plate: (vehicleData?.vehicle_license_plate ?? "").toString().trim() || "-",
    vin: ((vehicleData?.vehicle_vin ?? "").toString().trim() || null),
    color: ((vehicleData?.vehicle_color ?? "").toString().trim() || null),
    mileage: (Number.isNaN(Number.parseInt(vehicleData?.vehicle_mileage, 10)) ? null : Number.parseInt(vehicleData?.vehicle_mileage, 10)),
    engine_number: ((vehicleData?.vehicle_engine_number ?? "").toString().trim() || null),
    chassis_number: ((vehicleData?.vehicle_chassis_number ?? "").toString().trim() || null),
    transmission_type: (vehicleData?.vehicle_transmission_type ?? "Automatic").toString().trim() || "Automatic",
    fuel_type: (vehicleData?.vehicle_fuel_type ?? "Gasoline").toString().trim() || "Gasoline",
    last_service_date: vehicleData?.last_service_date || null,
    next_service_date: vehicleData?.next_service_date || null,
    insurance_provider: ((vehicleData?.insurance_provider ?? "").toString().trim() || null),
    insurance_expiry: vehicleData?.insurance_expiry || null,
  };

  const result = await conn.query(query, [
    v.make,
    v.model,
    v.year,
    v.license_plate,
    v.vin,
    v.color,
    v.mileage,
    v.engine_number,
    v.chassis_number,
    v.transmission_type,
    v.fuel_type,
    v.last_service_date,
    v.next_service_date,
    v.insurance_provider,
    v.insurance_expiry,
    vehicleId
  ]);

  if (result.affectedRows === 1) {
    return { vehicle_id: vehicleId, ...vehicleData };
  } else {
    throw new Error('Failed to update vehicle');
  }
}

// Service to delete a vehicle
async function deleteVehicle(vehicleId) {
    const query = 'DELETE FROM customer_vehicle_info WHERE vehicle_id = ?';
    await conn.query(query, [vehicleId]);
}

module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
};