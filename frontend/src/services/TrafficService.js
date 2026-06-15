const TrafficService = {
  getAllTrafficData: () => {
    return [];
  },

  addTrafficData: (data) => {
    return {
      success: true,
      data
    };
  },

  deleteTrafficData: (id) => {
    return {
      success: true,
      id
    };
  }
};

export default TrafficService;
