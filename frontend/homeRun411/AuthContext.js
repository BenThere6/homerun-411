// AuthContext.js
import React, { createContext, useState, useContext } from 'react';

// Create the context
const AuthContext = createContext({
  isLoggedIn: false,
  setIsLoggedIn: () => { },
  user: null,
  setUser: () => { },
  isAdmin: false,
});

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

// AuthProvider component that wraps your app and provides the context
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const isAdmin =
    !!user &&
    (
      user.isTopAdmin === true ||
      Number(user?.adminLevel) === 0 ||
      user?.role === 'admin'
    );

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, user, setUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};