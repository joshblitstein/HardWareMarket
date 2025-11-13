import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simple password hashing (in production, use a proper hashing library)
  const hashPassword = (password) => {
    // This is a simple hash for demo purposes - use bcrypt or similar in production
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  };

  // Helper function to hash passwords for database storage
  // You can call this from browser console: hashPasswordForDB('your-password')
  window.hashPasswordForDB = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    console.log('Your hashed password is:', hash.toString());
    return hash.toString();
  };

  async function signup(email, password, userData) {
    try {
      // Check if user already exists
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('User with this email already exists');
      }

      // Create new user document
      const hashedPassword = hashPassword(password);
      const userDataWithAuth = {
        ...userData,
        email: email,
        password: hashedPassword,
        createdAt: new Date(),
        verified: false,
        isActive: true,
      };

      const docRef = await addDoc(collection(db, 'users'), userDataWithAuth);
      
      // Set current user
      const newUser = { id: docRef.id, email: email };
      setCurrentUser(newUser);
      setUserProfile({ id: docRef.id, ...userDataWithAuth });
      
      return newUser;
    } catch (error) {
      console.error('Signup error:', error.message);
      throw error;
    }
  }

  async function login(email, password) {
    try {
      // Find user by email
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('No account found with this email address');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Check password
      const hashedPassword = hashPassword(password);
      
      // Convert database password to string for comparison (handles both number and string formats)
      const dbPasswordStr = String(userData.password);
      
      // If the password in DB doesn't match, check if it's plain text and needs to be updated
      let passwordMatch = dbPasswordStr === hashedPassword;
      
      // For legacy accounts with plain text passwords, allow temporary authentication
      // but suggest they update their password
      if (!passwordMatch && dbPasswordStr === password) {
        console.warn('Plain text password detected - updating to hashed version!');
        // Update the password in the database to the hashed version
        await setDoc(doc(db, 'users', userDoc.id), {
          ...userData,
          password: hashedPassword
        }, { merge: true });
        passwordMatch = true;
      }
      
      if (!passwordMatch) {
        throw new Error('Incorrect password');
      }

      // Check if account is active
      if (!userData.isActive) {
        throw new Error('Account is deactivated');
      }

      // Set current user
      const user = { id: userDoc.id, email: email };
      setCurrentUser(user);
      setUserProfile({ id: userDoc.id, ...userData });
      
      return user;
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  }

  async function changePassword(currentPassword, newPassword) {
    try {
      if (!currentUser || !currentUser.id) {
        throw new Error('User not logged in');
      }

      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', currentUser.id));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      
      // Verify current password
      const hashedCurrentPassword = hashPassword(currentPassword);
      const dbPasswordStr = String(userData.password);
      const passwordMatch = dbPasswordStr === hashedCurrentPassword || 
                           (dbPasswordStr === currentPassword); // Support legacy plain text

      if (!passwordMatch) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = hashPassword(newPassword);

      // Update password in database
      await setDoc(doc(db, 'users', currentUser.id), {
        ...userData,
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Change password error:', error.message);
      throw error;
    }
  }

  async function logout() {
    setCurrentUser(null);
    setUserProfile(null);
  }

  async function fetchUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = () => {
      const savedUser = localStorage.getItem('nimbus_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          fetchUserProfile(user.id);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('nimbus_user');
        }
      }
      setLoading(false);
    };

    checkExistingSession();
  }, []);

  // Save user to localStorage when logged in
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nimbus_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('nimbus_user');
    }
  }, [currentUser]);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    changePassword,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
