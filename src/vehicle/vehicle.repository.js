"use strict";

function getVehicleContext(vehicle = {}) {
  // Если нет данных об авто — возвращаем null (не фейковые данные!)
  const make    = vehicle.make    || "";
  const model   = vehicle.model   || "";
  const year    = Number(vehicle.year)    || 0;
  const mileage = Number(vehicle.mileage) || 0;

  // Нет ни одного значащего поля — авто не указано
  if (!make && !model && !year && !mileage) return null;

  return {
    make,
    model,
    year:     year    || null,
    mileage:  mileage || null,
    fuelType: vehicle.fuelType || vehicle.engineType || ""
  };
}

module.exports = {
  getVehicleContext
};
