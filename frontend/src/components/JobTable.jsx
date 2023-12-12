import { useState } from 'react';
import { EditModal } from './EditModal';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { deleteJob } from '../services/jobApis';
import { toast } from 'react-toastify';

const JobTable = ({ jobs, setJobs }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [message, setMessage] = useState('');

  const [jobEdit, setJobEdit] = useState({
    company: '',
    website: '',
    region: '',
    position: '',
    salary: '',
    contact: '',
    status: '',
  });

  const handleEditClick = (jobId) => {
    setShowEditModal(true);
    const job = jobs.find((job) => job._id === jobId);
    setJobEdit({
      _id: job._id,
      company: job.company,
      website: job.website,
      region: job.region,
      position: job.position,
      salary: job.salary,
      contact: job.contact,
      status: job.status,
    });
  };

  const handleDeleteJob = async (jobId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this job?')) return;
      await deleteJob(jobId);
      const newJobs = jobs.filter((job) => job._id !== jobId);
      setJobs(newJobs);
      toast.success('Job deleted successfully');
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center w-full">
        {showEditModal && (
          <>
            <div
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-black opacity-50 z-10"
            ></div>
            <EditModal
              setShowEditModal={setShowEditModal}
              jobEdit={jobEdit}
              setJobEdit={setJobEdit}
              setJobs={setJobs}
              jobs={jobs}
            />
          </>
        )}

        <table className=" flex flex-col justify-start items-center mt-5 text-sm">
          <thead className="bg-gray-300 text-black border-gray-600 border-2 mr-auto">
            <tr className="flex justify-around items-center py-2 mx-auto w-full">
              <th className="w-10">No.</th>
              <th className="w-32">Company</th>
              <th className="w-48">Website</th>
              <th className="w-20">Region</th>
              <th className="w-32">Position</th>
              <th className="w-32">Salary</th>
              <th className="w-32">Contact</th>
              <th className="w-32">Status</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody className=" text-black border-gray-600 border-2 mr-auto w-full">
            {jobs > 0 ? (
              <tr className="flex justify-center items-center w-auto">
                <td className="w-full py-2 text-xl font-bold mt-10">
                  No Jobs registered yet
                </td>
              </tr>
            ) : (
              jobs.map((job, index) => (
                <tr
                  key={job._id}
                  id={job._id}
                  className="flex justify-left py-2 mx-auto border-b-2 border-black/20"
                >
                  <td className="w-10 py-2 text-center">{index + 1}</td>
                  <td className="w-32 py-2 ">{job.company}</td>
                  <td className="w-48 py-2 ">{job.website}</td>
                  <td className="w-20 py-2 ">{job.region}</td>
                  <td className="w-40 py-2 ">{job.position}</td>
                  <td className="w-32 py-2 ">{job.salary}</td>
                  <td className="w-32 py-2 ">{job.contact}</td>
                  <td className="w-20 py-2 ">{job.status}</td>
                  <td className="w-10 py-2  flex justify-center ml-auto mr-2">
                    <button
                      className="p-1 mr-2 text-blue-400 hover:bg-blue-300 hover:text-white rounded-sm text-sm font-bold uppercase"
                      onClick={() => handleEditClick(job._id)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="p-1 text-red-400 hover:bg-red-300 hover:text-white rounded-sm text-sm font-bold uppercase"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {message && (
          <div className="flex justify-center items-center w-full">
            <p>{message}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default JobTable;
