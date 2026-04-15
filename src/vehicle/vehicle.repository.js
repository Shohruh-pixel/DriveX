"use strict";

function getVehicleContext(vehicle = {}) {
  const mileage = Number(vehicle.mileage) || 54200;
  return {
    make: vehicle.make || "BMW",
    model: vehicle.model || "X5",
    year: Number(vehicle.year) || 2018,
    mileage,
    fuelType: vehicle.fuelType || vehicle.engineType || "petrol"
  };
}

module.exports = {
  getVehicleContext
};
