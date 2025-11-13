// Mock data script for Nimbus marketplace
// Run this script to populate Firestore with sample data

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeAQnBx42gTbNdEO60L4JFzPyiFOt51W4",
  authDomain: "nimbus-207d9.firebaseapp.com",
  projectId: "nimbus-207d9",
  storageBucket: "nimbus-207d9.firebasestorage.app",
  messagingSenderId: "452942433901",
  appId: "1:452942433901:web:3b013740a4784a24fcf964",
  measurementId: "G-VCTWMCE5HT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple password hashing function (same as in AuthContext)
const hashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Mock users data
const mockUsers = [
  {
    email: "buyer1@techcorp.com",
    password: hashPassword("1403730359"),
    userType: "buyer",
    fullName: "Alice Johnson",
    companyName: "TechCorp AI",
    legalCompanyName: "TechCorp AI Solutions LLC",
    countryOfRegistration: "United States",
    registrationId: "TC-2023-001",
    businessAddress: "123 Tech Street, San Francisco, CA 94105",
    city: "San Francisco",
    state: "California",
    country: "United States",
    contactName: "Alice Johnson",
    position: "CTO",
    workPhone: "+1-555-0123",
    notRestricted: true,
    agreeToTerms: true,
    verified: true,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2024-01-20')
  },
  {
    email: "buyer2@datacenter.com",
    password: hashPassword("password123"),
    userType: "buyer",
    fullName: "Bob Smith",
    companyName: "DataCenter Pro",
    legalCompanyName: "DataCenter Professional Services Inc",
    countryOfRegistration: "Canada",
    registrationId: "DCP-2023-002",
    businessAddress: "456 Data Avenue, Toronto, ON M5H 2N2",
    city: "Toronto",
    state: "Ontario",
    country: "Canada",
    contactName: "Bob Smith",
    position: "Infrastructure Director",
    workPhone: "+1-416-555-0456",
    notRestricted: true,
    agreeToTerms: true,
    verified: true,
    isActive: true,
    createdAt: new Date('2024-01-10'),
    lastLogin: new Date('2024-01-19')
  },
  {
    email: "seller1@hardware.com",
    password: hashPassword("password123"),
    userType: "seller",
    companyName: "Hardware Solutions Inc",
    countryOfRegistration: "United States",
    registrationId: "HS-2023-003",
    incorporationProof: "hs_incorporation.pdf",
    representativeId: "hs_rep_id.pdf",
    legalOwnership: true,
    understandVerification: true,
    bankingDetails: {
      bankName: "First National Bank",
      accountNumber: "1234567890",
      swiftBic: "FNBKUS33"
    },
    verified: true,
    isActive: true,
    createdAt: new Date('2024-01-05'),
    lastLogin: new Date('2024-01-18')
  },
  {
    email: "seller2@compute.com",
    password: hashPassword("password123"),
    userType: "seller",
    companyName: "Compute Dynamics",
    countryOfRegistration: "United Kingdom",
    registrationId: "CD-2023-004",
    incorporationProof: "cd_incorporation.pdf",
    representativeId: "cd_rep_id.pdf",
    legalOwnership: true,
    understandVerification: true,
    bankingDetails: {
      bankName: "Barclays Bank",
      accountNumber: "9876543210",
      swiftBic: "BARCGB22"
    },
    verified: true,
    isActive: true,
    createdAt: new Date('2024-01-08'),
    lastLogin: new Date('2024-01-17')
  }
];

// Real hardware images - will rotate through these
const hardwareImages = [
  "https://www.pny.com/productimages/F8BA18E3-C163-4BD4-B679-AFD300CBCE8D/images/L4_3QTR-Top-Left.png",
  "https://www.amax.com/content/images/2024/04/AceleMax-X-88-CH200.png",
  "https://www.servethehome.com/wp-content/uploads/2021/07/Inspur-NF5488A5-NVIDIA-HGX-A100-8-GPU-Assembly-8x-A100-2.jpg",
  "https://www.leadtek.com/p_images/zoom/40956_1Z.jpg",
  "https://m.opticaltransceiver-module.com/photo/pt171948695-nvidia_a10_tensor_core_gpu_with_good_price_in_stock_from_china.jpg"
];

