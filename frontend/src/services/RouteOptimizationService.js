const RouteOptimizationService = {
  findBestRoute: (source, destination) => {
    return {
      source,
      destination,
      route:
        `${source} → Ring Road → Highway → ${destination}`,
    };
  },
};

export default RouteOptimizationService;
