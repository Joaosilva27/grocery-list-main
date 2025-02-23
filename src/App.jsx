import axios from "axios";
import { useState, useEffect } from "react";
import MinusCartIcon from "./Icons/cart-minus.png";
import { auth, db } from "./firebase";
import { signInWithGoogle, logout } from "./Auth";
import PropTypes from "prop-types";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

function App() {
  const [imageSearch, setImageSearch] = useState("");
  const [groceryItems, setGroceryItems] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        const q = query(
          collection(db, "groceryItems"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setGroceryItems(items);
          },
          (error) => {
            console.error("Firestore error:", error);
            if (error.code === "failed-precondition") {
              alert(
                "Missing Firestore index. Create composite index for:\nCollection: groceryItems\nFields: userId (Asc), createdAt (Desc)"
              );
            }
          }
        );

        return () => unsubscribeSnapshot();
      } else {
        setGroceryItems([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const onHandleSearch = async (e) => {
    e.preventDefault();
    if (!imageSearch.trim() || !user) return;

    try {
      const { data } = await axios.post(
        "https://google.serper.dev/images",
        {
          q: `supermarket packaging clear photo of ${imageSearch} on a plain background`,
          num: 1,
        },
        {
          headers: {
            "X-API-KEY": "1f75c2b111ad0bd95a563938e5cb0d1cdb8add15",
            "Content-Type": "application/json",
          },
        }
      );

      if (!data.images?.length) throw new Error("No images found");

      await addDoc(collection(db, "groceryItems"), {
        itemName:
          imageSearch[0].toUpperCase() + imageSearch.slice(1).toLowerCase(),
        imageUrl: data.images[0].imageUrl,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      setImageSearch("");
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  const onHandleRemoveItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, "groceryItems", itemId));
    } catch (error) {
      console.error("Delete error:", error.message);
    }
  };

  const onHandleClearList = async () => {
    try {
      const deletePromises = groceryItems.map((item) =>
        deleteDoc(doc(db, "groceryItems", item.id))
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Clear error:", error.message);
    }
  };

  const GroceryCard = ({ item }) => (
    <div className="flex justify-between items-center w-full mb-3">
      <span className="ml-6 font-semibold text-white">{item.itemName}</span>
      <div className="flex items-center">
        <img
          className="w-20 h-20 object-cover rounded-xl"
          src={item.imageUrl}
          alt={item.itemName}
          onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
        />
        <img
          className="w-8 h-8 ml-2 cursor-pointer"
          src={MinusCartIcon}
          alt="Remove"
          onClick={() => onHandleRemoveItem(item.id)}
        />
      </div>
    </div>
  );

  GroceryCard.propTypes = {
    item: PropTypes.shape({
      id: PropTypes.string.isRequired,
      itemName: PropTypes.string.isRequired,
      imageUrl: PropTypes.string.isRequired,
    }).isRequired,
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="flex justify-center items-center m-10 flex-col lg:w-3/12">
        {user ? (
          <>
            <div className="w-full mb-6 flex justify-between items-center">
              <div className="text-white">
                Welcome, {user.displayName || "User"}!
              </div>
              <button
                onClick={logout}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl text-sm"
              >
                Logout
              </button>
            </div>

            <div className="flex mb-10 w-full">
              <form className="flex flex-1" onSubmit={onHandleSearch}>
                <input
                  placeholder="Add groceries..."
                  onChange={(e) => setImageSearch(e.target.value)}
                  value={imageSearch}
                  className="text-black bg-white rounded-full outline-none pl-6 pr-4 py-2 flex-1"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-green-500 ml-2 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl text-sm"
                >
                  Add
                </button>
              </form>
              <button
                className="bg-green-500 ml-2 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl text-sm"
                onClick={onHandleClearList}
                disabled={!groceryItems.length}
              >
                Clear List
              </button>
            </div>

            <div className="w-full">
              {groceryItems.length > 0 ? (
                groceryItems.map((item) => (
                  <GroceryCard item={item} key={item.id} />
                ))
              ) : (
                <p className="text-white text-center">
                  Your grocery list is empty
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center p-8 rounded-lg bg-gray-800">
            <h1 className="text-2xl text-white mb-4">Grocery List App</h1>
            <button
              onClick={signInWithGoogle}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-lg flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current"
              >
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
