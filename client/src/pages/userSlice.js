import { createSlice } from "@reduxjs/toolkit";

const getUserFromStorage = () => {
  try {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return null;
    
    const parsedUser = JSON.parse(savedUser);
    if (!parsedUser._id || !parsedUser.username) {
      localStorage.removeItem("user");
      return null;
    }
    return parsedUser;
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
};

const initialState = {
  user: getUserFromStorage(),
  isFetching: false,
  error: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isFetching = true;
      state.error = false;
    },
    loginSuccess: (state, action) => {
      if (!action.payload?._id || !action.payload?.username) {
        state.error = "Invalid user data";
        return;
      }
      state.user = action.payload;
      state.isFetching = false;
      state.error = false;
      try {
        localStorage.setItem("user", JSON.stringify(action.payload));
      } catch (error) {
        console.error('Error saving user to localStorage:', error);
      }
    },
    loginFail: (state, action) => {
      state.user = null;
      state.isFetching = false;
      state.error = action.payload;
      localStorage.removeItem("user");
    },
    resetState: (state) => {
      state.user = null;
      state.isFetching = false;
      state.error = false;
      localStorage.removeItem("user");
    },
    followUser: (state, action) => {
      if (!state.user) return;
      
      const updatedUser = {
        ...state.user,
        followings: [...state.user.followings, action.payload],
      };
      
      state.user = updatedUser;
      localStorage.setItem("user", JSON.stringify(updatedUser));
    },
    unFollowUser: (state, action) => {
      if (!state.user) return;
      
      const updatedUser = {
        ...state.user,
        followings: state.user.followings.filter(id => id !== action.payload),
      };
      
      state.user = updatedUser;
      localStorage.setItem("user", JSON.stringify(updatedUser));
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFail,
  resetState,
  followUser,
  unFollowUser,
} = userSlice.actions;

export default userSlice.reducer;