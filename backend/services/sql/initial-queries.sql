-- Drop existing tables if they exist (in reverse order of foreign key dependencies)
DROP TABLE IF EXISTS `order_status_history`;
DROP TABLE IF EXISTS `order_service_employee`;
DROP TABLE IF EXISTS `order_services`;
DROP TABLE IF EXISTS `order_info`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `employee_role`;
DROP TABLE IF EXISTS `employee_pass`; 
DROP TABLE IF EXISTS `employee_info`;
DROP TABLE IF EXISTS `employee`;
DROP TABLE IF EXISTS `customer_vehicle_info`;
DROP TABLE IF EXISTS `customer_pass`;
DROP TABLE IF EXISTS `customer_info`;
DROP TABLE IF EXISTS `customer`;
DROP TABLE IF EXISTS `company_roles`;
DROP TABLE IF EXISTS `common_services`;
DROP VIEW IF EXISTS `order_status`;

-- Customers tables  
CREATE TABLE IF NOT EXISTS `customer` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_email` varchar(255) NOT NULL,
  `active_customer` int(11) NOT NULL DEFAULT 1,
  `customer_added_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id),
  UNIQUE (customer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `customer_info` (
  `customer_info_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL, 
  `customer_first_name` varchar(255) NOT NULL,
  `customer_last_name` varchar(255) NOT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_info_id),
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `customer_pass` (
  `customer_pass_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `customer_password_hashed` varchar(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_pass_id),
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `customer_vehicle_info` (
  `vehicle_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL, 
  `vehicle_make` varchar(255) NOT NULL,
  `vehicle_model` varchar(255) NOT NULL,
  `vehicle_year` int(11) NOT NULL,
  `vehicle_license_plate` varchar(50) NOT NULL,
  `vehicle_vin` varchar(50),
  `vehicle_color` varchar(50),
  `vehicle_mileage` int(11),
  `vehicle_engine_number` varchar(50),
  `vehicle_chassis_number` varchar(50),
  `vehicle_transmission_type` varchar(20) NOT NULL DEFAULT 'Automatic',
  `vehicle_fuel_type` varchar(20) NOT NULL DEFAULT 'Gasoline',
  `last_service_date` DATE,
  `next_service_date` DATE,
  `insurance_provider` varchar(100),
  `insurance_expiry` DATE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (vehicle_id),
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
  UNIQUE KEY `unique_vin` (vehicle_vin),
  UNIQUE KEY `unique_license_plate` (vehicle_license_plate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Company tables 
CREATE TABLE IF NOT EXISTS `company_roles` (
  `company_role_id` int(11) NOT NULL AUTO_INCREMENT,
  `company_role_name` varchar(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_role_id),
  UNIQUE (company_role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `common_services` (
  `service_id` int(11) NOT NULL AUTO_INCREMENT,
  `service_name` varchar(255) NOT NULL,
  `service_description` TEXT,
  `service_price` DECIMAL(10,2) DEFAULT 0.00,
  `service_duration` INT DEFAULT 60, -- in minutes
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (service_id),
  UNIQUE KEY `unique_service_name` (service_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Employee tables 
CREATE TABLE IF NOT EXISTS `employee` (
  `employee_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_email` varchar(255) NOT NULL,
  `active_employee` int(11) NOT NULL DEFAULT 1,
  `added_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id), 
  UNIQUE (employee_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `employee_info` (
  `employee_info_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `employee_first_name` varchar(255) NOT NULL,
  `employee_last_name` varchar(255) NOT NULL,
  `employee_phone` varchar(20) NOT NULL,
  `employee_address` TEXT,
  `employee_hire_date` DATE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_info_id),
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `employee_pass` (
  `employee_pass_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `employee_password_hashed` varchar(255) NOT NULL,
  `password_changed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_pass_id),
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `employee_role` (
  `employee_role_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `company_role_id` int(11) NOT NULL,
  `assigned_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_role_id),
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (company_role_id) REFERENCES company_roles(company_role_id),
  UNIQUE KEY `unique_employee_role` (employee_id, company_role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Order tables  
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `order_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `order_status` ENUM('pending', 'in_progress', 'completed', 'ready_for_pickup', 'done', 'cancelled') DEFAULT 'pending',
  `active_order` BOOLEAN DEFAULT TRUE,
  `order_hash` varchar(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON DELETE CASCADE, 
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES customer_vehicle_info(vehicle_id) ON DELETE CASCADE,
  INDEX `idx_order_date` (order_date),
  INDEX `idx_order_status` (order_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_info` (
  `order_info_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `order_total_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `estimated_completion_date` DATETIME,
  `completion_date` DATETIME,
  `additional_request` TEXT,
  `notes_for_internal_use` TEXT,
  `notes_for_customer` TEXT,
  `additional_requests_completed` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_info_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_services` (
  `order_service_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `service_price` DECIMAL(10,2) NOT NULL,
  `service_status` ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  `service_completed` BOOLEAN DEFAULT FALSE,
  `service_notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_service_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES common_services(service_id),
  INDEX `idx_service_status` (service_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_service_employee` (
  `order_service_employee_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_service_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `assigned_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `completion_date` DATETIME,
  `is_primary` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_service_employee_id),
  FOREIGN KEY (order_service_id) REFERENCES order_services(order_service_id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON DELETE CASCADE,
  UNIQUE KEY `unique_service_employee` (order_service_id, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_status_history` (
  `status_history_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `order_service_id` int(11) DEFAULT NULL,
  `status` ENUM('pending', 'in_progress', 'completed', 'ready_for_pickup', 'done', 'cancelled') NOT NULL DEFAULT 'pending',
  `status_notes` TEXT,
  `changed_by` int(11) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (status_history_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (order_service_id) REFERENCES order_services(order_service_id) ON DELETE SET NULL,
  FOREIGN KEY (changed_by) REFERENCES employee(employee_id),
  INDEX `idx_order_status` (order_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create the order_status view (compatible with older MySQL versions)
CREATE VIEW `order_status` AS
SELECT 
    osh1.status_history_id,
    osh1.order_service_id,
    osh1.order_id,
    osh1.status,
    osh1.status_notes,
    osh1.changed_by,
    osh1.created_at
FROM 
    order_status_history osh1
LEFT JOIN order_status_history osh2 ON 
    (osh1.order_service_id = osh2.order_service_id OR 
     (osh1.order_service_id IS NULL AND osh2.order_service_id IS NULL)) AND
    (osh1.created_at < osh2.created_at OR 
     (osh1.created_at = osh2.created_at AND osh1.status_history_id < osh2.status_history_id))
WHERE 
    osh2.status_history_id IS NULL;

-- Add the roles to the database 
INSERT IGNORE INTO company_roles (company_role_name) VALUES 
('Employee'), 
('Manager'), 
('Admin');

-- This is the admin account 
INSERT IGNORE INTO employee (employee_email, active_employee) 
VALUES ('admin@admin.com', 1);

INSERT IGNORE INTO employee_info (employee_id, employee_first_name, employee_last_name, employee_phone)
SELECT 
    e.employee_id, 
    'Admin', 
    'Admin', 
    '555-555-5555'
FROM 
    employee e
WHERE 
    e.employee_email = 'admin@admin.com' AND
    NOT EXISTS (SELECT 1 FROM employee_info WHERE employee_id = e.employee_id);

-- Password is 123456
INSERT IGNORE INTO employee_pass (employee_id, employee_password_hashed)
SELECT 
    employee_id,
    '$2b$10$f8aKzE72F.fafWwGvwjQ8eudoh5g2.DI7kg2G0ICv0QLYVkNsq4Pm'
FROM 
    employee 
WHERE 
    employee_email = 'admin@admin.com' AND
    NOT EXISTS (SELECT 1 FROM employee_pass WHERE employee_id = employee.employee_id);

INSERT IGNORE INTO employee_role (employee_id, company_role_id)
SELECT 
    e.employee_id,
    cr.company_role_id
FROM 
    employee e
CROSS JOIN 
    company_roles cr
WHERE 
    e.employee_email = 'admin@admin.com' AND
    cr.company_role_name = 'Admin' AND
    NOT EXISTS (
        SELECT 1 
        FROM employee_role er 
        WHERE er.employee_id = e.employee_id 
        AND er.company_role_id = cr.company_role_id
    );