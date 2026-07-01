export default class FlightModel {
  constructor(
    flightNumber,
    airline,
    departureCity,
    arrivalCity,
    departureDate,
    arrivalDate,
    price,
    availableSeats,
    flightClass,
    image,
  ) {
    this.flightNumber = flightNumber;
    this.airline = airline;
    this.departureCity = departureCity;
    this.arrivalCity = arrivalCity;
    this.departureDate = departureDate;
    this.arrivalDate = arrivalDate;
    this.price = price;
    this.availableSeats = availableSeats;
    this.flightClass = flightClass;
    this.image = image;
  }
}
