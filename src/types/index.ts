// Define user roles
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

// Define consignment status
export enum ConsignmentStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  WAITING = 'WAITING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// Define truck status
export enum TruckStatus {
  AVAILABLE = 'AVAILABLE',
  LOADING = 'LOADING',
  IN_TRANSIT = 'IN_TRANSIT',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}

// Add other shared types as needed 