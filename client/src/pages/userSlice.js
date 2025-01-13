import { createSlice } from "@reduxjs/toolkit";

const getInitialState = () => {
  const savedUser = localStorage.getItem("user");
  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    isFetching: false,
    error: false,
  };
};

export const userSlice = createSlice({
  name: "user",
  initialState: getInitialState(),
  reducers: {
    loginStart: (state) => {
      state.isFetching = true;
      state.error = false;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isFetching = false;
      state.error = false;
      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(action.payload));
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
      const newState = {
        ...state,
        user: {
          ...state.user,
          followings: [...state.user.followings, action.payload],
        },
      };
      localStorage.setItem("user", JSON.stringify(newState.user));
      return newState;
    },
    unFollowUser: (state, action) => {
      const newState = {
        ...state,
        user: {
          ...state.user,
          followings: state.user.followings.filter(
            (following) => following !== action.payload
          ),
        },
      };
      localStorage.setItem("user", JSON.stringify(newState.user));
      return newState;
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