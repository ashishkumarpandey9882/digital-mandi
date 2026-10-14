const calculateDistance = async (
  farmerLat,
  farmerLng,
  buyerLat,
  buyerLng
) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${farmerLng},${farmerLat};${buyerLng},${buyerLat}?overview=false`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Distance API request failed");
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes.length) {
      throw new Error("Route not found");
    }

    const route = data.routes[0];

    return {
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationMinutes: Math.ceil(route.duration / 60),
    };

  } catch (error) {
    console.log("Distance calculation failed:", error.message);
    throw error;
  }
};

module.exports = {
  calculateDistance,
};