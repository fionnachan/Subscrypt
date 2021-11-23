import { configureStore } from '@reduxjs/toolkit'
import walletReducer from '../features/walletSlice';
import applicationReducer from '../features/applicationSlice';

const store = configureStore({
  reducer: {
    wallet: walletReducer,
    application: applicationReducer,
  },
  preloadedState: {
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    })
});

export default store;