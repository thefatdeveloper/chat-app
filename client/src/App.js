import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { loginSuccess } from "./pages/userSlice";
import axiosClient from "./api/axiosClient";
// Pages
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Profile from "./pages/profile/Profile";
import Chat from "./pages/chat/Chat";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  // Get the user from the redux store
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Check if the user is logged in or not
  useEffect(() => {
    // Get the user from local storage
    const loggedInUser = localStorage.getItem("user");
    let foundUser;

    // If the user is logged in then dispatch the loginSuccess action
    if (loggedInUser) {
      foundUser = JSON.parse(loggedInUser);
      
      const fetchUser = async () => {
        try {
          // get the user from the database
          const res = await axiosClient.get(
            `/users/?username=${foundUser?.username}`
          );
          dispatch(loginSuccess(res.data));
        } catch (error) {
          console.error("Error fetching user:", error);
          localStorage.removeItem("user"); // Clear invalid session
        }
      };

      fetchUser();
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={user ? <Home /> : <Navigate to="/login" replace />} 
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />

        {/* Protected routes */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;