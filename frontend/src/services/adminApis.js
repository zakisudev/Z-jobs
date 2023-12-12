import axios from 'axios';
import { USERS_URL } from '../constants';

// Get all users
export const getUsers = async () => {
  const response = await axios.get(USERS_URL);
  const data = await response.json();
  return data;
};

// Get a user by ID
export const getUserById = async (userId) => {
  const response = await axios.get(`${USERS_URL}/${userId}`);
  const data = await response.json();
  return data;
};

// Update a user
export const updateUser = async (user) => {
  const response = await axios.put(`${USERS_URL}/${user._id}`, user);
  const data = await response.json();
  return data;
};

// Delete a user
export const deleteUser = async (userId) => {
  const response = await axios.delete(`${USERS_URL}/${userId}`);
  const data = await response.json();
  return data;
};
