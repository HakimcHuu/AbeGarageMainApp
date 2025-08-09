const vehicleService = require('../services/vehicle.service');

/**
 * Create Vehicle
 * Sanitizes and coerces incoming values to satisfy NOT NULL constraints and types
 * defined in customer_vehicle_info:
 *  - vehicle_year INT NOT NULL
 *  - vehicle_make VARCHAR NOT NULL
 *  - vehicle_model VARCHAR NOT NULL
 *  - vehicle_type VARCHAR NOT NULL
 *  - vehicle_mileage INT NOT NULL
 *  - vehicle_tag VARCHAR NOT NULL
 *  - vehicle_serial VARCHAR NOT NULL
 *  - vehicle_color VARCHAR NOT NULL
 */
const createVehicle = async (req, res) => {
    try {
        const {
            customer_id,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_license_plate,
            vehicle_vin,
            vehicle_color,
            vehicle_mileage,
            vehicle_engine_number,
            vehicle_chassis_number,
            vehicle_transmission_type,
            vehicle_fuel_type,
            last_service_date,
            next_service_date,
            insurance_provider,
            insurance_expiry,
        } = req.body;

        const cid = Number.parseInt(String(customer_id || "").trim(), 10);
        if (!cid || Number.isNaN(cid)) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        // License plate is NOT NULL and UNIQUE in schema
        if (!vehicle_license_plate || String(vehicle_license_plate).trim() === "") {
            return res.status(400).json({ error: 'Vehicle license plate (tag) is required' });
        }

        // Coerce and default all required fields to match DB columns
        const toIntOrNull = (v) => {
            const n = Number.parseInt(v, 10);
            return Number.isNaN(n) ? null : n;
        };

        const sanitized = {
            vehicle_make: (vehicle_make ?? "").toString().trim() || "-",
            vehicle_model: (vehicle_model ?? "").toString().trim() || "-",
            vehicle_year: toIntOrNull(vehicle_year) ?? new Date().getFullYear(),
            vehicle_license_plate: (vehicle_license_plate ?? "").toString().trim() || "-",
            vehicle_vin: ((vehicle_vin ?? "").toString().trim() || null),
            vehicle_color: ((vehicle_color ?? "").toString().trim() || null),
            vehicle_mileage: toIntOrNull(vehicle_mileage),
            vehicle_engine_number: ((vehicle_engine_number ?? "").toString().trim() || null),
            vehicle_chassis_number: ((vehicle_chassis_number ?? "").toString().trim() || null),
            vehicle_transmission_type: (vehicle_transmission_type ?? "Automatic").toString().trim() || "Automatic",
            vehicle_fuel_type: (vehicle_fuel_type ?? "Gasoline").toString().trim() || "Gasoline",
            last_service_date: last_service_date || null,
            next_service_date: next_service_date || null,
            insurance_provider: ((insurance_provider ?? "").toString().trim() || null),
            insurance_expiry: insurance_expiry || null,
        };

        const newVehicle = await vehicleService.createVehicle(sanitized, cid);
        return res.status(201).json({ status: 'success', vehicle: newVehicle });
    } catch (error) {
        console.error("Create vehicle error:", error);
        // Include SQL engine error info if available
        const details = error?.sqlMessage || error?.message || "Unknown error";
        return res.status(500).json({ error: 'Failed to create vehicle', details });
    }
};


// Controller for getting all vehicles
async function getAllVehicles(req, res) {
    try {
        const vehicles = await vehicleService.getAllVehicles();
        res.status(200).json({ status: 'success', vehicles });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get vehicles', details: error.message });
    }
}

// Controller for getting a vehicle by ID
async function getVehicleById(req, res) {
    try {
        const vehicle = await vehicleService.getVehicleById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.status(200).json({ status: 'success', vehicle });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get vehicle', details: error.message });
    }
}

// Controller for updating a vehicle
async function updateVehicle(req, res) {
    try {
        const updatedVehicle = await vehicleService.updateVehicle(req.params.id, req.body);
        res.status(200).json({ status: 'success', vehicle: updatedVehicle });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update vehicle', details: error.message });
    }
}

// Controller for deleting a vehicle
async function deleteVehicle(req, res) {
    try {
        await vehicleService.deleteVehicle(req.params.id);
        res.status(200).json({ status: 'success', message: 'Vehicle deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete vehicle', details: error.message });
    }
}

module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
};