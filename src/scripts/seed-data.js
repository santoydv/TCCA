const mongoose = require('mongoose');
const { hash } = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Import models
const Office = require('../models/Office');
const User = require('../models/User');
const { UserRole } = require('../models/User');
const Truck = require('../models/Truck');
const Consignment = require('../models/Consignment');

// Function to generate a random date between two dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to generate a random number between min and max
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Function to generate random element from array
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/transport';
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    await connectToDatabase();
    
    // Clear existing data
    await User.deleteMany({});
    await Office.deleteMany({});
    await Truck.deleteMany({});
    await Consignment.deleteMany({});
    
    console.log('Database cleared.');
    
    // Create offices
    const offices = await Office.insertMany([
      { name: 'Delhi Office', address: '123 Main Street, Delhi', contactNumber: '+91 9876543210' },
      { name: 'Mumbai Office', address: '456 Beach Road, Mumbai', contactNumber: '+91 9876543211' },
      { name: 'Bangalore Office', address: '789 Tech Park, Bangalore', contactNumber: '+91 9876543212' },
      { name: 'Chennai Office', address: '321 Marina Drive, Chennai', contactNumber: '+91 9876543213' },
      { name: 'Kolkata Office', address: '654 Park Street, Kolkata', contactNumber: '+91 9876543214' },
      { name: 'Hyderabad Office', address: '987 Jubilee Hills, Hyderabad', contactNumber: '+91 9876543215' }
    ]);
    
    console.log(`Created ${offices.length} offices.`);
    
    // Create users
    const passwordHash = await hash('password123', 10);
    
    const users = await User.insertMany([
      { 
        name: 'Admin User', 
        email: 'admin@transport.com', 
        password: passwordHash, 
        role: 'ADMIN'
      },
      { 
        name: 'Delhi Manager', 
        email: 'delhi.manager@transport.com', 
        password: passwordHash, 
        role: 'MANAGER',
        office: offices[0]._id
      },
      { 
        name: 'Mumbai Manager', 
        email: 'mumbai.manager@transport.com', 
        password: passwordHash, 
        role: 'MANAGER',
        office: offices[1]._id
      },
      { 
        name: 'Delhi Staff', 
        email: 'delhi.staff@transport.com', 
        password: passwordHash, 
        role: 'STAFF',
        office: offices[0]._id
      },
      { 
        name: 'Mumbai Staff', 
        email: 'mumbai.staff@transport.com', 
        password: passwordHash, 
        role: 'STAFF',
        office: offices[1]._id
      }
    ]);
    
    console.log(`Created ${users.length} users.`);
    
    // Create trucks
    const truckModels = ['Tata Prima', 'Ashok Leyland Ecomet', 'Mahindra Blazo', 'BharatBenz 1617', 'Volvo FH'];
    
    const trucks = [];
    for (let i = 0; i < 30; i++) {
      const officeIndex = i % offices.length;
      const capacity = randomNumber(10, 40);
      
      trucks.push({
        registrationNumber: `TR-${i.toString().padStart(4, '0')}`,
        truckModel: randomElement(truckModels),
        capacity: capacity,
        office: offices[officeIndex]._id,
        maintenanceStatus: randomElement(['Ready', 'Under Maintenance', 'Scheduled Maintenance']),
        lastMaintenance: randomDate(new Date('2023-01-01'), new Date())
      });
    }
    
    const savedTrucks = await Truck.insertMany(trucks);
    console.log(`Created ${savedTrucks.length} trucks.`);
    
    // Create consignments
    const consignments = [];
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, 0, 1); // One year ago
    
    const statusOptions = [
      'PENDING',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED'
    ];
    
    const statusWeights = [0.15, 0.15, 0.6, 0.1]; // 15% pending, 15% in transit, 60% delivered, 10% cancelled
    
    // Weighted random selection for consignment status
    function weightedRandomStatus() {
      const random = Math.random();
      let sum = 0;
      
      for (let i = 0; i < statusWeights.length; i++) {
        sum += statusWeights[i];
        if (random < sum) return statusOptions[i];
      }
      
      return 'PENDING';
    }
    
    for (let i = 0; i < 500; i++) {
      // Ensure source and destination are different
      const sourceOfficeIndex = randomNumber(0, offices.length - 1);
      let destOfficeIndex = randomNumber(0, offices.length - 1);
      while (destOfficeIndex === sourceOfficeIndex) {
        destOfficeIndex = randomNumber(0, offices.length - 1);
      }
      
      const volume = randomNumber(2, 35);
      const charge = volume * randomNumber(300, 500);
      
      const status = weightedRandomStatus();
      
      // Create received date between 1 year ago and now
      const receivedDate = randomDate(startDate, now);
      
      // Create base consignment
      const consignment = {
        trackingNumber: `TN-${i.toString().padStart(6, '0')}`,
        sourceOffice: offices[sourceOfficeIndex]._id,
        destinationOffice: offices[destOfficeIndex]._id,
        volume,
        charge,
        status,
        receivedDate,
        sender: {
          name: `Sender ${i}`,
          contact: `+91 98765${randomNumber(10000, 99999)}`
        },
        receiver: {
          name: `Receiver ${i}`,
          contact: `+91 98765${randomNumber(10000, 99999)}`
        }
      };
      
      // Assign a truck to some consignments
      if (status !== 'PENDING' && Math.random() > 0.2) {
        consignment.truck = savedTrucks[randomNumber(0, savedTrucks.length - 1)]._id;
      }
      
      // Add dispatch date for in_transit and delivered
      if (status === 'IN_TRANSIT' || status === 'DELIVERED') {
        // Dispatch 1-3 days after receiving
        const dispatchDate = new Date(receivedDate);
        dispatchDate.setDate(dispatchDate.getDate() + randomNumber(1, 3));
        consignment.dispatchDate = dispatchDate;
        
        // For delivered items, add a delivery date
        if (status === 'DELIVERED') {
          // Delivery 1-5 days after dispatch
          const deliveredDate = new Date(dispatchDate);
          deliveredDate.setDate(deliveredDate.getDate() + randomNumber(1, 5));
          consignment.deliveredAt = deliveredDate;
        }
      }
      
      consignments.push(consignment);
    }
    
    const savedConsignments = await Consignment.insertMany(consignments);
    console.log(`Created ${savedConsignments.length} consignments.`);
    
    console.log('Seeding completed successfully!');
    
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

// Run the seed function
seed(); 