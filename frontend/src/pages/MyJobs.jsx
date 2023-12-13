import { useState, useEffect } from 'react';
import NewForm from '../components/NewForm';
import JobTable from '../components/JobTable';
import { getAllJobs } from '../services/jobApis';
import { FaFolderPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { sendVerifyEmail } from '../services/userApis';

const MyJobs = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [verify, setVerify] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('userInfo')) || null;

  useEffect(() => {
    const fetchJobs = async () => {
      const jobs = await getAllJobs();
      setJobs(jobs);
    };
    if (!user) {
      navigate('/login');
    }
    fetchJobs();
  }, [setJobs, setShowCreateModal, navigate, user]);

  const handleCreateModal = (e) => {
    e.preventDefault();
    setShowCreateModal(true);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await sendVerifyEmail();
      setVerify(true);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {user.isVerified ? (
        <div className="flex flex-col w-full">
          <div className="flex flex-col w-400 pt-5 pl-5">
            <h1 className="text-3xl font-bold">Welcome to Z-Jobs!</h1>
            <h2 className="text-xl font-bold">Track your Jobs efficiently</h2>
          </div>

          {showCreateModal && (
            <>
              <div
                onClick={() => setShowCreateModal(false)}
                className="fixed inset-0 bg-black opacity-50 z-10 transition-all duration-100"
              ></div>
              <NewForm
                setShowCreateModal={setShowCreateModal}
                setJobs={setJobs}
                jobs={jobs}
              />
            </>
          )}

          <div className="flex justify-end ml-auto">
            <button
              onClick={handleCreateModal}
              className="flex items-center mr-5 font-bold  text-white active:scale-95 text-xl px-3 py-1 rounded-md border-none bg-blue-500 transition-all duration-100"
            >
              <FaFolderPlus className="mr-2" /> Add Job
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="flex justify-center items-center w-full">
              <p className="text-2xl font-bold">No Jobs registered yet</p>
            </div>
          ) : (
            <div className="flex w-full">
              <JobTable jobs={jobs} setJobs={setJobs} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-full justify-around items-center mt-10">
          <div className="flex flex-col w-400 pl-5 text-center">
            <h1 className="text-3xl font-bold">Welcome to Z-Jobs!</h1>
            <h2 className="text-xl font-bold">Track your Jobs efficiently</h2>
            <p className="text-2xl font-bold mt-10">
              Please verify your email to use this feature
            </p>
          </div>
        </div>
      )}
    </>
  );
};
export default MyJobs;
