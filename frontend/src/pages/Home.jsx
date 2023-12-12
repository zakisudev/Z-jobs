import { Navbar } from '../components/Navbar';

export const Home = () => {
  return (
    <>
      <header className="flex flex-col justify-center w-full">
        <Navbar />
      </header>

      <main className="flex flex-col justify-center items-center overflow-hidden"></main>
    </>
  );
};
