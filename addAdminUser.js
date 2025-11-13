// Script to add an admin user to Firestore
// Run with: node addAdminUser.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs } = require('firebase/firestore');

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

async function addAdminUser() {
  try {
    const email = 'j@gmail.com';
    const password = '123456';
    
    console.log('🔍 Checking if admin user already exists...');
    
    // Check if user already exists
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log('⚠️  User with email', email, 'already exists!');
      console.log('User ID:', querySnapshot.docs[0].id);
      
      // Check if it's an admin
      const userData = querySnapshot.docs[0].data();
      if (userData.userType === 'admin') {
        console.log('✅ User is already an admin!');
      } else {
        console.log('📝 User exists but is not an admin (userType:', userData.userType, ')');
        console.log('💡 Tip: You can manually update the userType in Firestore.');
      }
      return;
    }
    
    console.log('✨ User does not exist. Creating new admin user...');
    
    // Create admin user
    const hashedPassword = hashPassword(password);
    const adminUser = {
      email: email,
      password: hashedPassword,
      userType: 'admin',
      companyName: 'Nimbus Admin',
      fullName: 'Administrator',
      verified: true,
      isActive: true,
      createdAt: new Date(),
      admin: true,
      permissions: ['manage_users', 'verify_listings', 'manage_deals', 'view_analytics']
    };
    
    const docRef = await addDoc(collection(db, 'users'), adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 User Details:');
    console.log('  - Email:', email);
    console.log('  - Password:', password);
    console.log('  - User Type: admin');
    console.log('  - User ID:', docRef.id);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('  Email: j@gmail.com');
    console.log('  Password: 123456');
    
  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    process.exit(1);
  }
}

// Run the script
addAdminUser().then(() => {
  console.log('');
  console.log('🎉 Done!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

