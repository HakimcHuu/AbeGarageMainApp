// Centralized order status mapping for consistent labels and colors across the app

const STATUS_MAP = {
  1: { key: 'received', text: 'Received' },
  2: { key: 'in_progress', text: 'In Progress' },
  3: { key: 'completed', text: 'Completed' },
  4: { key: 'ready_for_pickup', text: 'Ready for Pick Up' },
  5: { key: 'done', text: 'Done' },
  6: { key: 'cancelled', text: 'Cancelled' },
  7: { key: 'not_submitted', text: 'Not Submitted' },
  received: { key: 'received', text: 'Received' },
  pending: { key: 'pending', text: 'Pending' },
  in_progress: { key: 'in_progress', text: 'In Progress' },
  completed: { key: 'completed', text: 'Completed' },
  ready_for_pickup: { key: 'ready_for_pickup', text: 'Ready for Pick Up' },
  done: { key: 'done', text: 'Done' },
  cancelled: { key: 'cancelled', text: 'Cancelled' },
  not_submitted: { key: 'not_submitted', text: 'Not Submitted' },
};

// Unified HEX colors across the app
const COLOR_HEX = {
  // Theme colors per requirement
  pending: '#FFEB3B', // Yellow
  received: '#9E9E9E', // Gray
  in_progress: '#2196F3', // Blue
  completed: '#4CAF50', // Green
  ready_for_pickup: '#FF9800', // Orange
  cancelled: '#F44336', // Red
  done: '#2E7D32', // Dark Green
  not_submitted: '#673AB7',
};

export function normalizeStatus(status) {
  const rawKey = typeof status === 'string' ? status : STATUS_MAP[Number(status)]?.key;
  // Treat backend 'pending' as 'received' for unified display
  const key = rawKey === 'pending' ? 'received' : rawKey;
  const metaByKey = key ? STATUS_MAP[key] : null;
  if (metaByKey) return metaByKey;
  const metaByNum = STATUS_MAP[Number(status)] || STATUS_MAP.received;
  return metaByNum;
}

export function getStatusDisplay(status) {
  const meta = normalizeStatus(status);
  return { key: meta.key, text: meta.text };
}

export function getAntdTagProps(status) {
  const { key, text } = getStatusDisplay(status);
  const color = COLOR_HEX[key] || '#9E9E9E';
  return { color, text };
}

export function getBootstrapBadgeProps(status) {
  const { key, text } = getStatusDisplay(status);
  const backgroundColor = COLOR_HEX[key] || '#9E9E9E';
  const style = { backgroundColor, color: '#fff' };
  return { style, text };
}


