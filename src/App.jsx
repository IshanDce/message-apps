import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import axios from 'axios';

// --- STEP 1: Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAZUuc2ai03Grqs1NhfsNucOJBz0aLdO0k",
  authDomain: "message-app-6d5b6.firebaseapp.com",
  projectId: "message-app-6d5b6",
  storageBucket: "message-app-6d5b6.appspot.com",
  messagingSenderId: "340686910459",
  appId: "1:340686910459:web:554db54fe1979c31da115e",
};

// --- STEP 2: Cloudinary Configuration ---
const CLOUDINARY_CLOUD_NAME = "dsbkiljpf";
const CLOUDINARY_UPLOAD_PRESET = "message-app-preset";


// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin ki details
const ADMIN_EMAIL = "sharmaishan74481@gmail.com";

// ######################################################################
// # HELPER FUNCTIONS
// ######################################################################

const uploadToCloudinary = async (file) => {
  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  try {
    const response = await axios.post(uploadUrl, formData);
    return { url: response.data.secure_url, resourceType: resourceType };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
};

// ######################################################################
// # UI & HELPER COMPONENTS
// ######################################################################

const Spinner = () => <div className="flex justify-center items-center h-full w-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
const FullScreenSpinner = () => <div className="h-screen w-screen flex items-center justify-center bg-gray-100"><Spinner /></div>;

const Notification = ({ message, type = 'success' }) => {
    if (!message) return null;
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    return <div className={`fixed top-5 right-5 px-4 py-2 text-white rounded-md shadow-lg ${bgColor} z-[100] animate-fade-in-out`}>{message}</div>;
};

const FileViewer = ({ file, onClose }) => {
    if (!file || !file.url) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100]" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300">&times;</button>
            <div className="relative p-4" onClick={(e) => e.stopPropagation()}> 
                {file.type === 'image' ? (
                    <img src={file.url} alt="Enlarged view" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl" />
                ) : (
                    <video src={file.url} controls autoPlay className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl" />
                )}
            </div>
        </div>
    );
};

