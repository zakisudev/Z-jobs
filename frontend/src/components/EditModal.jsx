import React, { useState } from 'react';
import { updateJob } from '../services/jobApis';
import Loader from '../assets/images/Loading.svg';

export const EditModal = ({
  jobEdit,
  setJobEdit,
  setShowEditModal,
  setJobs,
  jobs,
}) => {
  const [newEditedJob, setNewEditedJob] = useState({
    company: jobEdit.company || '',
    website: jobEdit.website || '',
    region: jobEdit.region || '',
    position: jobEdit.position || '',
    salary: jobEdit.salary || '',
    contact: jobEdit.contact || '',
    status: jobEdit.status || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = ({ target }) => {
    setNewEditedJob({ ...newEditedJob, [target.name]: target.value });
  };

  const handleEditJobs = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const newJobId = jobEdit._id;
    try {
      const res = await updateJob({ newJobId, newEditedJob });
      const newJobs = jobs.map((job) => (job._id === res._id ? res : job));
      setJobs(newJobs);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
    setShowEditModal(false);
  };

  return (
    <>
      <div className="flex items-center justify-center absolute top-10 left-0 w-full">
        <form
          onSubmit={handleEditJobs}
          className="relative flex flex-col p-10 bg-white z-10 rounded-md w-1/3"
        >
          <h1 className="text-2xl font-bold">Edit Job</h1>
          <div className="flex">
            <span
              onClick={() => setShowEditModal(false)}
              className="text-2xl absolute top-5 right-5 cursor-pointer px-1 bg-red-500 rounded-full"
            >
              X
            </span>
          </div>
          <hr className="my-2" />
          <div className="flex items-center w-full">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              name="company"
              className="border-teal-500 border-2 p-2 mt-2 ml-auto w-2/3 text-lg rounded-sm"
              value={newEditedJob.company}
              onChange={handleInputChange}
              placeholder="Company name *"
            />
          </div>

          <div className="flex items-center w-full">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              name="website"
              className="border-teal-500 border-2 p-2 mt-2 ml-auto w-2/3 text-lg rounded-sm"
              value={newEditedJob.website}
              onChange={handleInputChange}
              placeholder="Website/Job board *"
              required
            />
          </div>

          <div className="flex items-center w-full">
            <label htmlFor="website">Region</label>
            <input
              type="text"
              name="region"
              className="border-teal-500 border-2 p-2 mt-2 ml-auto w-2/3 text-lg rounded-sm"
              value={newEditedJob.region}
              onChange={handleInputChange}
              placeholder="Country/Region *"
              required
            />
          </div>

          <div className="flex items-center w-full">
            <label htmlFor="website">Position</label>
            <input
              type="text"
              name="position"
              className="border-teal-500 border-2 p-2 mt-2 ml-auto w-2/3 text-lg rounded-sm"
              value={newEditedJob.position}
              onChange={handleInputChange}
              placeholder="Position *"
              required
            />
          </div>

          <div className="flex items-center w-full">
            <label htmlFor="website">Salary</label>
            <input
              type="text"
              name="salary"
              className="border-teal-500 border-2 p-2 mt-2 ml-auto w-2/3 text-lg rounded-sm"
              value={newEditedJob.salary}
              onChange={handleInputChange}
              placeholder="Salary *"
              required
            />
          </div>

          <div className="flex items-center w-full">
            <label htmlFor="website">Contact</label>
            <input
              type="text"
              name="contact"
              className="border-teal-500 border-2 p-2 mt-2 ml-auto w-2/3 text-lg rounded-sm"
              value={newEditedJob.contact}
              onChange={handleInputChange}
              placeholder="Contact *"
              required
            />
          </div>

          <select
            name="status"
            className="border-teal-500 border-2 p-2 mt-2 w-full text-lg rounded-sm"
            value={newEditedJob.status}
            onChange={handleInputChange}
            required
          >
            <option value="" disabled>
              Select Status *
            </option>
            <option value="applied" className="bg-white">
              Applied
            </option>
            <option value="inProgress" className="bg-blue-400">
              In progress
            </option>
            <option value="interview" className="bg-yellow-300">
              Interview
            </option>
            <option value="accepted" className="bg-green-400">
              Accepted
            </option>
            <option value="rejected" className="bg-red-300">
              Rejected
            </option>
          </select>

          {message && (
            <div className="text-red-500 text-sm font-bold">{message}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-3 font-bold uppercase"
          >
            {isLoading ? (
              <img src={Loader} alt="Loading" className="w-6 h-6 mx-auto" />
            ) : (
              'Save edited Job'
            )}
          </button>
        </form>
      </div>
    </>
  );
};
