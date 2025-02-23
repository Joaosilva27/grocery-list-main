import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Link } from "react-router-dom";
import { signInWithGoogle, logout } from "./Auth";

export default function ListsPage({ user }) {
  const [newListName, setNewListName] = useState("");
  const [lists, setLists] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "lists"),
      where("members", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLists(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const createList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const listRef = await addDoc(collection(db, "lists"), {
      name: newListName,
      ownerId: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
    });

    setNewListName("");
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="text-center p-8 rounded-lg bg-gray-800">
          <h1 className="text-2xl text-white mb-4">Grocery List App</h1>
          <button
            onClick={signInWithGoogle}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-lg"
          >
            Sign in with Google to continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl text-white">Your Lists</h1>
          <button
            onClick={logout}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        <form onSubmit={createList} className="mb-8 flex gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New list name"
            className="flex-1 p-2 rounded-lg"
          />
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Create List
          </button>
        </form>

        <div className="grid gap-4">
          {lists.map((list) => (
            <Link
              to={`/list/${list.id}`}
              key={list.id}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <h2 className="text-xl text-white">{list.name}</h2>
              <p className="text-gray-400">Members: {list.members.length}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