// Function to get a rotated image
const getRotatedImage = (index) => {
  return hardwareImages[index % hardwareImages.length];
};

// Mock listings data
const mockListings = [
  {
    sellerId: "seller1_id", // Will be replaced with actual ID
    sellerName: "Hardware Solutions Inc",
    gpuModel: "H100",
    chassis: "Dell PowerEdge R750",
    gpuCount: "8",
    cpuModel: "Intel Xeon Gold 6338",
    cpuCount: "2",
    ram: "512",
    storage: "2TB NVMe SSD",
    networking: "Dual 25Gb Ethernet",
    cooling: "air",
    yearOfPurchase: "2023",
    physicalLocation: "United States",
    condition: "used",
    conditionNote: "Used for 6 months in AI training cluster",
    quantity: 2,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-12'),
    frontPhoto: getRotatedImage(0),
    backPhoto: getRotatedImage(1),
    serialPhoto: getRotatedImage(2),
    poweredOnPhoto: getRotatedImage(3)
  },
  {
    sellerId: "seller2_id", // Will be replaced with actual ID
    sellerName: "Compute Dynamics",
    gpuModel: "H200",
    chassis: "Supermicro SYS-421GE-TNRT",
    gpuCount: "4",
    cpuModel: "AMD EPYC 7763",
    cpuCount: "2",
    ram: "256",
    storage: "1TB NVMe SSD",
    networking: "Dual 100Gb InfiniBand",
    cooling: "liquid",
    yearOfPurchase: "2024",
    physicalLocation: "United Kingdom",
    condition: "new",
    conditionNote: "Brand new, never deployed",
    quantity: 1,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-14'),
    frontPhoto: getRotatedImage(0),
    backPhoto: getRotatedImage(0),
    serialPhoto: getRotatedImage(0),
    poweredOnPhoto: getRotatedImage(0)
  },
  {
    sellerId: "seller1_id", // Will be replaced with actual ID
    sellerName: "Hardware Solutions Inc",
    gpuModel: "A100",
    chassis: "HPE ProLiant DL380 Gen10",
    gpuCount: "8",
    cpuModel: "Intel Xeon Gold 6248R",
    cpuCount: "2",
    ram: "256",
    storage: "1TB NVMe SSD",
    networking: "Dual 10Gb Ethernet",
    cooling: "air",
    yearOfPurchase: "2022",
    physicalLocation: "United States",
    condition: "refurbished",
    conditionNote: "Refurbished with new thermal paste and fans",
    quantity: 3,
    ownershipType: "decommission",
    warrantyStatus: "expired",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-16'),
    frontPhoto: getRotatedImage(1),
    backPhoto: getRotatedImage(1),
    serialPhoto: getRotatedImage(1),
    poweredOnPhoto: getRotatedImage(1)
  },
  // Additional comprehensive listings
  {
    sellerId: "seller2_id",
    sellerName: "Compute Dynamics",
    gpuModel: "B200",
    chassis: "Supermicro SYS-421GE-TNRT",
    gpuCount: "2",
    cpuModel: "AMD EPYC 9654",
    cpuCount: "2",
    ram: "512",
    storage: "2TB NVMe SSD",
    networking: "Dual 200Gb InfiniBand",
    cooling: "liquid",
    yearOfPurchase: "2024",
    physicalLocation: "Canada",
    condition: "new",
    conditionNote: "Latest generation, factory sealed",
    quantity: 1,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-20'),
    frontPhoto: getRotatedImage(2),
    backPhoto: getRotatedImage(2),
    serialPhoto: getRotatedImage(2),
    poweredOnPhoto: getRotatedImage(2)
  },
  {
    sellerId: "seller1_id",
    sellerName: "Hardware Solutions Inc",
    gpuModel: "RTX5090",
    chassis: "Custom Build - Fractal Design Define 7",
    gpuCount: "4",
    cpuModel: "AMD Ryzen Threadripper PRO 5995WX",
    cpuCount: "1",
    ram: "128",
    storage: "4TB NVMe SSD",
    networking: "10Gb Ethernet",
    cooling: "custom_loop",
    yearOfPurchase: "2024",
    physicalLocation: "United States",
    condition: "new",
    conditionNote: "Custom workstation build, never used",
    quantity: 1,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-22'),
    frontPhoto: getRotatedImage(3),
    backPhoto: getRotatedImage(3),
    serialPhoto: getRotatedImage(3),
    poweredOnPhoto: getRotatedImage(3)
  },
  {
    sellerId: "seller2_id",
    sellerName: "Compute Dynamics",
    gpuModel: "A100 80G",
    chassis: "Dell PowerEdge R750xa",
    gpuCount: "8",
    cpuModel: "Intel Xeon Gold 6348",
    cpuCount: "2",
    ram: "1TB",
    storage: "8TB NVMe SSD",
    networking: "Dual 100Gb InfiniBand",
    cooling: "liquid",
    yearOfPurchase: "2023",
    physicalLocation: "United Kingdom",
    condition: "used",
    conditionNote: "Used in data center for 8 months",
    quantity: 2,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-18'),
    frontPhoto: getRotatedImage(4),
    backPhoto: getRotatedImage(4),
    serialPhoto: getRotatedImage(4),
    poweredOnPhoto: getRotatedImage(4)
  },
  {
    sellerId: "seller1_id",
    sellerName: "Hardware Solutions Inc",
    gpuModel: "A6000",
    chassis: "HP Z8 G4 Workstation",
    gpuCount: "4",
    cpuModel: "Intel Xeon Gold 6248",
    cpuCount: "2",
    ram: "256",
    storage: "2TB NVMe SSD",
    networking: "10Gb Ethernet",
    cooling: "air",
    yearOfPurchase: "2023",
    physicalLocation: "United States",
    condition: "refurbished",
    conditionNote: "Professionally refurbished with new thermal pads",
    quantity: 1,
    ownershipType: "decommission",
    warrantyStatus: "extended",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-15'),
    frontPhoto: getRotatedImage(5),
    backPhoto: getRotatedImage(5),
    serialPhoto: getRotatedImage(5),
    poweredOnPhoto: getRotatedImage(5)
  },
  {
    sellerId: "seller2_id",
    sellerName: "Compute Dynamics",
    gpuModel: "RTXPRO6000",
    chassis: "Dell Precision 7920",
    gpuCount: "2",
    cpuModel: "Intel Xeon Gold 6248R",
    cpuCount: "2",
    ram: "128",
    storage: "1TB NVMe SSD",
    networking: "10Gb Ethernet",
    cooling: "air",
    yearOfPurchase: "2022",
    physicalLocation: "Canada",
    condition: "used",
    conditionNote: "Used for CAD and rendering workloads",
    quantity: 3,
    ownershipType: "invoice",
    warrantyStatus: "expired",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-10'),
    frontPhoto: getRotatedImage(6),
    backPhoto: getRotatedImage(6),
    serialPhoto: getRotatedImage(6),
    poweredOnPhoto: getRotatedImage(6)
  },
  {
    sellerId: "seller1_id",
    sellerName: "Hardware Solutions Inc",
    gpuModel: "H100",
    chassis: "Supermicro SYS-421GE-TNRT",
    gpuCount: "4",
    cpuModel: "AMD EPYC 7763",
    cpuCount: "2",
    ram: "256",
    storage: "1TB NVMe SSD",
    networking: "Dual 100Gb InfiniBand",
    cooling: "liquid",
    yearOfPurchase: "2023",
    physicalLocation: "United States",
    condition: "new",
    conditionNote: "Brand new, unopened packaging",
    quantity: 1,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-25'),
    frontPhoto: getRotatedImage(7),
    backPhoto: getRotatedImage(7),
    serialPhoto: getRotatedImage(7),
    poweredOnPhoto: getRotatedImage(7)
  },
  {
    sellerId: "seller2_id",
    sellerName: "Compute Dynamics",
    gpuModel: "A100",
    chassis: "Lenovo ThinkSystem SR950",
    gpuCount: "8",
    cpuModel: "Intel Xeon Platinum 8380",
    cpuCount: "4",
    ram: "1TB",
    storage: "4TB NVMe SSD",
    networking: "Dual 25Gb Ethernet",
    cooling: "air",
    yearOfPurchase: "2023",
    physicalLocation: "United Kingdom",
    condition: "used",
    conditionNote: "Used in enterprise environment for 10 months",
    quantity: 1,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-19'),
    frontPhoto: getRotatedImage(8),
    backPhoto: getRotatedImage(8),
    serialPhoto: getRotatedImage(8),
    poweredOnPhoto: getRotatedImage(8)
  },
  {
    sellerId: "seller1_id",
    sellerName: "Hardware Solutions Inc",
    gpuModel: "H200",
    chassis: "Dell PowerEdge R750",
    gpuCount: "2",
    cpuModel: "Intel Xeon Gold 6338",
    cpuCount: "2",
    ram: "128",
    storage: "1TB NVMe SSD",
    networking: "Dual 25Gb Ethernet",
    cooling: "air",
    yearOfPurchase: "2024",
    physicalLocation: "United States",
    condition: "refurbished",
    conditionNote: "Refurbished with new components and testing",
    quantity: 2,
    ownershipType: "decommission",
    warrantyStatus: "extended",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-21'),
    frontPhoto: getRotatedImage(9),
    backPhoto: getRotatedImage(9),
    serialPhoto: getRotatedImage(9),
    poweredOnPhoto: getRotatedImage(9)
  },
  {
    sellerId: "seller2_id",
    sellerName: "Compute Dynamics",
    gpuModel: "B200",
    chassis: "HPE ProLiant DL380 Gen11",
    gpuCount: "1",
    cpuModel: "AMD EPYC 9654",
    cpuCount: "2",
    ram: "256",
    storage: "2TB NVMe SSD",
    networking: "Dual 200Gb InfiniBand",
    cooling: "liquid",
    yearOfPurchase: "2024",
    physicalLocation: "Canada",
    condition: "new",
    conditionNote: "Latest generation, factory sealed",
    quantity: 1,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-23'),
    frontPhoto: getRotatedImage(10),
    backPhoto: getRotatedImage(10),
    serialPhoto: getRotatedImage(10),
    poweredOnPhoto: getRotatedImage(10)
  },
  {
    sellerId: "seller1_id",
    sellerName: "Hardware Solutions Inc",
    gpuModel: "RTX5090",
    chassis: "Custom Build - Corsair Obsidian 1000D",
    gpuCount: "2",
    cpuModel: "AMD Ryzen Threadripper PRO 5995WX",
    cpuCount: "1",
    ram: "64",
    storage: "2TB NVMe SSD",
    networking: "10Gb Ethernet",
    cooling: "custom_loop",
    yearOfPurchase: "2024",
    physicalLocation: "United States",
    condition: "new",
    conditionNote: "Custom gaming/AI workstation build",
    quantity: 1,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-24'),
    frontPhoto: getRotatedImage(11),
    backPhoto: getRotatedImage(11),
    serialPhoto: getRotatedImage(11),
    poweredOnPhoto: getRotatedImage(11)
  },
  {
    sellerId: "seller2_id",
    sellerName: "Compute Dynamics",
    gpuModel: "A100 80G",
    chassis: "Supermicro SYS-421GE-TNRT",
    gpuCount: "4",
    cpuModel: "AMD EPYC 7763",
    cpuCount: "2",
    ram: "512",
    storage: "4TB NVMe SSD",
    networking: "Dual 100Gb InfiniBand",
    cooling: "liquid",
    yearOfPurchase: "2023",
    physicalLocation: "United Kingdom",
    condition: "used",
    conditionNote: "Used in research lab for 6 months",
    quantity: 1,
    ownershipType: "invoice",
    warrantyStatus: "active",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-17'),
    frontPhoto: getRotatedImage(12),
    backPhoto: getRotatedImage(12),
    serialPhoto: getRotatedImage(12),
    poweredOnPhoto: getRotatedImage(12)
  },
  {
    sellerId: "seller1_id",
    sellerName: "Hardware Solutions Inc",
    gpuModel: "A6000",
    chassis: "Dell Precision 7920 Tower",
    gpuCount: "2",
    cpuModel: "Intel Xeon Gold 6248",
    cpuCount: "2",
    ram: "128",
    storage: "1TB NVMe SSD",
    networking: "10Gb Ethernet",
    cooling: "air",
    yearOfPurchase: "2023",
    physicalLocation: "United States",
    condition: "refurbished",
    conditionNote: "Professionally refurbished workstation",
    quantity: 2,
    ownershipType: "decommission",
    warrantyStatus: "extended",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-13'),
    frontPhoto: getRotatedImage(13),
    backPhoto: getRotatedImage(13),
    serialPhoto: getRotatedImage(13),
    poweredOnPhoto: getRotatedImage(13)
  },
  {
    sellerId: "seller2_id",
    sellerName: "Compute Dynamics",
    gpuModel: "RTXPRO6000",
    chassis: "HP Z8 G4 Workstation",
    gpuCount: "1",
    cpuModel: "Intel Xeon Gold 6248R",
    cpuCount: "2",
    ram: "64",
    storage: "1TB NVMe SSD",
    networking: "10Gb Ethernet",
    cooling: "air",
    yearOfPurchase: "2022",
    physicalLocation: "Canada",
    condition: "used",
    conditionNote: "Used for professional graphics work",
    quantity: 1,
    ownershipType: "invoice",
    warrantyStatus: "expired",
    status: "active",
    verified: true,
    createdAt: new Date('2024-01-11'),
    frontPhoto: getRotatedImage(14),
    backPhoto: getRotatedImage(14),
    serialPhoto: getRotatedImage(14),
    poweredOnPhoto: getRotatedImage(14)
  }
];

