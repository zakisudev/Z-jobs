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
        <div className="flex justify-center space-x-4">
          <div>
            <img
              src="/illustration.svg" // Replace with your illustration/image
              alt="Illustration"
              className="h-48 w-auto"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-xl font-semibold mb-2">Why Z-jobs?</h2>
            <p className="text-gray-700">
              Our platform simplifies job tracking, allowing you to manage
              applications seamlessly.
            </p>
          </div>
        </div>

        {/* Call-to-action Button */}
        <button
          onClick={() => navigate('/register')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded mt-8 transition duration-300"
        >
          Get Started
        </button>
      </main>
    </>
  );
};
