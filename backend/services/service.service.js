const db = require('../config/db.config');

// Fetch all services from the common_services table
const getAllServices = async () => {
    try {
        const query = 'SELECT * FROM common_services';
        const services = await db.query(query);
        return services;
    } catch (error) {
        console.error('Error fetching services from the database:', error);
        throw new Error('Error fetching services');
    }
};

// Create a new service in the common_services table
const createService = async ({ service_name, service_description }) => {
    console.log(`Starting service creation process...`);
    console.log(`Executing query: INSERT INTO common_services (service_name, service_description) VALUES (?, ?) with values [${service_name}, ${service_description}]`);

    const query = 'INSERT INTO common_services (service_name, service_description) VALUES (?, ?)';

    try {
        const result = await db.query(query, [service_name, service_description]);
        console.log("Raw query result:", result);

        if (result && result.affectedRows === 1) {
            return {
                service_id: result.insertId,
                service_name,
                service_description,
            };
        } else {
            throw new Error(`Failed to create service. Affected rows: ${(result ? result.affectedRows : 'undefined')}`);
        }
    } catch (error) {
        console.error('Error during service creation:', error.message);
        throw new Error("Service creation failed");
    }
};


// Update an existing service in the common_services table
const updateService = async (serviceId, { service_name, service_description }) => {
    console.log(`Attempting to update service with ID: ${serviceId}`);
    console.log(`Updating service with name: ${service_name} and description: ${service_description}`);
    
    const query = `
        UPDATE common_services
        SET service_name = ?, service_description = ?
        WHERE service_id = ?`;

    try {
        const result = await db.query(query, [service_name, service_description, serviceId]);
        console.log("Raw query result:", result);

        if (result && result.affectedRows === 1) {
            console.log(`Service updated successfully. ID: ${serviceId}`);
            return {
                service_id: serviceId,
                service_name,
                service_description,
            };
        } else {
            throw new Error('Failed to update service or service not found');
        }
    } catch (error) {
        console.error('Error updating service:', error.message);
        throw new Error('Service update failed');
    }
};


// Delete a service from the common_services table
const deleteService = async (serviceId) => {
    console.log(`Attempting to delete service with ID: ${serviceId}`);
    
    const query = 'DELETE FROM common_services WHERE service_id = ?';

    try {
        const result = await db.query(query, [serviceId]);
        console.log("Raw query result:", result);

        if (result && result.affectedRows === 1) {
            console.log(`Service deleted successfully. ID: ${serviceId}`);
            return {
                message: `Service with ID ${serviceId} deleted successfully`,
            };
        } else {
            throw new Error('Service not found or failed to delete');
        }
    } catch (error) {
        console.error('Error deleting service:', error.message);
        throw new Error('Service deletion failed');
    }
};

// Seed default services (idempotent via INSERT IGNORE)
const seedDefaultServices = async () => {
    // Check if table already has rows
    const countRows = await db.query('SELECT COUNT(*) AS cnt FROM common_services');
    const count = Array.isArray(countRows) ? countRows[0]?.cnt ?? 0 : 0;
    if (count > 0) {
        return { inserted: 0, message: 'Services already present, skipping seed.' };
    }

    const defaults = [
        ['Oil Change', 'Complete oil and oil filter change', 49.99, 30],
        ['Tire Rotation', 'Rotate all four tires and check pressure', 29.99, 30],
        ['Brake Inspection', 'Complete brake system inspection', 19.99, 30],
        ['Brake Pad Replacement', 'Replace front and rear brake pads', 149.99, 120],
        ['Battery Check', 'Test battery and charging system', 0.00, 15],
        ['Air Filter Replacement', 'Replace engine air filter', 29.99, 15],
        ['Cabin Air Filter Replacement', 'Replace cabin air filter', 39.99, 30],
        ['Wiper Blade Replacement', 'Replace front and rear wiper blades', 49.99, 20],
        ['Headlight Bulb Replacement', 'Replace headlight bulb', 29.99, 30],
        ['Diagnostic Check', 'Computer diagnostic check', 79.99, 60],
    ];

    const placeholders = defaults.map(() => '(?, ?, ?, ?)').join(', ');
    const flatValues = defaults.flat();

    const sql = `
        INSERT IGNORE INTO common_services
        (service_name, service_description, service_price, service_duration)
        VALUES ${placeholders}
    `;

    const result = await db.query(sql, flatValues);
    return { inserted: result.affectedRows || 0, message: 'Default services seeded.' };
};

module.exports = {
    getAllServices,
    createService,
    updateService,
    deleteService,
    seedDefaultServices,
};