// Mock offers data
const mockOffers = [
  {
    buyerId: "buyer1_id", // Will be replaced with actual ID
    sellerId: "seller1_id", // Will be replaced with actual ID
    listingId: "listing1_id", // Will be replaced with actual ID
    gpuModel: "H100",
    offerPrice: 45000,
    quantity: 1,
    targetDeliveryWindow: "2-3 weeks",
    notes: "Interested in purchasing for our AI research lab",
    status: "pending",
    createdAt: new Date('2024-01-18')
  },
  {
    buyerId: "buyer2_id", // Will be replaced with actual ID
    sellerId: "seller2_id", // Will be replaced with actual ID
    listingId: "listing2_id", // Will be replaced with actual ID
    gpuModel: "H200",
    offerPrice: 65000,
    quantity: 1,
    targetDeliveryWindow: "1-2 weeks",
    notes: "Need for urgent ML project deployment",
    status: "accepted",
    createdAt: new Date('2024-01-17')
  }
];

// Mock deals data
const mockDeals = [
  {
    buyerId: "buyer2_id", // Will be replaced with actual ID
    sellerId: "seller2_id", // Will be replaced with actual ID
    listingId: "listing2_id", // Will be replaced with actual ID
    offerId: "offer2_id", // Will be replaced with actual ID
    gpuModel: "H200",
    quantity: 1,
    agreedPrice: 65000,
    totalValue: 65000,
    status: "in_progress",
    currentStep: "escrow_funded",
    complianceStatus: "approved",
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-19')
  }
];

