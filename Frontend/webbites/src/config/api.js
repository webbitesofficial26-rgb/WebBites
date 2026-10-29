// Central API origin for local development and deployment.
// Set REACT_APP_API_URL in the frontend environment to override localhost.
const API_BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default API_BASE_URL;
