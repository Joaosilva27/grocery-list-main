import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { signInWithGoogle, logout } from "./Auth";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";

export default function ListManager() {
  const [user, setUser] = useState(null);
  const [listName, setListName] = useState("");
  const [userLists, setUserLists] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        const q = query(
          collection(db, "lists"),
          where("members", "array-contains", user.uid)
        );

        const unsubscribeLists = onSnapshot(q, (snapshot) => {
          setUserLists(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        });

        return () => unsubscribeLists();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleListAccess = async (e) => {
    e.preventDefault();
    if (!listName.trim()) return;

    try {
      const normalized = listName.toLowerCase().replace(/\s+/g, "-");
      const listRef = await addDoc(collection(db, "lists"), {
        name: listName,
        normalizedName: normalized,
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });
      navigate(`/list/${normalized}`);
    } catch (error) {
      console.error("Error creating list:", error);
    }
  };

  const handleRemoveList = async (listId) => {
    try {
      await updateDoc(doc(db, "lists", listId), {
        members: arrayRemove(user.uid),
      });
    } catch (error) {
      console.error("Error removing list:", error);
    }
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

        <form onSubmit={handleListAccess} className="space-y-4 mb-6">
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="New list name"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Create New List
          </button>
        </form>

        <div className="space-y-3">
          {userLists && (
            <h1 className="text-xl font-bold text-white">Your Grocery Lists</h1>
          )}
          {userLists.map((list) => (
            <div
              key={list.id}
              className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
            >
              <Link
                to={`/list/${list.normalizedName}`}
                className="text-white hover:text-green-400 transition-colors flex-1"
              >
                {list.name}
              </Link>
              <button
                onClick={() => handleRemoveList(list.id)}
                className="text-red-400 hover:text-red-300 transition-colors ml-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