async function addMockData() {
  try {
    console.log('🚀 Starting to add mock data to Firestore...');

    // Add users
    console.log('👥 Adding users...');
    const userIds = {};
    for (const user of mockUsers) {
      const docRef = await addDoc(collection(db, 'users'), user);
      userIds[user.email] = docRef.id;
      console.log(`✅ Added user: ${user.email} (ID: ${docRef.id})`);
    }

    // Update listings with actual seller IDs
    console.log('📋 Adding listings...');
    const listingIds = {};
    for (let i = 0; i < mockListings.length; i++) {
      const listing = { ...mockListings[i] };
      
      // Replace seller ID placeholders with actual IDs
      if (listing.sellerId === "seller1_id") {
        listing.sellerId = userIds["seller1@hardware.com"];
      } else if (listing.sellerId === "seller2_id") {
        listing.sellerId = userIds["seller2@compute.com"];
      }

      const docRef = await addDoc(collection(db, 'listings'), listing);
      listingIds[`listing${i + 1}_id`] = docRef.id;
      console.log(`✅ Added listing: ${listing.gpuModel} Server (ID: ${docRef.id})`);
    }

    // Update offers with actual IDs
    console.log('💰 Adding offers...');
    const offerIds = {};
    for (let i = 0; i < mockOffers.length; i++) {
      const offer = { ...mockOffers[i] };
      
      // Replace ID placeholders with actual IDs
      if (offer.buyerId === "buyer1_id") {
        offer.buyerId = userIds["buyer1@techcorp.com"];
      } else if (offer.buyerId === "buyer2_id") {
        offer.buyerId = userIds["buyer2@datacenter.com"];
      }
      
      if (offer.sellerId === "seller1_id") {
        offer.sellerId = userIds["seller1@hardware.com"];
      } else if (offer.sellerId === "seller2_id") {
        offer.sellerId = userIds["seller2@compute.com"];
      }
      
      if (offer.listingId === "listing1_id") {
        offer.listingId = listingIds["listing1_id"];
      } else if (offer.listingId === "listing2_id") {
        offer.listingId = listingIds["listing2_id"];
      }

      const docRef = await addDoc(collection(db, 'offers'), offer);
      offerIds[`offer${i + 1}_id`] = docRef.id;
      console.log(`✅ Added offer: $${offer.offerPrice} for ${offer.gpuModel} (ID: ${docRef.id})`);
    }

    // Update deals with actual IDs
    console.log('🤝 Adding deals...');
    for (let i = 0; i < mockDeals.length; i++) {
      const deal = { ...mockDeals[i] };
      
      // Replace ID placeholders with actual IDs
      if (deal.buyerId === "buyer2_id") {
        deal.buyerId = userIds["buyer2@datacenter.com"];
      }
      
      if (deal.sellerId === "seller2_id") {
        deal.sellerId = userIds["seller2@compute.com"];
      }
      
      if (deal.listingId === "listing2_id") {
        deal.listingId = listingIds["listing2_id"];
      }
      
      if (deal.offerId === "offer2_id") {
        deal.offerId = offerIds["offer2_id"];
      }

      const docRef = await addDoc(collection(db, 'deals'), deal);
      console.log(`✅ Added deal: ${deal.gpuModel} Server - $${deal.totalValue} (ID: ${docRef.id})`);
    }

    console.log('🎉 Mock data successfully added to Firestore!');
    console.log('\n📊 Summary:');
    console.log(`- ${mockUsers.length} users added`);
    console.log(`- ${mockListings.length} listings added`);
    console.log(`- ${mockOffers.length} offers added`);
    console.log(`- ${mockDeals.length} deals added`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Buyer 1: buyer1@techcorp.com / password123');
    console.log('Buyer 2: buyer2@datacenter.com / password123');
    console.log('Seller 1: seller1@hardware.com / password123');
    console.log('Seller 2: seller2@compute.com / password123');

  } catch (error) {
    console.error('❌ Error adding mock data:', error);
  }
}

// Run the script
addMockData();
