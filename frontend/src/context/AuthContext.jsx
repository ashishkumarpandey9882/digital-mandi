import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token");
  });

  // LOGIN
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    localStorage.setItem("token", jwtToken);
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoggedIn: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook
export function useAuth() {
  return useContext(AuthContext);
}