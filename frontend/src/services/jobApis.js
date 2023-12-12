import axios from 'axios';
import { JOBS_URL } from '../constants';

// Get all jobs
export const getAllJobs = async () => {
  try {
    const response = await axios.get(JOBS_URL);
    const data = await response.data;
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Get a job by ID
export const getJobById = async (jobId) => {
  try {
    const response = await axios.get(`${JOBS_URL}/${jobId}`);
    const data = await response.data();
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Create a job
export const createJob = async (job) => {
  try {
    const response = await axios.post(JOBS_URL, job, { withCredentials: true });
    const data = await response.data;
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Update a job
export const updateJob = async ({ newJobId, newEditedJob }) => {
  try {
    const response = await axios.put(`${JOBS_URL}/${newJobId}`, newEditedJob, {
      withCredentials: true,
    });
    const data = await response.data;
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Delete a job
export const deleteJob = async (jobId) => {
  try {
    const response = await axios.delete(`${JOBS_URL}/${jobId}`);
    const data = await response.data();
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};
