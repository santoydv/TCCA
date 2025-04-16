import { hash } from 'bcrypt';
import connectToDatabase from './mongodb';
import { UserRole } from '@/models/User';
import { OfficeType } from '@/models/Office';
import { TruckStatus } from '@/models/Truck';
import { ConsignmentStatus } from '@/models/Consignment';
import { AllocationStatus } from '@/models/TruckAllocation';
import mongoose from 'mongoose';

// Dynamic imports to avoid circular dependencies
async function importModels() {
  const { default: User } = await import('@/models/User');
  const { default: Office } = await import('@/models/Office');
  const { default: Truck } = await import('@/models/Truck');
  const { default: Consignment } = await import('@/models/Consignment');
  const { default: TruckAllocation } = await import('@/models/TruckAllocation');
  return { User, Office, Truck, Consignment, TruckAllocation };
}

export async function seedDatabase() {
  console.log('Connecting to database...');
  await connectToDatabase();
  const { User, Office, Truck, Consignment, TruckAllocation } = await importModels();

  // Clear existing data
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Office.deleteMany({});
  await Truck.deleteMany({});
  await Consignment.deleteMany({});
  await TruckAllocation.deleteMany({});

  // Create offices
  console.log('Creating offices...');
  const headOffice = await Office.create({
    name: 'Head Office - Mumbai',
    type: OfficeType.HEAD_OFFICE,
    address: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
    },
    phoneNumber: '+91-22-12345678',
    email: 'headoffice@transportco.com',
  });

  const branchOffices = await Office.insertMany([
    {
      name: 'Delhi Branch',
      type: OfficeType.BRANCH_OFFICE,
      address: {
        street: '456 Park Avenue',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        postalCode: '110001',
      },
      phoneNumber: '+91-11-23456789',
      email: 'delhi@transportco.com',
    },
    {
      name: 'Bangalore Branch',
      type: OfficeType.BRANCH_OFFICE,
      address: {
        street: '789 Tech Park',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001',
      },
      phoneNumber: '+91-80-34567890',
      email: 'bangalore@transportco.com',
    },
    {
      name: 'Chennai Branch',
      type: OfficeType.BRANCH_OFFICE,
      address: {
        street: '321 Marina Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600001',
      },
      phoneNumber: '+91-44-45678901',
      email: 'chennai@transportco.com',
    },
  ]);

  // Create users
  console.log('Creating users...');
  const passwordHash = await hash('password123', 10);
  
  await User.insertMany([
    {
      name: 'Admin User',
      email: 'admin@transportco.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      office: headOffice._id,
    },
    {
      name: 'Manager User',
      email: 'manager@transportco.com',
      password: passwordHash,
      role: UserRole.MANAGER,
      office: headOffice._id,
    },
    {
      name: 'Delhi Staff',
      email: 'delhi.staff@transportco.com',
      password: passwordHash,
      role: UserRole.STAFF,
      office: branchOffices[0]._id,
    },
    {
      name: 'Bangalore Staff',
      email: 'bangalore.staff@transportco.com',
      password: passwordHash,
      role: UserRole.STAFF,
      office: branchOffices[1]._id,
    },
    {
      name: 'Chennai Staff',
      email: 'chennai.staff@transportco.com',
      password: passwordHash,
      role: UserRole.STAFF,
      office: branchOffices[2]._id,
    },
  ]);

  // Create trucks
  console.log('Creating trucks...');
  const trucks = await Truck.insertMany([
    {
      registrationNumber: 'MH01AB1234',
      truckModel: 'Tata Prima',
      capacity: 600,
      manufactureYear: 2022,
      status: TruckStatus.AVAILABLE,
      currentOffice: headOffice._id,
      lastMaintenance: new Date('2023-01-15'),
    },
    {
      registrationNumber: 'MH01CD5678',
      truckModel: 'Ashok Leyland',
      capacity: 550,
      manufactureYear: 2021,
      status: TruckStatus.AVAILABLE,
      currentOffice: headOffice._id,
      lastMaintenance: new Date('2023-02-20'),
    },
    {
      registrationNumber: 'DL01EF9012',
      truckModel: 'Mahindra Blazo',
      capacity: 580,
      manufactureYear: 2023,
      status: TruckStatus.AVAILABLE,
      currentOffice: branchOffices[0]._id,
      lastMaintenance: new Date('2023-03-10'),
    },
    {
      registrationNumber: 'KA01GH3456',
      truckModel: 'BharatBenz',
      capacity: 620,
      manufactureYear: 2022,
      status: TruckStatus.IN_TRANSIT,
      currentOffice: branchOffices[1]._id,
      lastMaintenance: new Date('2023-02-05'),
    },
    {
      registrationNumber: 'TN01IJ7890',
      truckModel: 'Eicher Pro',
      capacity: 540,
      manufactureYear: 2021,
      status: TruckStatus.MAINTENANCE,
      currentOffice: branchOffices[2]._id,
      lastMaintenance: new Date('2023-04-01'),
    },
  ]);

  // Create consignments
  console.log('Creating consignments...');
  const consignments = await Consignment.insertMany([
    {
      consignmentNumber: 'CN-123456-A1B2C',
      volume: 50,
      sender: {
        name: 'ABC Electronics',
        address: '123 Tech Park, Mumbai',
        contact: '+91-9876543210',
      },
      receiver: {
        name: 'XYZ Distributors',
        address: '456 Market Road, Delhi',
        contact: '+91-9876543211',
      },
      sourceOffice: headOffice._id,
      destinationOffice: branchOffices[0]._id,
      status: ConsignmentStatus.RECEIVED,
      charge: 5000,
      truck: null,
      receivedDate: new Date('2023-04-01'),
      dispatchDate: null,
      deliveryDate: null,
    },
    {
      consignmentNumber: 'CN-123457-D3E4F',
      volume: 75,
      sender: {
        name: 'LMN Manufacturing',
        address: '789 Industrial Area, Mumbai',
        contact: '+91-9876543212',
      },
      receiver: {
        name: 'PQR Retailers',
        address: '101 Commercial Street, Bangalore',
        contact: '+91-9876543213',
      },
      sourceOffice: headOffice._id,
      destinationOffice: branchOffices[1]._id,
      status: ConsignmentStatus.WAITING,
      charge: 7500,
      truck: trucks[1]._id,
      receivedDate: new Date('2023-04-02'),
      dispatchDate: null,
      deliveryDate: null,
    },
    {
      consignmentNumber: 'CN-123458-G5H6I',
      volume: 100,
      sender: {
        name: 'UVW Exports',
        address: '202 Port Area, Chennai',
        contact: '+91-9876543214',
      },
      receiver: {
        name: 'EFG Importers',
        address: '303 Business Hub, Mumbai',
        contact: '+91-9876543215',
      },
      sourceOffice: branchOffices[2]._id,
      destinationOffice: headOffice._id,
      status: ConsignmentStatus.IN_TRANSIT,
      charge: 10000,
      truck: trucks[3]._id,
      receivedDate: new Date('2023-04-03'),
      dispatchDate: new Date('2023-04-05'),
      deliveryDate: null,
    },
    {
      consignmentNumber: 'CN-123459-J7K8L',
      volume: 60,
      sender: {
        name: 'HIJ Wholesale',
        address: '404 Market Complex, Delhi',
        contact: '+91-9876543216',
      },
      receiver: {
        name: 'RST Retail',
        address: '505 Shopping Mall, Chennai',
        contact: '+91-9876543217',
      },
      sourceOffice: branchOffices[0]._id,
      destinationOffice: branchOffices[2]._id,
      status: ConsignmentStatus.DELIVERED,
      charge: 6000,
      truck: trucks[2]._id,
      receivedDate: new Date('2023-03-25'),
      dispatchDate: new Date('2023-03-27'),
      deliveryDate: new Date('2023-03-30'),
    },
  ]);

  // Create truck allocations
  console.log('Creating truck allocations...');
  await TruckAllocation.insertMany([
    {
      truck: trucks[1]._id,
      sourceOffice: headOffice._id,
      destinationOffice: branchOffices[1]._id,
      startDate: new Date('2023-04-02'),
      endDate: null,
      consignments: [consignments[1]._id],
      totalVolume: 75,
      status: AllocationStatus.PLANNED,
      idleTime: 0,
      waitingTime: 0,
      notes: 'Ready for dispatch',
    },
    {
      truck: trucks[3]._id,
      sourceOffice: branchOffices[2]._id,
      destinationOffice: headOffice._id,
      startDate: new Date('2023-04-05'),
      endDate: null,
      consignments: [consignments[2]._id],
      totalVolume: 100,
      status: AllocationStatus.IN_PROGRESS,
      idleTime: 0,
      waitingTime: 2,
      notes: 'In transit, ETA: 2 days',
    },
    {
      truck: trucks[2]._id,
      sourceOffice: branchOffices[0]._id,
      destinationOffice: branchOffices[2]._id,
      startDate: new Date('2023-03-27'),
      endDate: new Date('2023-03-30'),
      consignments: [consignments[3]._id],
      totalVolume: 60,
      status: AllocationStatus.COMPLETED,
      idleTime: 0,
      waitingTime: 2,
      notes: 'Delivered successfully',
    },
  ]);

  console.log('Seed data created successfully!');
  return { offices: [headOffice, ...branchOffices], trucks, consignments };
}

export async function resetDatabase() {
  await connectToDatabase();
  const { User, Office, Truck, Consignment, TruckAllocation } = await importModels();
  
  await User.deleteMany({});
  await Office.deleteMany({});
  await Truck.deleteMany({});
  await Consignment.deleteMany({});
  await TruckAllocation.deleteMany({});
  
  console.log('Database reset successfully!');
} 