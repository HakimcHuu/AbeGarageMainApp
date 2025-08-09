import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import Service from '../../Components/services/vehicle.service';
import AdminMenu from '../../Components/Admin/AdminMenu/AdminMenu';

const AddVehicle = () => {
  const { customer_id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_license_plate: '',
    vehicle_vin: '',
    vehicle_color: '',
    vehicle_mileage: '',
    vehicle_engine_number: '',
    vehicle_chassis_number: '',
    vehicle_transmission_type: 'Automatic',
    vehicle_fuel_type: 'Gasoline',
    last_service_date: '',
    next_service_date: '',
    insurance_provider: '',
    insurance_expiry: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Format dates for the database
      const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      const formattedData = {
        ...formData,
        last_service_date: formatDate(formData.last_service_date),
        next_service_date: formatDate(formData.next_service_date),
        insurance_expiry: formatDate(formData.insurance_expiry),
        vehicle_mileage: formData.vehicle_mileage ? parseInt(formData.vehicle_mileage, 10) : null,
        vehicle_year: formData.vehicle_year ? parseInt(formData.vehicle_year, 10) : null,
        customer_id: customer_id
      };

      const response = await Service.addVehicle(customer_id, formattedData);
      if (response.success) {
        navigate(`/admin/customer-profile/${customer_id}`);
      } else {
        setError(response.message || 'Failed to add vehicle');
      }
    } catch (err) {
      setError('An error occurred while adding the vehicle');
      console.error('Error adding vehicle:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="p-0 d-flex" style={{ minHeight: '100vh' }}>
      {/* Admin Menu */}
      <div className="bg-dark" style={{ width: '250px', minHeight: '100vh' }}>
        <AdminMenu />
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <Container>
          <Row className="justify-content-center">
            <Col md={10}>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(-1)}
                className="mb-3 d-flex align-items-center"
                size="sm"
              >
                <FaArrowLeft className="me-2" /> Back
              </Button>
              
              <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Add New Vehicle</h5>
                  <Button variant="light" size="sm" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                      <Spinner as="span" size="sm" animation="border" role="status" />
                    ) : (
                      <><FaPlus className="me-1" /> Add Vehicle</>
                    )}
                  </Button>
                </Card.Header>
                <Card.Body>
                  {error && <Alert variant="danger">{error}</Alert>}
                  
                  <Form onSubmit={handleSubmit}>
                    <h6 className="mb-3">Vehicle Information</h6>
                    <Row className="mb-4">
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Make <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="vehicle_make"
                            value={formData.vehicle_make}
                            onChange={handleChange}
                            required
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Model <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="vehicle_model"
                            value={formData.vehicle_model}
                            onChange={handleChange}
                            required
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Year <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="number"
                            name="vehicle_year"
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            value={formData.vehicle_year}
                            onChange={handleChange}
                            required
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>License Plate <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="vehicle_license_plate"
                            value={formData.vehicle_license_plate}
                            onChange={handleChange}
                            required
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>VIN</Form.Label>
                          <Form.Control
                            type="text"
                            name="vehicle_vin"
                            value={formData.vehicle_vin}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Color</Form.Label>
                          <Form.Control
                            type="text"
                            name="vehicle_color"
                            value={formData.vehicle_color}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="mb-3">Additional Details</h6>
                    <Row className="mb-4">
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Mileage (km)</Form.Label>
                          <Form.Control
                            type="number"
                            name="vehicle_mileage"
                            min="0"
                            step="1"
                            value={formData.vehicle_mileage}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Engine Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="vehicle_engine_number"
                            value={formData.vehicle_engine_number}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Chassis Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="vehicle_chassis_number"
                            value={formData.vehicle_chassis_number}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Transmission</Form.Label>
                          <Form.Select 
                            name="vehicle_transmission_type"
                            value={formData.vehicle_transmission_type}
                            onChange={handleChange}
                            size="sm"
                          >
                            <option value="Automatic">Automatic</option>
                            <option value="Manual">Manual</option>
                            <option value="Semi-Automatic">Semi-Automatic</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Fuel Type</Form.Label>
                          <Form.Select 
                            name="vehicle_fuel_type"
                            value={formData.vehicle_fuel_type}
                            onChange={handleChange}
                            size="sm"
                          >
                            <option value="Gasoline">Gasoline</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="Electric">Electric</option>
                            <option value="LPG">LPG</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="mb-3">Service Information</h6>
                    <Row className="mb-4">
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Service Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="last_service_date"
                            value={formData.last_service_date}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Next Service Due</Form.Label>
                          <Form.Control
                            type="date"
                            name="next_service_date"
                            value={formData.next_service_date}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="mb-3">Insurance Information</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Insurance Provider</Form.Label>
                          <Form.Control
                            type="text"
                            name="insurance_provider"
                            value={formData.insurance_provider}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Insurance Expiry</Form.Label>
                          <Form.Control
                            type="date"
                            name="insurance_expiry"
                            value={formData.insurance_expiry}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </Container>
  );
};

export default AddVehicle;
