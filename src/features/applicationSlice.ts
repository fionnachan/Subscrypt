import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isModalOpen: false,
  isNotificationOpen: false,
  notificationTitle: "",
  notificationContent: "",
};

export const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setIsModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
    setIsNotificationOpen: (state, action) => {
      state.isNotificationOpen = action.payload;
    },
    setNotificationTitle: (state, action) => {
      state.notificationTitle = action.payload;
    },
    setNotificationContent: (state, action) => {
      state.notificationContent = action.payload;
    },
  }
});

export const selectIsModalOpen = (state: any) => state.application && state.application.isModalOpen;
export const selectIsNotificationOpen = (state: any) => state.application && state.application.isNotificationOpen;
export const selectNotificationTitle = (state: any) => state.application && state.application.notificationTitle;
export const selectNotificationContent = (state: any) => state.application && state.application.notificationContent;

export const {
  setIsModalOpen,
  setIsNotificationOpen,
  setNotificationTitle,
  setNotificationContent
} = applicationSlice.actions;

export default applicationSlice.reducer;