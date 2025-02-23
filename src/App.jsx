import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import ListPage from "./ListPage";
import { auth } from "./firebase";
import { signInWithGoogle, logout } from "./Auth";

function ListManager() {
  const [user, setUser] = useState(null);
  const [listName, setListName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleListAccess = (e) => {
    e.preventDefault();
    const normalized = listName.toLowerCase().replace(/\s+/g, "-");
    navigate(`/list/${normalized}`);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 px-4">
        <div className="text-center p-8 rounded-xl bg-gray-800 max-w-md w-full">
          <h1 className="text-2xl text-white mb-6 font-bold">
            Grocery List App
          </h1>
          <button
            onClick={signInWithGoogle}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl w-full flex items-center justify-center gap-2 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col max-w-56">
            <h1 className="text-xl font-bold text-white">Create New List</h1>
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-xs hover:text-gray-300 transition-colors">
                Lists are online & synchronized in real-time! Share the list
                name with your friends or your partner to collaborate together.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <img
              src={user.photoURL}
              className="w-8 h-8 rounded-full object-cover"
              alt="User"
            />
            <button
              onClick={logout}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <form onSubmit={handleListAccess} className="space-y-4">
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Enter list name"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Create List
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/list/:listName" element={<ListPage />} />
      <Route path="/" element={<ListManager />} />
    </Routes>
  );
}

export default App;
