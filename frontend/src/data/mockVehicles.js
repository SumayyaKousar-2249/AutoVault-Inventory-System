// Mock vehicle data — replace with backend API calls during integration
export const mockVehicles = [
  { id: 1,  make: 'Toyota',     model: 'Camry',       category: 'Sedan',       price: 26500, quantity: 5,  rating: 4.6, offer: '0% APR for 60 months' },
  { id: 2,  make: 'Honda',      model: 'Civic',       category: 'Sedan',       price: 22400, quantity: 8,  rating: 4.5, offer: '$1,500 cashback' },
  { id: 3,  make: 'Ford',       model: 'F-150',       category: 'Truck',       price: 41200, quantity: 3,  rating: 4.7, offer: 'Free towing package' },
  { id: 4,  make: 'Chevrolet',  model: 'Tahoe',       category: 'SUV',         price: 55000, quantity: 2,  rating: 4.4, offer: null },
  { id: 5,  make: 'BMW',        model: 'X5',          category: 'SUV',         price: 67500, quantity: 1,  rating: 4.8, offer: 'Complimentary service 2 yrs' },
  { id: 6,  make: 'Tesla',      model: 'Model 3',     category: 'Sedan',       price: 42000, quantity: 4,  rating: 4.9, offer: '$500 referral discount' },
  { id: 7,  make: 'Jeep',       model: 'Wrangler',    category: 'SUV',         price: 38000, quantity: 6,  rating: 4.3, offer: null },
  { id: 8,  make: 'Toyota',     model: 'RAV4',        category: 'SUV',         price: 31000, quantity: 7,  rating: 4.6, offer: '1.9% APR financing' },
  { id: 9,  make: 'Porsche',    model: 'Cayenne',     category: 'SUV',         price: 89000, quantity: 1,  rating: 4.9, offer: null },
  { id: 10, make: 'Ford',       model: 'Mustang',     category: 'Sports',      price: 34500, quantity: 3,  rating: 4.7, offer: '$750 summer rebate' },
  { id: 11, make: 'Honda',      model: 'CR-V',        category: 'SUV',         price: 29500, quantity: 9,  rating: 4.5, offer: null },
  { id: 12, make: 'Chevrolet',  model: 'Silverado',   category: 'Truck',       price: 44000, quantity: 4,  rating: 4.4, offer: 'Trade-in bonus $2,000' },
  { id: 13, make: 'Mercedes',   model: 'C-Class',     category: 'Sedan',       price: 52000, quantity: 2,  rating: 4.7, offer: null },
  { id: 14, make: 'Hyundai',    model: 'Elantra',     category: 'Sedan',       price: 19500, quantity: 10, rating: 4.3, offer: '$500 loyalty bonus' },
  { id: 15, make: 'Nissan',     model: 'Altima',      category: 'Sedan',       price: 23000, quantity: 0,  rating: 4.2, offer: null },
  { id: 16, make: 'Kia',        model: 'Sportage',    category: 'SUV',         price: 27000, quantity: 5,  rating: 4.4, offer: '7-year warranty' },
  { id: 17, make: 'Subaru',     model: 'Outback',     category: 'SUV',         price: 30000, quantity: 6,  rating: 4.6, offer: null },
  { id: 18, make: 'Mazda',      model: 'CX-5',        category: 'SUV',         price: 28500, quantity: 4,  rating: 4.5, offer: 'Complimentary floor mats' },
  { id: 19, make: 'Audi',       model: 'A4',          category: 'Sedan',       price: 48000, quantity: 2,  rating: 4.7, offer: null },
  { id: 20, make: 'Dodge',      model: 'Challenger',  category: 'Sports',      price: 36000, quantity: 0,  rating: 4.5, offer: '$1,000 muscle car rebate' },
];

export const CATEGORIES = ['All', 'Sedan', 'SUV', 'Truck', 'Sports'];
