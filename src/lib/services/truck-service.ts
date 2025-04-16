import connectToDatabase from '../mongodb';
import Truck, { ITruck, TruckStatus } from '@/models/Truck';
import TruckAllocation, { AllocationStatus, ITruckAllocation } from '@/models/TruckAllocation';
import Consignment, { ConsignmentStatus } from '@/models/Consignment';
import { Types } from 'mongoose';

// Get all trucks with optional filtering
export const getTrucks = async (
  officeId?: string,
  status?: TruckStatus
): Promise<ITruck[]> => {
  await connectToDatabase();
  
  const query: any = {};
  
  if (officeId) {
    query.currentOffice = new Types.ObjectId(officeId);
  }
  
  if (status) {
    query.status = status;
  }
  
  return Truck.find(query);
};

// Get truck by registration number
export const getTruckByRegistration = async (
  registrationNumber: string
): Promise<ITruck | null> => {
  await connectToDatabase();
  
  return Truck.findOne({ registrationNumber });
};

// Get truck usage over a time period
export const getTruckUsage = async (
  truckId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  allocations: ITruckAllocation[];
  totalTrips: number;
  totalDistance: number;
  totalIdleTime: number;
  utilizationRate: number;
}> => {
  await connectToDatabase();
  
  const allocations = await TruckAllocation.find({
    truck: new Types.ObjectId(truckId),
    startDate: { $gte: startDate },
    $or: [
      { endDate: { $lte: endDate } },
      { endDate: null, startDate: { $lte: endDate } }
    ]
  }).populate('consignments');
  
  // Calculate metrics
  const totalTrips = allocations.filter(a => 
    a.status === AllocationStatus.COMPLETED
  ).length;
  
  // For a real system, you would calculate actual distance
  // Here we're using a placeholder calculation
  const totalDistance = totalTrips * 100; // Assuming 100 km per trip
  
  const totalIdleTime = allocations.reduce((sum, a) => sum + (a.idleTime || 0), 0);
  
  // Calculate utilization rate (time spent on trips vs total time)
  const totalTimeInHours = 
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  
  const utilizationRate = totalTimeInHours > 0 
    ? (totalTimeInHours - totalIdleTime) / totalTimeInHours
    : 0;
  
  return {
    allocations,
    totalTrips,
    totalDistance,
    totalIdleTime,
    utilizationRate
  };
};

// Get truck allocations (current and past)
export const getTruckAllocations = async (
  officeId?: string,
  status?: AllocationStatus
): Promise<ITruckAllocation[]> => {
  await connectToDatabase();
  
  const query: any = {};
  
  if (officeId) {
    query.sourceOffice = new Types.ObjectId(officeId);
  }
  
  if (status) {
    query.status = status;
  }
  
  return TruckAllocation.find(query)
    .populate('truck')
    .populate('sourceOffice')
    .populate('destinationOffice')
    .sort({ startDate: -1 });
};

// Dispatch a truck with consignments
export const dispatchTruck = async (
  allocationId: string
): Promise<ITruckAllocation> => {
  await connectToDatabase();
  
  const allocation = await TruckAllocation.findById(allocationId);
  
  if (!allocation) {
    throw new Error('Truck allocation not found');
  }
  
  if (allocation.status !== AllocationStatus.PLANNED) {
    throw new Error('Truck allocation is not in PLANNED status');
  }
  
  // Update the truck status
  await Truck.findByIdAndUpdate(allocation.truck, {
    status: TruckStatus.IN_TRANSIT
  });
  
  // Update all consignments
  await Consignment.updateMany(
    { _id: { $in: allocation.consignments } },
    { 
      status: ConsignmentStatus.IN_TRANSIT,
      dispatchDate: new Date()
    }
  );
  
  // Update the allocation
  allocation.status = AllocationStatus.IN_PROGRESS;
  await allocation.save();
  
  return allocation;
};

// Mark a truck as arrived at destination
export const markTruckArrived = async (
  allocationId: string
): Promise<ITruckAllocation> => {
  await connectToDatabase();
  
  const allocation = await TruckAllocation.findById(allocationId);
  
  if (!allocation) {
    throw new Error('Truck allocation not found');
  }
  
  if (allocation.status !== AllocationStatus.IN_PROGRESS) {
    throw new Error('Truck allocation is not in IN_PROGRESS status');
  }
  
  // Update the truck location and status
  await Truck.findByIdAndUpdate(allocation.truck, {
    currentOffice: allocation.destinationOffice,
    status: TruckStatus.AVAILABLE
  });
  
  // Update all consignments
  await Consignment.updateMany(
    { _id: { $in: allocation.consignments } },
    { 
      status: ConsignmentStatus.DELIVERED,
      deliveryDate: new Date()
    }
  );
  
  // Update the allocation
  allocation.status = AllocationStatus.COMPLETED;
  allocation.endDate = new Date();
  await allocation.save();
  
  return allocation;
};

// Calculate average waiting time for consignments
export const getAverageWaitingTime = async (
  officeId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> => {
  await connectToDatabase();
  
  const query: any = {
    dispatchDate: { $ne: null }
  };
  
  if (officeId) {
    query.sourceOffice = new Types.ObjectId(officeId);
  }
  
  if (startDate || endDate) {
    query.receivedDate = {};
    if (startDate) query.receivedDate.$gte = startDate;
    if (endDate) query.receivedDate.$lte = endDate;
  }
  
  const consignments = await Consignment.find(query);
  
  if (consignments.length === 0) {
    return 0;
  }
  
  // Calculate waiting time in days for each consignment
  const waitingTimes = consignments.map(c => {
    const receivedDate = new Date(c.receivedDate);
    const dispatchDate = new Date(c.dispatchDate!);
    const diffTime = Math.abs(dispatchDate.getTime() - receivedDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays;
  });
  
  // Calculate average
  const averageWaitingTime = waitingTimes.reduce((sum, time) => sum + time, 0) / waitingTimes.length;
  
  return averageWaitingTime;
}; 