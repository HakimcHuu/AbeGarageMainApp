// Import the AddCustomerorm component
import { Container, Row, Col } from "react-bootstrap";
import AdminMenu from "../Components/Admin/AdminMenu/AdminMenu";
import CustomerInfo from "../Components/customer/CustomerProfile";

function CustomerProfile(props) {
  return (
    <div className="admin-pages">
      <Container fluid>
        <Row>
          <Col md={3} className="admin-left-side">
            <AdminMenu />
          </Col>
          <Col md={9} className="admin-right-side">
            <CustomerInfo />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default CustomerProfile;
