import axios from 'axios';
import {
  LOGIN_URL,
  REGISTER_URL,
  LOGOUT_URL,
  USER_PROFILE_URL,
} from '../constants';

// Register user
export const registerUser = async (user) => {
  try {
    const response = await axios.post(REGISTER_URL, user);
    const data = await response.data;
    return data;
  } catch (error) {
    throw Error(error?.response?.data?.message || error.message);
  }
};

// Login user
export const loginUser = async (user) => {
  try {
    const response = await axios.post(LOGIN_URL, user);
    const data = await response.data;
    return data;
  } catch (err) {
    throw Error(err?.response?.data?.message || err.message);
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    const response = await axios.get(LOGOUT_URL);
    const data = await response.data;
    return data;
  } catch (err) {
    throw Error(err?.response?.data?.message || err.message);
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await axios.get(USER_PROFILE_URL);
    const data = await response.data;
    return data;
  } catch (err) {
    throw Error(err?.response?.data?.message || err.message);
  }
};

// Update user profile
export const updateUserProfile = async (user) => {
  try {
    const response = await axios.put(USER_PROFILE_URL, user);
    const data = await response.data;
    return data;
  } catch (err) {
    throw Error(err?.response?.data?.message || err.message);
  }
};

// Verify user email
export const verifyEmail = async () => {
  try {
    const response = await axios.get(USER_PROFILE_URL);
    const data = await response.data;
    return data;
  } catch (err) {
    throw Error(err?.response?.data?.message || err.message);
  }
};
