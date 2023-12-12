import { useState } from 'react';
import { createJob } from '../services/jobApis';
import { toast } from 'react-toastify';
import Loader from '../assets/images/Loading.svg';

const NewForm = ({ setShowCreateModal, setJobs, jobs }) => {
  const [newJob, setNewJob] = useState({
    company: '',
    website: '',
    region: '',
    position: '',
    salary: '',
    contact: '',
    status: '',
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const job = await createJob(newJob);
      setJobs([job, ...jobs]);
      toast.success('Job added successfully');
      setShowCreateModal(false);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }

    setNewJob({
      company: '',
      website: '',
      region: '',
      position: '',
      salary: '',
      contact: '',
      status: '',
    });
  };

  return (
    <>
      <div className="flex items-center justify-center absolute top-10 left-0 w-full">
        <form
          onSubmit={handleSubmit}
          className="relative flex flex-col p-10 bg-white z-10 rounded-md w-1/3"
        >
          <h1 className="text-center text-xl my-2 underline font-bold">
            Add new Job
          </h1>
          <button
            className="absolute top-0 right-0 m-2 px-1 hover:bg-red-300 rounded-full transition-all duration-100"
            onClick={() => setShowCreateModal(false)}
          >
            <strong>X</strong>
          </button>
          <input
            type="text"
            name="company"
            className="border-teal-500 border-2 p-2 mt-2 text-lg rounded-sm"
            value={newJob.company}
            onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
            placeholder="Company name *"
            required
          />
          <input
            type="text"
            name="website"
            className="border-teal-500 border-2 p-2 mt-2 text-lg rounded-sm"
            value={newJob.website}
            onChange={(e) => setNewJob({ ...newJob, website: e.target.value })}
            placeholder="Website/Job board *"
            required
          />
          <input
            type="text"
            name="region"
            className="border-teal-500 border-2 p-2 mt-2 text-lg rounded-sm"
            value={newJob.region}
            onChange={(e) => setNewJob({ ...newJob, region: e.target.value })}
            placeholder="Country/Region *"
            required
          />
          <input
            type="text"
            name="position"
            className="border-teal-500 border-2 p-2 mt-2 text-lg rounded-sm"
            value={newJob.position}
            onChange={(e) => setNewJob({ ...newJob, position: e.target.value })}
            placeholder="Position *"
            required
          />
          <input
            type="text"
            name="salary"
            className="border-teal-500 border-2 p-2 mt-2 text-lg rounded-sm"
            value={newJob.salary}
            onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
            placeholder="Salary *"
            required
          />
          <input
            type="text"
            name="contact"
            className="border-teal-500 border-2 p-2 mt-2 text-lg rounded-sm"
            value={newJob.contact}
            onChange={(e) => setNewJob({ ...newJob, contact: e.target.value })}
            placeholder="Contact"
          />
          <select
            name="status"
            className="border-teal-500 border-2 p-2 mt-2 text-lg rounded-sm"
            value={newJob.status}
            onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
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
            <div className="text-red-500 text-lg text-center">{message}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-1 bg-teal-500 border-2 mt-2 font-bold text-lg rounded-sm uppercase"
          >
            {isLoading ? (
              <img src={Loader} alt="Loading..." className="w-6 h-6 mx-auto" />
            ) : (
              'Add Job'
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default NewForm;
