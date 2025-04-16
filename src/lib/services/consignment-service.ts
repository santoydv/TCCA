import connectToDatabase from '../mongodb';
// Import models to ensure all models are registered
import '@/models';
import Consignment, { ConsignmentDocument } from '@/models/Consignment';
import { ConsignmentStatus, TruckStatus } from '@/types';
import TruckAllocation, { AllocationStatus, ITruckAllocation } from '@/models/TruckAllocation';
import Truck from '@/models/Truck';
import { Types } from 'mongoose';

// Calculate transport charge based on volume and destination
export const calculateCharge = (
  volume: number, 
  sourceOfficeId: string, 
  destinationOfficeId: string
): number => {
  // Base rate per cubic meter
  const baseRate = 100;
  
  // For demonstration purposes, we'll use a simple calculation
  // In a real-world scenario, this would consider distance, weight, etc.
  return volume * baseRate;
};

// Create a new consignment
export const createConsignment = async (
  consignmentData: Omit<ConsignmentDocument, '_id' | 'createdAt' | 'updatedAt' | 'trackingNumber' | 'charge' | 'status' | 'truck' | 'dispatchDate' | 'deliveredAt'>
): Promise<ConsignmentDocument> => {
  await connectToDatabase();
  
  // Generate a unique consignment number (timestamp + random string)
  const timestamp = Date.now().toString();
  const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
  const trackingNumber = `CN-${timestamp.substring(timestamp.length - 6)}-${randomString}`;
  
  // Calculate charge
  const charge = calculateCharge(
    consignmentData.volume,
    consignmentData.sourceOffice.toString(),
    consignmentData.destinationOffice.toString()
  );
  
  const newConsignment = await Consignment.create({
    ...consignmentData,
    trackingNumber,
    charge,
    status: ConsignmentStatus.RECEIVED,
    truck: null,
    dispatchDate: null,
    deliveredAt: null,
  });
  
  // Check if we need to allocate a truck based on total volume for this destination
  await checkAndAllocateTruck(
    newConsignment.sourceOffice.toString(),
    newConsignment.destinationOffice.toString()
  );
  
  return newConsignment;
};

// Get consignment details by number
export const getConsignmentByNumber = async (trackingNumber: string): Promise<ConsignmentDocument | null> => {
  await connectToDatabase();
  
  return Consignment.findOne({ trackingNumber });
};

// Check if total volume for a destination has reached 500 cubic meters and allocate a truck if needed
export const checkAndAllocateTruck = async (
  sourceOfficeId: string, 
  destinationOfficeId: string
): Promise<boolean> => {
  await connectToDatabase();
  
  // Find all consignments waiting for this route
  const consignments = await Consignment.find({
    sourceOffice: new Types.ObjectId(sourceOfficeId),
    destinationOffice: new Types.ObjectId(destinationOfficeId),
    status: ConsignmentStatus.RECEIVED,
    truck: null
  });
  
  // Calculate total volume
  const totalVolume = consignments.reduce((sum, consignment) => sum + consignment.volume, 0);
  
  // If the volume has reached 500 cubic meters, allocate a truck
  if (totalVolume >= 500) {
    // Find an available truck at this office
    const availableTruck = await Truck.findOne({
      currentOffice: new Types.ObjectId(sourceOfficeId),
      status: TruckStatus.AVAILABLE
    });
    
    if (!availableTruck) {
      // No available truck, cannot allocate
      return false;
    }
    
    // Update truck status
    availableTruck.status = TruckStatus.LOADING;
    await availableTruck.save();
    
    // Create a truck allocation
    const allocation = await TruckAllocation.create({
      truck: availableTruck._id,
      sourceOffice: new Types.ObjectId(sourceOfficeId),
      destinationOffice: new Types.ObjectId(destinationOfficeId),
      startDate: new Date(),
      endDate: null,
      consignments: consignments.map(c => c._id),
      totalVolume,
      status: AllocationStatus.PLANNED,
      idleTime: 0,
      waitingTime: 0,
      notes: '',
    });
    
    // Update consignments to mark them as allocated to this truck
    await Consignment.updateMany(
      { _id: { $in: consignments.map(c => c._id) } },
      { 
        status: ConsignmentStatus.WAITING,
        truck: availableTruck._id 
      }
    );
    
    return true;
  }
  
  return false;
};

// Get consignments by destination for revenue reporting
export const getConsignmentsByDestination = async (
  destinationOfficeId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ consignments: ConsignmentDocument[]; totalVolume: number; totalRevenue: number }> => {
  await connectToDatabase();
  
  const query: any = { destinationOffice: new Types.ObjectId(destinationOfficeId) };
  
  // Add date filters if provided
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  const consignments = await Consignment.find(query);
  
  // Calculate totals
  const totalVolume = consignments.reduce((sum, c) => sum + c.volume, 0);
  const totalRevenue = consignments.reduce((sum, c) => sum + c.charge, 0);
  
  return { consignments, totalVolume, totalRevenue };
}; 