// --- Login Page ---
const LoginPage = ({ setView, setNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setNotification('Logged in successfully!');
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Incorrect email or password. Please try again or sign up.');
      } else {
        setError('An unknown error occurred. Please try again.');
        console.error("Login Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4"><div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl"><h2 className="text-3xl font-bold text-center text-white">Welcome Back!</h2><form onSubmit={handleLogin} className="space-y-6"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" required /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" required />{error && <p className="text-red-300 text-sm text-center">{error}</p>}<button type="submit" disabled={loading} className="w-full px-4 py-3 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105">{loading ? 'Logging in...' : 'Login'}</button></form><p className="text-sm text-center text-gray-200">Don't have an account? <button onClick={() => setView('signup')} className="font-bold text-white hover:underline">Sign up</button></p></div></div>;
};

// --- Signup Page (Updated with Nickname) ---
const SignupPage = ({ setView, setNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) { setError("Nickname is required."); return; }
    setError(''); setLoading(true);
    try {
      let photoURL = "https://placehold.co/100x100/EBF8FF/3182CE?text=User";
      if (profilePic) { photoURL = (await uploadToCloudinary(profilePic))?.url || photoURL; }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          nickname: nickname,
          photoURL: photoURL
      });
      setNotification('Account created successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-500 p-4"><div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl"><h2 className="text-3xl font-bold text-center text-white">Create Your Account</h2><form onSubmit={handleSignup} className="space-y-4"><input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname" className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" required /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" required /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 characters)" className="w-full px-4 py-3 bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" required /><div><label className="text-sm font-medium text-gray-200">Profile Picture (Optional)</label><input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} className="w-full text-sm text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 cursor-pointer"/></div>{error && <p className="text-red-300 text-sm text-center">{error}</p>}<button type="submit" disabled={loading} className="w-full px-4 py-3 text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all duration-300 transform hover:scale-105">{loading ? 'Creating Account...' : 'Sign Up'}</button></form><p className="text-sm text-center text-gray-200">Already have an account? <button onClick={() => setView('login')} className="font-bold text-white hover:underline">Login</button></p></div></div>;
};

// ######################################################################
// # USER APPLICATION COMPONENTS (WHATSAPP UI)
// ######################################################################

const UserApp = ({ user, userData, setNotification, handleLogout }) => {
    const [spaces, setSpaces] = useState([]);
    const [activeSpace, setActiveSpace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewingFile, setViewingFile] = useState(null);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "spaces"), where("members", "array-contains", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setSpaces(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);

    return (
        <>
            <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />
            <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
                <div className={`transition-transform duration-300 ease-in-out w-full md:w-1/3 lg:w-1/4 flex-shrink-0 ${activeSpace ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                    <Sidebar 
                        user={user} 
                        userData={userData} 
                        spaces={spaces} 
                        loading={loading} 
                        activeSpace={activeSpace} 
                        setActiveSpace={setActiveSpace} 
                        setNotification={setNotification} 
                        handleLogout={handleLogout}
                        setViewingFile={setViewingFile}
                    />
                </div>
                <div className="flex-1 flex flex-col">
                    <ChatWindow 
                        user={user} 
                        userData={userData} 
                        activeSpace={activeSpace} 
                        setActiveSpace={setActiveSpace}
                        setNotification={setNotification}
                    />
                </div>
            </div>
        </>
    );
};

const Sidebar = ({ user, userData, spaces, loading, activeSpace, setActiveSpace, setNotification, handleLogout, setViewingFile }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInvites, setShowInvites] = useState(false);
    const [invitesCount, setInvitesCount] = useState(0);

    useEffect(() => {
        const q = query(collection(db, "invitations"), where("inviteeId", "==", user.uid), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setInvitesCount(snapshot.size);
        });
        return () => unsubscribe();
    }, [user.uid]);

    return (<><div className="w-full h-full bg-gray-50 border-r border-gray-200 flex flex-col"><header className="flex items-center justify-between p-3 border-b border-gray-200 bg-white flex-shrink-0"><img src={userData.photoURL} alt="Profile" className="w-10 h-10 rounded-full cursor-pointer transition-transform hover:scale-110" onClick={() => setViewingFile({ url: userData.photoURL, type: 'image' })} /><span className="font-semibold text-gray-800 flex-1 mx-3 truncate">{userData.nickname}</span><div className="relative"><button onClick={() => setShowInvites(true)} className="p-2 rounded-full hover:bg-gray-200 relative transition-colors" title="View Invitations"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>{invitesCount > 0 && <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">{invitesCount}</span>}</button></div><button onClick={() => setShowCreateModal(true)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Create New Space"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg></button><button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-200 text-red-600 transition-colors" title="Logout"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button></header><div className="flex-1 overflow-y-auto">{loading ? <div className="p-4 text-center text-gray-500">Loading Spaces...</div> : spaces.map(space => (<div key={space.id} onClick={() => setActiveSpace(space)} className={`flex items-center p-3 cursor-pointer transition-all duration-200 border-l-4 ${activeSpace?.id === space.id ? 'bg-indigo-100 border-indigo-500' : 'border-transparent hover:bg-gray-100'}`}><img src={space.photoURL || 'https://placehold.co/100x100/A0AEC0/FFFFFF?text=Sp'} alt={space.spaceName} className="w-12 h-12 rounded-full bg-gray-300 mr-3"/><div><p className="font-semibold text-gray-900">{space.spaceName}</p><p className="text-sm text-gray-500">Click to open chat</p></div></div>))}</div></div>{showCreateModal && <CreateSpaceModal user={user} onClose={() => setShowCreateModal(false)} setNotification={setNotification}/>}{showInvites && <InvitationsPanel user={user} onClose={() => setShowInvites(false)} setNotification={setNotification}/>}</>);
};

const CreateSpaceModal = ({ user, onClose, setNotification }) => {
    const [spaceName, setSpaceName] = useState('');
    const [spacePic, setSpacePic] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const handleRequest = async (e) => {
        e.preventDefault();
        if(!spaceName.trim()) return;
        setLoading(true);
        try {
            let photoURL = "https://placehold.co/100x100/A0AEC0/FFFFFF?text=Sp";
            if (spacePic) { photoURL = (await uploadToCloudinary(spacePic))?.url || photoURL; }
            await addDoc(collection(db, "space_requests"), { spaceName, photoURL, requestedBy: user.email, userId: user.uid, status: "pending", createdAt: Timestamp.now() });
            setNotification('Space request sent to admin!');
            onClose();
        } catch (error) {
            setNotification('Failed to send request.', 'error');
        } finally { setLoading(false); }
    };

    return <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4"><h2 className="text-xl font-bold mb-4">Create a New Space</h2><form onSubmit={handleRequest}><input type="text" value={spaceName} onChange={e => setSpaceName(e.target.value)} placeholder="Enter space name" className="w-full px-4 py-2 border rounded-md mb-4" required/><div><label className="text-sm font-medium text-gray-700">Space Profile Picture (Optional)</label><input type="file" accept="image/*" onChange={(e) => setSpacePic(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mt-1 mb-4"/></div><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button><button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">{loading ? 'Sending...' : 'Send Request'}</button></div></form></div></div>;
};

const InvitationsPanel = ({ user, onClose, setNotification }) => {
    const [invitations, setInvitations] = useState([]);
    useEffect(() => {
        const q = query(collection(db, "invitations"), where("inviteeId", "==", user.uid), where("status", "==", "pending"));
        const unsub = onSnapshot(q, snap => setInvitations(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return unsub;
    }, [user.uid]);

    const handleAccept = async (invite) => {
        try {
            await updateDoc(doc(db, "spaces", invite.spaceId), { members: arrayUnion(user.uid) });
            await updateDoc(doc(db, "invitations", invite.id), { status: "accepted" });
            setNotification(`You have joined ${invite.spaceName}!`);
        } catch (e) { setNotification('Failed to join space.', 'error'); }
    };
    const handleDecline = async (inviteId) => {
        try { await updateDoc(doc(db, "invitations", inviteId), { status: "declined" }); } 
        catch (e) { setNotification('Failed to decline invite.', 'error');}
    };

    return <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4"><h2 className="text-xl font-bold mb-4">Your Invitations</h2><div className="space-y-3 max-h-80 overflow-y-auto">{invitations.length > 0 ? invitations.map(inv => (<div key={inv.id} className="flex items-center justify-between p-2 bg-gray-50 rounded"><p><span className="font-bold">{inv.inviterNickname}</span> invited you to <span className="font-bold">{inv.spaceName}</span></p><div className="flex gap-2"><button onClick={() => handleAccept(inv)} className="px-3 py-1 text-xs bg-green-500 text-white rounded">Accept</button><button onClick={() => handleDecline(inv.id)} className="px-3 py-1 text-xs bg-red-500 text-white rounded">Decline</button></div></div>)) : <p>No pending invitations.</p>}</div><div className="flex justify-end mt-4"><button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Close</button></div></div></div>;
}

const ChatWindow = ({ user, userData, activeSpace, setActiveSpace, setNotification }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [mediaFile, setMediaFile] = useState(null);
    const [loadingMsg, setLoadingMsg] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [viewingFile, setViewingFile] = useState(null);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!activeSpace) { setMessages([]); return; }
        const q = query(collection(db, "spaces", activeSpace.id, "messages"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => setMessages(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
        return () => unsubscribe();
    }, [activeSpace]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    if (!activeSpace) return <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-200 p-4 text-center chat-bg"><div className="text-center"><svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg><h2 className="text-2xl text-gray-600 mt-4">Welcome, {userData.nickname}!</h2><p className="text-gray-500 mt-2">Select a space from the left to start a conversation.</p></div></div>;

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !mediaFile) return;
        setLoadingMsg(true);
        try {
            let fileData = null;
            if (mediaFile) { fileData = await uploadToCloudinary(mediaFile); }
            await addDoc(collection(db, "spaces", activeSpace.id, "messages"), { 
                text: newMessage, 
                fileUrl: fileData?.url || null,
                fileType: fileData?.resourceType || null,
                senderId: user.uid, 
                senderNickname: userData.nickname, 
                senderPhotoURL: userData.photoURL, 
                createdAt: Timestamp.now() 
            });
            setNewMessage(""); setMediaFile(null); e.target.reset();
        } catch (error) { setNotification("Failed to send message", "error"); } 
        finally { setLoadingMsg(false); }
    };

    const isOwner = activeSpace.ownerId === user.uid;

    return (<><FileViewer file={viewingFile} onClose={() => setViewingFile(null)} /><div className="flex-1 flex flex-col h-full"><header className="flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0"><div className="flex items-center gap-3"><button onClick={() => setActiveSpace(null)} className="p-2 rounded-full hover:bg-gray-200 md:hidden"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button><div className="cursor-pointer" onClick={() => setShowMembersModal(true)}><img src={activeSpace.photoURL} className="w-10 h-10 rounded-full" /></div><div onClick={() => setShowMembersModal(true)} className="cursor-pointer"><h2 className="text-lg font-semibold text-gray-800">{activeSpace.spaceName}</h2><p className="text-xs text-gray-500">{activeSpace.members.length} members</p></div></div>{isOwner && <button onClick={() => setShowInviteModal(true)} className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">Invite User</button>}</header><div className="flex-1 overflow-y-auto p-4 chat-bg">{messages.map(msg => (<div key={msg.id} className={`flex items-end gap-2 my-2 max-w-lg ${msg.senderId === user.uid ? 'ml-auto' : 'mr-auto'}`}><img src={msg.senderPhotoURL} alt="avatar" className={`w-8 h-8 rounded-full cursor-pointer ${msg.senderId === user.uid ? 'order-2' : 'order-1'}`} onClick={() => setViewingFile({url: msg.senderPhotoURL, type: 'image'})} /><div className={`relative px-4 py-2 rounded-xl shadow ${msg.senderId === user.uid ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}><p className="font-bold text-sm mb-1">{msg.senderNickname}</p>{msg.text && <p className="text-sm">{msg.text}</p>}{msg.fileUrl && msg.fileType === 'image' && <img src={msg.fileUrl} alt="sent content" className="mt-2 rounded-lg max-h-60 cursor-pointer" onClick={() => setViewingFile({url: msg.fileUrl, type: 'image'})} />}{msg.fileUrl && msg.fileType === 'video' && <video src={msg.fileUrl} controls className="mt-2 rounded-lg max-h-60 cursor-pointer" onClick={() => setViewingFile({url: msg.fileUrl, type: 'video'})} />}<p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.createdAt?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div>))} <div ref={messagesEndRef} /></div><div className="p-4 bg-white border-t border-gray-200"><form onSubmit={handleSendMessage} className="flex items-center gap-2"><label className="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg><input type="file" accept="image/*,video/*" className="hidden" onChange={e => setMediaFile(e.target.files[0])} /></label><input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400" /><button type="submit" disabled={loadingMsg} className="p-3 text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all transform hover:scale-110">{loadingMsg ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}</button></form>{mediaFile && <p className="text-xs mt-1 text-gray-500">Selected: {mediaFile.name}</p>}</div></div>{showInviteModal && <InviteUserModal user={user} userData={userData} activeSpace={activeSpace} onClose={() => setShowInviteModal(false)} setNotification={setNotification} />}{showMembersModal && <SpaceMembersModal space={activeSpace} onClose={() => setShowMembersModal(false)} />}</>);
};

const SpaceMembersModal = ({ space, onClose }) => {
    const [membersDetails, setMembersDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemberDetails = async () => {
            setLoading(true);
            const memberPromises = space.members.map(memberId => getDoc(doc(db, "users", memberId)));
            const memberDocs = await Promise.all(memberPromises);
            const membersData = memberDocs.map(doc => doc.data()).filter(Boolean);
            setMembersDetails(membersData);
            setLoading(false);
        };
        fetchMemberDetails();
    }, [space.members]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
                <h2 className="text-xl font-bold mb-4">Members of {space.spaceName}</h2>
                <div className="max-h-80 overflow-y-auto">
                    {loading ? <Spinner /> : membersDetails.map(member => (
                        <div key={member.uid} className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                            <img src={member.photoURL} className="w-10 h-10 rounded-full mr-3" />
                            <div>
                                <p className="font-semibold">{member.nickname}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
};

const InviteUserModal = ({ user, userData, activeSpace, onClose, setNotification }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const q = query(collection(db, "users"), where("uid", "!=", user.uid));
            const querySnapshot = await getDocs(q);
            const usersList = querySnapshot.docs.map(doc => doc.data());
            setAllUsers(usersList.filter(u => !activeSpace.members.includes(u.uid)));
            setLoading(false);
        };
        fetchUsers();
    }, [user.uid, activeSpace.members]);

    const handleInvite = async (userToInvite) => {
        try {
            await addDoc(collection(db, "invitations"), {
                inviterId: user.uid,
                inviterNickname: userData.nickname,
                inviteeId: userToInvite.uid,
                spaceId: activeSpace.id,
                spaceName: activeSpace.spaceName,
                spacePhotoURL: activeSpace.photoURL,
                status: "pending",
                createdAt: Timestamp.now()
            });
            setNotification(`Invitation sent to ${userToInvite.nickname}!`);
            setAllUsers(allUsers.filter(u => u.uid !== userToInvite.uid));
        } catch (error) { setNotification("Failed to send invitation.", "error"); }
    };

    return (<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4"><h2 className="text-xl font-bold mb-4">Invite Users to {activeSpace.spaceName}</h2><div className="max-h-80 overflow-y-auto">{loading ? <Spinner /> : allUsers.map(user => (<div key={user.uid} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md"><div className="flex items-center gap-3"><img src={user.photoURL} className="w-8 h-8 rounded-full" /><span>{user.nickname}</span></div><button onClick={() => handleInvite(user)} className="px-3 py-1 bg-green-500 text-white text-sm rounded-md">Invite</button></div>))}</div><div className="flex justify-end mt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Close</button></div></div></div>);
};

// ######################################################################
// # ADMIN DASHBOARD COMPONENTS
// ######################################################################

const AdminDashboard = ({ setNotification, handleLogout }) => {
    const [view, setView] = useState('requests');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const renderAdminContent = () => {
        switch(view) {
            case 'users': return <AdminUsers setNotification={setNotification} />;
            case 'spaces': return <AdminSpaces setNotification={setNotification} />;
            case 'requests': default: return <AdminRequests setNotification={setNotification} />;
        }
    };
    return (
        <div className="flex h-screen">
            <div className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white flex flex-col transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-30`}>
                <div className="p-4 text-xl font-bold border-b border-gray-700 flex justify-between items-center">
                    <span>Admin Panel</span>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-full hover:bg-gray-700">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <nav className="flex-1 p-2 space-y-2">
                    <a onClick={() => { setView('requests'); setSidebarOpen(false); }} className={`block p-2 rounded-md cursor-pointer ${view === 'requests' ? 'bg-gray-900' : 'hover:bg-gray-700'}`}>Pending Requests</a>
                    <a onClick={() => { setView('users'); setSidebarOpen(false); }} className={`block p-2 rounded-md cursor-pointer ${view === 'users' ? 'bg-gray-900' : 'hover:bg-gray-700'}`}>Manage Users</a>
                    <a onClick={() => { setView('spaces'); setSidebarOpen(false); }} className={`block p-2 rounded-md cursor-pointer ${view === 'spaces' ? 'bg-gray-900' : 'hover:bg-gray-700'}`}>Manage Spaces</a>
                </nav>
                <div className="p-2 border-t border-gray-700">
                    <button onClick={handleLogout} className="w-full p-2 text-left rounded-md hover:bg-red-500">Logout</button>
                </div>
            </div>
            <div className="flex-1 p-6 bg-gray-100 overflow-y-auto md:ml-64">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden mb-4 p-2 bg-gray-800 text-white rounded-md">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                {renderAdminContent()}
            </div>
        </div>
    );
};


const AdminRequests = ({ setNotification }) => {
    const [requests, setRequests] = useState([]);
    useEffect(() => { const q = query(collection(db, "space_requests"), where("status", "==", "pending")); const unsub = onSnapshot(q, (snap) => setRequests(snap.docs.map(d => ({id: d.id, ...d.data()})))); return unsub; }, []);
    
    const handleApprove = async (req) => {
        try {
            await addDoc(collection(db, "spaces"), { spaceName: req.spaceName, photoURL: req.photoURL, ownerId: req.userId, ownerEmail: req.requestedBy, createdAt: Timestamp.now(), status: "approved", members: [req.userId] });
            await updateDoc(doc(db, "space_requests", req.id), { status: "approved" });
            setNotification('Request Approved!');
        } catch (e) { setNotification('Failed to approve.', 'error'); }
    };
    return <div><h2 className="text-2xl font-bold mb-4">Pending Space Requests</h2><div className="space-y-4">{requests.length > 0 ? requests.map(req => <div key={req.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-lg shadow"><div className="flex items-center gap-3 mb-2 sm:mb-0"><img src={req.photoURL} className="w-10 h-10 rounded-full" /><p>{req.spaceName} by {req.requestedBy}</p></div><div className="flex gap-2"><button onClick={() => handleApprove(req)} className="px-3 py-1 bg-green-500 text-white rounded">Approve</button></div></div>) : <p>No pending requests.</p>}</div></div>
};

const AdminUsers = ({ setNotification }) => {
    const [users, setUsers] = useState([]);
    useEffect(() => { const unsub = onSnapshot(collection(db, "users"), (snap) => setUsers(snap.docs.map(d => d.data()))); return unsub; }, []);

    const handleDelete = async (uid) => {
        if(window.confirm("This will delete the user's data from the database. Are you sure?")){
            try { await deleteDoc(doc(db, "users", uid)); setNotification('User data deleted.'); } 
            catch (e) { setNotification('Failed to delete user data.', 'error'); }
        }
    };
    return <div><h2 className="text-2xl font-bold mb-4">Manage Users</h2><div className="space-y-2 bg-white p-4 rounded-lg shadow">{users.map(u => <div key={u.uid} className="flex flex-col sm:flex-row justify-between items-center p-2 border-b"><p className="mb-2 sm:mb-0">{u.nickname} ({u.email})</p><button onClick={() => handleDelete(u.uid)} className="px-3 py-1 bg-red-500 text-white rounded">Delete Data</button></div>)}</div></div>
};

const AdminSpaces = ({ setNotification }) => {
    const [spaces, setSpaces] = useState([]);
    const [viewingSpace, setViewingSpace] = useState(null);
    useEffect(() => { const unsub = onSnapshot(collection(db, "spaces"), (snap) => setSpaces(snap.docs.map(d => ({id: d.id, ...d.data()})))); return unsub; }, []);
    
    if (viewingSpace) {
        return <AdminChatViewer space={viewingSpace} onBack={() => setViewingSpace(null)} />
    }

    const handleDelete = async (id) => {
        if(window.confirm("Are you sure? This will delete the space and all its messages.")){
            try { await deleteDoc(doc(db, "spaces", id)); setNotification('Space deleted.'); }
            catch (e) { setNotification('Failed to delete space.', 'error'); }
        }
    };
    return <div><h2 className="text-2xl font-bold mb-4">Manage Spaces</h2><div className="space-y-2 bg-white p-4 rounded-lg shadow">{spaces.map(s => <div key={s.id} className="flex flex-col sm:flex-row justify-between items-center p-2 border-b"><p className="mb-2 sm:mb-0">{s.spaceName} by {s.ownerEmail}</p><div className="flex gap-2"><button onClick={() => setViewingSpace(s)} className="px-3 py-1 bg-blue-500 text-white rounded">View Chat</button><button onClick={() => handleDelete(s.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button></div></div>)}</div></div>
};

const AdminChatViewer = ({ space, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [viewingFile, setViewingFile] = useState(null);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const messagesEndRef = useRef(null);
    
    useEffect(() => {
        const q = query(collection(db, "spaces", space.id, "messages"), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return unsub;
    }, [space.id]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    return (
        <>
            <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />
            <div>
                <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">← Back to Spaces</button>
                <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setShowMembersModal(true)}>
                    <img src={space.photoURL} className="w-12 h-12 rounded-full" />
                    <div>
                        <h2 className="text-2xl font-bold">Viewing Chat: {space.spaceName}</h2>
                        <p className="text-sm text-gray-600">{space.members.length} members</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow flex flex-col h-[65vh]">
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex items-start gap-3 my-2 ${msg.senderId === space.ownerId ? 'justify-end' : ''}`}>
                                <img src={msg.senderPhotoURL} alt="avatar" className={`w-8 h-8 rounded-full cursor-pointer ${msg.senderId === space.ownerId ? 'order-2' : 'order-1'}`} onClick={() => setViewingFile({url: msg.senderPhotoURL, type: 'image'})} />
                                <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${msg.senderId === space.ownerId ? 'bg-blue-500 text-white order-1' : 'bg-white order-2'}`}>
                                    <p className="font-bold text-sm mb-1">{msg.senderNickname}</p>
                                    {msg.text && <p>{msg.text}</p>}
                                    {msg.fileUrl && msg.fileType === 'image' && <img src={msg.fileUrl} alt="sent content" className="mt-2 rounded-lg max-h-60 cursor-pointer" onClick={() => setViewingFile({url: msg.fileUrl, type: 'image'})} />}
                                    {msg.fileUrl && msg.fileType === 'video' && <video src={msg.fileUrl} controls className="mt-2 rounded-lg max-h-60 cursor-pointer" onClick={() => setViewingFile({url: msg.fileUrl, type: 'video'})} />}
                                    <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.createdAt?.toDate()).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
            {showMembersModal && <SpaceMembersModal space={space} onClose={() => setShowMembersModal(false)} />}
        </>
    );
}


// ######################################################################
// # MAIN APP COMPONENT
// ######################################################################

function App() {
  const [view, setView] = useState('loading'); 
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => setNotification(''), 3000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); 

        if (currentUser.email === ADMIN_EMAIL) {
          setUserData({ nickname: "Admin", email: ADMIN_EMAIL, photoURL: "https://placehold.co/100x100/2D3748/FFFFFF?text=A" }); 
          setView('admin_dashboard');
        } else {
          setView('loading_user');
          const userDocRef = doc(db, "users", currentUser.uid);
          const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
              if(docSnap.exists()){ 
                setUserData(docSnap.data()); 
                setView('user_app');
              }
          });
          return () => unsubDoc();
        }
      } else {
        setUser(null); 
        setUserData(null); 
        setView('login');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setNotification('Logged out successfully!');
  };

  const renderContent = () => {
    if (view === 'loading' || (user && user.email !== ADMIN_EMAIL && !userData)) { 
      return <FullScreenSpinner />; 
    }

    switch (view) {
      case 'signup': return <SignupPage setView={setView} setNotification={setNotification} />;
      case 'user_app': return <UserApp user={user} userData={userData} setNotification={setNotification} handleLogout={handleLogout} />;
      case 'admin_dashboard': return <AdminDashboard setNotification={setNotification} handleLogout={handleLogout} />;
      case 'login': default: return <LoginPage setView={setView} setNotification={setNotification} />;
    }
  };

  const customStyles = `
    .chat-bg {
      background-color: #e5ddd5;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <Notification message={notification} />
      {renderContent()}
    </>
  );
}

export default App;