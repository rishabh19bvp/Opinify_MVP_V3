import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isLoggedIn: boolean;
  userToken: string | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  userToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSignIn: (state, action: PayloadAction<string>) => {
      state.isLoggedIn = true;
      state.userToken = action.payload;
    },
    setSignOut: (state) => {
      state.isLoggedIn = false;
      state.userToken = null;
    },
  },
});

export const { setSignIn, setSignOut } = authSlice.actions;

export default authSlice.reducer; 