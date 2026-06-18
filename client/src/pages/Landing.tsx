import Navbar from "../components/Navbar";

function Landing() {
  return (
    <>
      <Navbar />

      <div className="text-center mt-32">
        <h1 className="text-6xl font-bold">
          SignForge
        </h1>

        <p className="mt-6 text-xl">
          Upload, Place, Sign and Share PDFs Securely
        </p>

        <div className="mt-10">
          <a
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded mr-4"
          >
            Login
          </a>

          <a
            href="/register"
            className="bg-green-600 text-white px-6 py-3 rounded"
          >
            Register
          </a>
        </div>
      </div>
    </>
  );
}

export default Landing;