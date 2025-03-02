import { useState, useEffect } from 'react';
import './App.css';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, addDoc, orderBy, query, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FaPaperPlane, FaSignOutAlt } from 'react-icons/fa';

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp"));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      })));
    });

    return () => unsubscribeFirestore();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    try {
      await addDoc(collection(db, "messages"), {
        uid: user.uid,
        photoURL: user.photoURL,
        displayName: user.displayName,
        text: newMessage,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  
  return (
    <div className="app-container">
      {user ? (
        <div>
          <div className='log'>
            <div className='login'>Logged in as {user.displayName}</div>
            <button className="logout-button" onClick={handleLogout}><FaSignOutAlt /></button>
          </div>
          <div className="chat-container">
            <div className="messages-container">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.data.uid === user.uid ? 'message-right' : 'message-left'}`}>
                  <img className="message-avatar" src={msg.data.photoURL} alt="User Avatar" />
                  <div className="message-text">{msg.data.text}</div>
                </div>
              ))}
            </div>

            <div className="input-container">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="message-input"
                placeholder="Type a message..."
              />
              <button className="send-button" onClick={sendMessage}>
                <FaPaperPlane /> 
              </button>
              
            </div>
          </div>
        </div>
      ) : (
        <div className="auth-container">
          <h1 className="welcome-text">Welcome to ChatterBox</h1>
          <button className="login-button" onClick={handleGoogleLogin}>Login with Google</button>
        </div>
      )}
    </div>
  );
}

export default App;