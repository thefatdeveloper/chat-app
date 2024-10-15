import axios from "axios";

// Create a new Axios instance
const axiosClient = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL || "https://y4d8ts-8080.csb.app/api", // Default to '/api' if not set
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default axiosClient;
