import axios from "axios";

const API_URL = "/api/traffic";

const TrafficService = {
  getAllTrafficData: () => {
    return axios.get(API_URL);
  },

  addTrafficData: (data) => {
    return axios.post(API_URL, data);
  },

  deleteTrafficData: (id) => {
    return axios.delete(`${API_URL}/${id}`);
  },
};

export default TrafficService;
