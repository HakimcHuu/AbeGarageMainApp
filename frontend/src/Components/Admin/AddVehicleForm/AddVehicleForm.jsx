import { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import vehicleService from "../../services/vehicle.service"; // Adjust the path accordingly
import { useAuth } from "../../../Contexts/AuthContext";

function AddVehicleForm({ customer_id, onVehicleAdded }) {
  // Add onVehicleAdded prop
  const [vehicle_year, setVehicleYear] = useState("");
  const [vehicle_make, setVehicleMake] = useState("");
  const [vehicle_model, setVehicleModel] = useState("");
  const [vehicle_type, setVehicleType] = useState("");
  const [vehicle_mileage, setVehicleMileage] = useState("");
  const [vehicle_tag, setVehicleTag] = useState("");
  const [vehicle_serial, setVehicleSerial] = useState("");
  const [vehicle_color, setVehicleColor] = useState("");
  const [active_vehicle, setActiveVehicle] = useState(1);

  // Errors
  const [yearError, setYearError] = useState("");
  const [makeError, setMakeError] = useState("");
  const [serverError, setServerError] = useState("");

  // Create a variable to hold the user's token
  let loggedInCustomerToken = "";
  const { customer, employee } = useAuth();
  // Use employee token if available (admin context), otherwise use customer token
  if (employee && employee.employee_token) {
    loggedInCustomerToken = employee.employee_token;
  } else if (customer && customer.customer_token) {
    loggedInCustomerToken = customer.customer_token;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;

    // Year validation
    if (!vehicle_year || isNaN(vehicle_year)) {
      setYearError("Valid vehicle year is required");
      valid = false;
    } else {
      setYearError("");
    }

    // Make validation
    if (!vehicle_make) {
      setMakeError("Vehicle make is required");
      valid = false;
    } else {
      setMakeError("");
    }

    if (!valid) return;

    const formData = {
      vehicle_year,
      vehicle_make,
      vehicle_model,
      vehicle_type,
      vehicle_mileage,
      vehicle_tag,
      vehicle_serial,
      vehicle_color,
      active_vehicle,
      customer_id, // Ensure the customer_id is included in the form data
      vehicle_license_plate: vehicle_tag,
      vehicle_vin: vehicle_serial,
    };

    // Pass the form data to the service
    vehicleService
      .createVehicle(formData, loggedInCustomerToken)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setServerError(data.error);
        } else {
          // Call the onVehicleAdded function from props to update the parent component
          onVehicleAdded(formData); // Pass the new vehicle data
        }
      })
      .catch((error) => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();
        setServerError(resMessage);
      });
  };

  return (
    <div>
      <h4 className="mb-4">Add a New Vehicle</h4>
      <Form onSubmit={handleSubmit}>
        {serverError && (
          <div className="alert alert-danger" role="alert">
            {serverError}
          </div>
        )}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Year</Form.Label>
              <Form.Control
                type="number"
                value={vehicle_year}
                onChange={(e) => setVehicleYear(e.target.value)}
                isInvalid={!!yearError}
              />
              <Form.Control.Feedback type="invalid">
                {yearError}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Make</Form.Label>
              <Form.Control
                type="text"
                value={vehicle_make}
                onChange={(e) => setVehicleMake(e.target.value)}
                isInvalid={!!makeError}
              />
              <Form.Control.Feedback type="invalid">
                {makeError}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Model</Form.Label>
              <Form.Control
                type="text"
                value={vehicle_model}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Control
                type="text"
                value={vehicle_type}
                onChange={(e) => setVehicleType(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Mileage</Form.Label>
              <Form.Control
                type="number"
                value={vehicle_mileage}
                onChange={(e) => setVehicleMileage(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Tag</Form.Label>
              <Form.Control
                type="text"
                value={vehicle_tag}
                onChange={(e) => setVehicleTag(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Serial</Form.Label>
              <Form.Control
                type="text"
                value={vehicle_serial}
                onChange={(e) => setVehicleSerial(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <Form.Control
                type="text"
                value={vehicle_color}
                onChange={(e) => setVehicleColor(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        <Button variant="primary" type="submit" className="add-vehicle-btn">
          Add Vehicle
        </Button>
      </Form>
    </div>
  );
}

export default AddVehicleForm;
