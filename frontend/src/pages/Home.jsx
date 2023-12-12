import { Navbar } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <header className="flex flex-col justify-center w-full">
        <Navbar />
      </header>

      <main className="flex flex-col justify-center items-center overflow-hidden">
        <h1 className="text-4xl font-bold mb-4">Welcome to Z-jobs</h1>
        <p className="text-lg text-gray-600 mb-8">
          Track your job applications and stay organized throughout your job
          search.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Get Started
        </button>
      </main>
    </>
  );
};
