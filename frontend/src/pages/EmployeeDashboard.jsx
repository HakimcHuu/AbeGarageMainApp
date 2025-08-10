import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import employeeService from "../Components/services/employee.service";
import orderService from "../Components/services/order.service";
import getAuth from "../Components/util/auth";
import { loginService } from "../Components/services/login.service";
import { getBootstrapBadgeProps, getStatusDisplay } from "../Components/util/status";

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [token, setToken] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadTasks = useCallback(async (empId, tok, opts = { silent: false }) => {
    try {
      if (!opts.silent) setLoading(true);
      setError("");
      const res = await employeeService.getEmployeeTasks(empId, tok);
      const data = await res.json();
      if (data.status === "success") {
        setTasks(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || "Failed to load tasks");
      }
    } catch (err) {
      setError(err.message || "Failed to load tasks");
    } finally {
      if (!opts.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Get decoded employee with role/id
        const decoded = await getAuth();
        // Pull token from localStorage (AuthContext stores employee_token too)
        const raw = localStorage.getItem("employee");
        const parsed = raw ? JSON.parse(raw) : {};
        const empToken = parsed.employee_token || localStorage.getItem("employee_token") || "";

        if (!decoded || !decoded.employee_id || !empToken) {
          setError("Not authenticated as employee");
          return;
        }
        setEmployee(decoded);
        setToken(empToken);
        await loadTasks(decoded.employee_id, empToken, { silent: false });
      } catch (err) {
        setError("Unable to initialize employee dashboard");
      }
    };
    bootstrap();
  }, [loadTasks]);

  // Polling for near-real-time sync
  useEffect(() => {
    if (!employee || !token) return;
    const id = setInterval(() => {
      loadTasks(employee.employee_id, token, { silent: true });
    }, 5000);
    return () => clearInterval(id);
  }, [employee, token, loadTasks]);

  const updateStatus = async (taskId, status) => {
    try {
      setBusy(true);
      setError("");
      
      // Find the task to check if its order is cancelled
      const task = tasks.find(t => t.order_service_id === taskId);
      if (task && Number(task.overall_order_status) === 6) {
        setError("Cannot update task: Order is cancelled. Please contact admin to change the order status.");
        return;
      }
      
      await employeeService.updateTaskStatus(taskId, status, token);
      // Reload tasks after status change
      await loadTasks(employee.employee_id, token);
    } catch (err) {
      setError(err.message || "Failed to update task status");
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = (taskId) => updateStatus(taskId, 2); // In Progress
  const handleInProgress = (taskId) => updateStatus(taskId, 2);
  const handleCompleted = (taskId) => updateStatus(taskId, 3);

  // Group tasks by order
  const tasksByOrder = useMemo(() => {
    const grouped = {};
    for (const t of tasks) {
      if (!grouped[t.order_id]) grouped[t.order_id] = [];
      grouped[t.order_id].push(t);
    }
    return grouped;
  }, [tasks]);

  const isTaskChecked = (t) => Number(t.order_status) >= 2;

  const handleSubmitOrder = async (orderId) => {
    try {
      setBusy(true);
      setError("");
      const items = tasksByOrder[orderId] || [];
      const orderOverall = Number(items?.[0]?.overall_order_status || 1);
      if (orderOverall === 5) {
        window.alert("Order is Done and cannot be submitted.");
        return;
      }
      if (orderOverall === 6) {
        window.alert("Order is Cancelled and cannot be submitted. Please contact admin to change the order status.");
        return;
      }
      // Submit all checked tasks for this order (set to completed)
      for (const t of items) {
        if (Number(t.order_status) >= 2) {
          await employeeService.updateTaskStatus(t.order_service_id, 3, token);
        }
      }
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      await loadTasks(employee.employee_id, token);
    } catch (err) {
      setError(err.message || "Failed to submit order");
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (orderId, task, itemsInOrder) => {
    // Prevent modifying tasks when the entire order is Done or Cancelled
    const overallStatus = Number(itemsInOrder?.[0]?.overall_order_status || 1);
    if (overallStatus === 5) {
      window.alert("Order is Done and tasks cannot be modified.");
      return;
    }
    if (overallStatus === 6) {
      window.alert("Order is Cancelled and tasks cannot be modified. Please contact admin to change the order status.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      // Checked => mark as checked (2), Unchecked => mark as received (1)
      const nextStatus = isTaskChecked(task) ? 1 : 2;
      await employeeService.updateTaskStatus(task.order_service_id, nextStatus, token);
      await loadTasks(employee.employee_id, token, { silent: true });
    } catch (err) {
      setError(err.message || "Failed to update task status");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear server-side active role, then clear local storage
      await loginService.logOut("employee", true);
    } catch {
      // ignore server error, still clear client storage
    } finally {
      localStorage.removeItem("employee");
      localStorage.removeItem("employee_token");
      navigate("/login");
    }
  };

  const prettyStatus = (statusNum) => getStatusDisplay(statusNum).text;

  const prettyOrderStatus = (statusNum) => getStatusDisplay(statusNum).text;

  return (
    <section className="contact-section">
      {submitSuccess && (
        <div className="alert alert-success" role="alert">
          Order submitted successfully!
        </div>
      )}
      <div className="auto-container">
        <div className="sec-title style-two" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Welcome, {employee?.employee_first_name || "Employee"}</h2></div>

        <div className="row clearfix">
          <div className="col-md-12">
            {error && (
              <div className="validation-error" role="alert" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}
            {loading ? (
              <div>Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div>No tasks assigned.</div>
            ) : (
              <div className="row">
                {Object.entries(tasksByOrder).map(([orderId, items]) => {
                  const isExpanded = !!expandedOrders[orderId];
                  const allChecked = items.every((t) => Number(t.order_status) >= 2);
                  const orderOverall = Number(items[0]?.overall_order_status || 1);
                  return (
                    <div key={orderId} className="col-md-12" style={{ marginBottom: 16 }}>
                      <div className="card" style={{ padding: 16, borderRadius: 6, border: "1px solid #eee" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>Order #{orderId} • {allChecked ? 'All tasks checked' : 'Tasks pending'}</span>
                            <span
                              style={{
                                ...getBootstrapBadgeProps(orderOverall).style,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.8em',
                                fontWeight: 600
                              }}
                            >
                              {prettyOrderStatus(orderOverall)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {allChecked && orderOverall !== 5 && orderOverall !== 6 && (
                              <button
                                className="theme-btn btn-style-one"
                                onClick={() => handleSubmitOrder(orderId)}
                                disabled={busy}
                              >
                                <span>Submit to Admin</span>
                              </button>
                            )}
                            <button
                              className="theme-btn btn-style-one"
                              onClick={() => setExpandedOrders((prev) => ({ ...prev, [orderId]: !isExpanded }))}
                            >
                              <span>{isExpanded ? 'Hide Tasks' : 'Show Tasks'}</span>
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                              <div style={{ lineHeight: '1.8' }}>
                                <div><strong>Customer:</strong> {items[0].customer_first_name} {items[0].customer_last_name}</div>
                                <div><strong>Vehicle:</strong> {items[0].vehicle_year} {items[0].vehicle_make} {items[0].vehicle_model}</div>
                              </div>
                            </div>
                            {items.map((t) => (
                              <div 
                                key={t.order_service_id} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  padding: '12px 0', 
                                  borderBottom: '1px solid #f0f0f0' 
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isTaskChecked(t)}
                                    onChange={() => toggleTask(orderId, t, items)}
                                    disabled={busy || orderOverall === 6}
                                    style={{ width: '18px', height: '18px' }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: 500 }}>{t.service_name}</div>
                                    <div style={{ fontSize: '0.9em', color: '#666' }}>{t.service_description}</div>
                                  </div>
                                </div>
                                <div
                                  style={{
                                    ...getBootstrapBadgeProps(t.order_status).style,
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                    fontSize: '0.85em'
                                  }}
                                >
                                  {getStatusDisplay(t.order_status).text}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmployeeDashboard;