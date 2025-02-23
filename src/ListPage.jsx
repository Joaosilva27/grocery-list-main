import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MinusCartIcon from "./Icons/cart-minus.png";
import { auth, db } from "./firebase";
import PropTypes from "prop-types";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

function ListPage() {
  const { listName } = useParams();
  const navigate = useNavigate();
  const [imageSearch, setImageSearch] = useState("");
  const [groceryItems, setGroceryItems] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) navigate("/");
      setUser(user);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user || !listName) return;

    const itemsRef = collection(db, "lists", listName, "items");
    const q = query(itemsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGroceryItems(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, [listName, user]);

  const onHandleSearch = async (e) => {
    e.preventDefault();
    if (!imageSearch.trim()) return;

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

      if (data.images?.length) {
        await addDoc(collection(db, "lists", listName, "items"), {
          itemName:
            imageSearch[0].toUpperCase() + imageSearch.slice(1).toLowerCase(),
          imageUrl: data.images[0].imageUrl,
          createdAt: serverTimestamp(),
          addedBy: user.uid,
        });
        setImageSearch("");
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  const onHandleRemoveItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, "lists", listName, "items", itemId));
    } catch (error) {
      console.error("Delete error:", error.message);
    }
  };

  const GroceryCard = ({ item }) => (
    <div className="flex justify-between items-center w-full mb-3">
      <span className="ml-2 md:ml-6 font-semibold text-white text-sm md:text-base truncate">
        {item.itemName}
      </span>
      <div className="flex items-center gap-2">
        <img
          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl"
          src={item.imageUrl}
          alt={item.itemName}
          onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
        />
        <img
          className="w-6 h-6 md:w-8 md:h-8 cursor-pointer"
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
    <div className="flex justify-center min-h-screen bg-gray-900 px-4">
      <div className="w-full md:w-10/12 lg:w-8/12 xl:w-6/12 max-w-2xl py-6">
        <div className="w-full mb-4 md:mb-6 flex justify-between items-center gap-2">
          <div className="text-white text-sm md:text-base truncate">
            You are now adding items to {listName.replace(/-/g, " ")} list.
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 md:py-2 md:px-4 rounded-xl text-xs md:text-sm whitespace-nowrap"
          >
            Back to Home
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-2 mb-6 md:mb-10 w-full">
          <form className="flex flex-1 gap-2" onSubmit={onHandleSearch}>
            <input
              placeholder="Add groceries..."
              onChange={(e) => setImageSearch(e.target.value)}
              value={imageSearch}
              className="text-black bg-white rounded-full outline-none pl-4 md:pl-6 pr-2 py-3 flex-1 text-sm md:text-base"
              autoFocus
            />
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl text-sm md:text-base whitespace-nowrap"
            >
              Add
            </button>
          </form>
        </div>

        <div className="w-full">
          {groceryItems.length > 0 ? (
            groceryItems.map((item) => (
              <GroceryCard item={item} key={item.id} />
            ))
          ) : (
            <p className="text-white text-center text-sm md:text-base">
              {listName.replace(/-/g, " ")} is empty
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListPage;
