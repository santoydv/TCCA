// This file ensures all models are properly registered with Mongoose
// Import it at the beginning of your API routes that use models

import Office from './Office';
import User from './User';
import Truck from './Truck';
import Consignment from './Consignment';
import TruckAllocation from './TruckAllocation';
import Trip from './Trip';

export {
  Office,
  User,
  Truck,
  Consignment,
  TruckAllocation,
  Trip
}; 