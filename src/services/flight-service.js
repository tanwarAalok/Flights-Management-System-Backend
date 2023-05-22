const { Op } = require("sequelize");
const { FlightRepository } = require("../repositories");
const flightRepository = new FlightRepository();
const AppError = require("../utils/error/app-error");
const { StatusCodes } = require("http-status-codes");

async function createFlight(data) {
  try {
    const flight = await flightRepository.create(data);
    return flight;
  } catch (error) {
    if (error.name == "SequelizeValidationError") {
      let explanations = [];
      error.errors.forEach((err) => {
        explanations.push(err.message);
      });
      throw new AppError(explanations, StatusCodes.BAD_REQUEST);
    }
    throw new AppError(
      "Cannot create a new Flight object",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}

async function getAllFlights(query) {
  let customFilter = {};
  let sortFilter = [];
  const endingTripTime = " 23:59:00";

  if (query.trips) {
    [departureAirportId, arrivalAirportId] = query.trips.split("-");
    customFilter.departureAirportId = departureAirportId;
    customFilter.arrivalAirportId = arrivalAirportId;

    //TODO - Check if departureAirportId and arrivalAirportId
  }

  if (query.price) {
    [minPrice, maxPrice] = query.price.split("-");
    customFilter.price = {
      [Op.between]: [minPrice, (maxPrice == undefined) ? 20000 : maxPrice]
    }
  }

  if (query.travellers) {
    customFilter.totalSeats = {
      [Op.gte]: query.travellers
    }
  }

  if (query.tripDate) {
    customFilter.departureTime = {
      [Op.between]: [query.tripDate, query.tripDate + endingTripTime]
    };
  }

  if (query.sort) {
    const params = query.sort.split(",");
    const sortFilters = params.map((param) => param.split("_"));
    sortFilter = sortFilters;
  }
    
  try {
    const flights = await flightRepository.getAllFlights(customFilter, sortFilter);
    return flights;
  } catch (error) {
    console.log("**************************************************")
    console.log("ERROR: ", error)
    throw new AppError("Cannot fetch flights", StatusCodes.INTERNAL_SERVER_ERROR);
    console.log("**************************************************")
  }
}



module.exports = {
  createFlight,
  getAllFlights
};
