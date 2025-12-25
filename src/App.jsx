import React, { useState, useEffect } from 'react';
import { auth, provider, db } from './firebase'; 
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, 
  doc, updateDoc, arrayUnion, increment, setDoc, getDoc 
} from 'firebase/firestore';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;800&display=swap');

  :root {
    --primary: #c0392b;
    --primary-grad: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    
    /* Light Mode Variables */
    --bg-color: #f0f2f5;
    --card-bg: #ffffff;
    --text-main: #2c3e50;
    --text-sub: #7f8c8d;
    --input-bg: #f8f9fa;
    --border-color: rgba(0,0,0,0.05);
    --shadow-soft: 0 10px 30px -5px rgba(0, 0, 0, 0.08);
    --nav-bg: rgba(255, 255, 255, 0.85);
  }

  /* Dark Mode Variables */
  [data-theme='dark'] {
    --bg-color: #121212;
    --card-bg: #1e1e1e;
    --text-main: #ecf0f1;
    --text-sub: #bdc3c7;
    --input-bg: #2c2c2c;
    --border-color: rgba(255,255,255,0.1);
    --shadow-soft: 0 10px 30px -5px rgba(0, 0, 0, 0.5);
    --nav-bg: rgba(30, 30, 30, 0.85);
  }

  body {
    background-color: var(--bg-color);
    font-family: 'Outfit', sans-serif;
    color: var(--text-main);
    margin: 0;
    transition: background-color 0.3s, color 0.3s;
    background-image: radial-gradient(circle at 10% 20%, rgba(216, 68, 68, 0.05) 0%, transparent 20%),
                      radial-gradient(circle at 90% 80%, rgba(45, 136, 255, 0.05) 0%, transparent 20%);
    background-attachment: fixed;
  }

  /* Animations */
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .fade-in { animation: fadeIn 0.4s ease forwards; }
  .card-animate { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }

  /* Modern Components */
  .modern-card {
    background: var(--card-bg);
    border-radius: 24px;
    box-shadow: var(--shadow-soft);
    border: 1px solid var(--border-color);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    overflow: hidden;
  }
  .modern-card:hover { transform: translateY(-5px); }
  .tap-active:active { transform: scale(0.96); }

  /* Gradient Text */
  .grad-text {
    background: var(--primary-grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
  }

  /* Status Badges */
  .badge { padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; display: inline-flex; align-items: center; gap: 5px; }
  .status-Chill, .status-Empty { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
  .status-Crowded, .status-Busy { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
  .status-Event, .status-Full, .status-Event-here { background: #fadbd8; color: #922b21; border: 1px solid #f5b7b1; }
  .status-Event-here { background: #d6eaf8; color: #21618c; border: 1px solid #aed6f1; }

  /* Custom Inputs */
  .input-modern {
    background: var(--input-bg);
    border: 2px solid transparent;
    border-radius: 16px;
    padding: 14px;
    font-family: 'Outfit', sans-serif;
    transition: 0.2s;
    outline: none;
    font-size: 15px;
    color: var(--text-main);
  }
  .input-modern:focus {
    border-color: #e74c3c;
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.1);
  }

  /* Navigation Pills */
  .nav-pill {
    padding: 12px 24px;
    border-radius: 50px;
    border: none;
    background: var(--card-bg);
    color: var(--text-sub);
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-soft);
    transition: 0.3s;
    white-space: nowrap;
    font-size: 14px;
  }
  .nav-pill.active {
    background: var(--primary-grad);
    color: white;
    transform: scale(1.05);
  }

  /* Header Buttons */
  .icon-btn {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    width: 40px; height: 40px;
    display: flex; align-items: center; justifyContent: center;
    cursor: pointer;
    color: var(--text-main);
    box-shadow: var(--shadow-soft);
  }
`;

function App() {

  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('lost');
  const [urgency, setUrgency] = useState('Medium');
  const [filter, setFilter] = useState('lost'); 
  const [sortBy, setSortBy] = useState('newest'); 
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [viewHelpersModal, setViewHelpersModal] = useState(null);
  const [greeting, setGreeting] = useState('Namaste');
  

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const [resources, setResources] = useState([]); 
  const [resTitle, setResTitle] = useState('');
  const [resLink, setResLink] = useState('');
  
  const [canteenStatus, setCanteenStatus] = useState({ status: 'Unknown', lastUpdated: null });
  const [hotspots, setHotspots] = useState([]); 

  const campusSpots = ['Maggi House', 'Chess Garden', 'Engineering Canteen', 'Amphitheatre', 'Main Auditorium', 'Library', 'Dalchini Cafe', 'Mess'];

  const sportsList = [
    'Swimming', 'Table Tennis', 'Chess', 'Foosball', 'Pickleball', 
    'Badminton', 'Carrom', 'Football (Ground)', 'Football (Turf)', 
    'Athletics', 'Taekwondo', 'Cricket', 'Squash', 'Basketball', 
    'Skating', 'Judo', 'Volleyball', 'Wall Climbing', 'Gym'
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubR = onSnapshot(q, (s) => setReports(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const lq = query(collection(db, "leaderboard"), orderBy("points", "desc"));
    const unsubL = onSnapshot(lq, (s) => setLeaderboard(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const resQ = query(collection(db, "resources"), orderBy("timestamp", "desc"));
    const unsubRes = onSnapshot(resQ, (s) => setResources(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCanteen = onSnapshot(doc(db, "canteen_status", "main"), (doc) => { if (doc.exists()) setCanteenStatus(doc.data()); });
    const unsubHotspots = onSnapshot(collection(db, "hotspots"), (s) => {
        const data = {};
        s.docs.forEach(d => data[d.id] = d.data());
        setHotspots(data);
    });

    return () => { unsubAuth(); unsubR(); unsubL(); unsubRes(); unsubCanteen(); unsubHotspots(); };
  }, []);

  const login = async () => { try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); } };

  const handleSubmit = async () => {
    const lastPost = localStorage.getItem('lastPostTime');
    const now = Date.now();
    if (lastPost && now - lastPost < 3600000) {
        const remaining = Math.ceil((3600000 - (now - lastPost)) / 60000);
        return alert(`🛑 Spam Guard: Wait ${remaining} mins.`);
    }
    if (!description) return alert("Details required.");
    await addDoc(collection(db, "reports"), {
      userId: user.uid, userName: user.displayName, userPhoto: user.photoURL,
      category, description, urgency, status: "Pending", helpers: [], isEdited: false, timestamp: serverTimestamp(),
    });
    localStorage.setItem('lastPostTime', now);
    setDescription('');
  };

  const handleEditSave = async (id) => { await updateDoc(doc(db, "reports", id), { description: editText, isEdited: true }); setEditId(null); };

  const handleJoinSearch = async (report) => {
    if (report.helpers?.some(h => h.uid === user.uid)) return;
    await updateDoc(doc(db, "reports", report.id), {
      helpers: arrayUnion({ uid: user.uid, name: user.displayName, photo: user.photoURL })
    });
  };

  const handleResolve = async (reportId, helperUid) => {
    if (!helperUid) return;
    await updateDoc(doc(db, "reports", reportId), { status: "Resolved", resolverId: helperUid });
    const helperRef = doc(db, "leaderboard", helperUid);
    const helperSnap = await getDoc(helperRef);
    if (helperSnap.exists()) { await updateDoc(helperRef, { points: increment(10) }); } 
    else {
      const helperData = reports.find(r => r.id === reportId)?.helpers?.find(h => h.uid === helperUid);
      if (helperData) await setDoc(helperRef, { name: helperData.name, points: 10, photo: helperData.photo });
    }
    alert("Points awarded!");
  };

  
  const handleMarkResolved = async (reportId) => {
    if(window.confirm('Are you sure you want to mark this as resolved?')) {
        await updateDoc(doc(db, "reports", reportId), { status: "Resolved" });
    }
  };

  const handlePostResource = async () => {
    if (!resTitle || !resLink) return alert("Please add a title and link/desc.");
    await addDoc(collection(db, "resources"), {
        userId: user.uid, userName: user.displayName, userPhoto: user.photoURL,
        title: resTitle, link: resLink, upvotes: [], timestamp: serverTimestamp()
    });
    setResTitle(''); setResLink('');
  };

  const handleUpvote = async (resource) => {
      if (resource.upvotes.includes(user.uid)) return; 
      await updateDoc(doc(db, "resources", resource.id), { upvotes: arrayUnion(user.uid) });
      if (resource.userId !== user.uid) { 
          const uploaderRef = doc(db, "leaderboard", resource.userId);
          const uploaderSnap = await getDoc(uploaderRef);
          if (uploaderSnap.exists()) { await updateDoc(uploaderRef, { points: increment(20) }); } 
          else { await setDoc(uploaderRef, { name: resource.userName, points: 20, photo: resource.userPhoto }); }
      }
  };

  const updateCanteenStatus = async (status) => {
      await setDoc(doc(db, "canteen_status", "main"), { status: status, lastUpdated: serverTimestamp(), updatedBy: user.displayName });
  };

  const updateSpotStatus = async (spotName, vibe) => {
      await setDoc(doc(db, "hotspots", spotName), { status: vibe, lastUpdated: serverTimestamp(), updatedBy: user.displayName });
  };

  const priorityScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
  const processedReports = (reports || [])
    .filter(r => {
      if (['leaderboard', 'academic', 'vibe', 'eklavya'].includes(filter)) return false; 
      if (filter === 'resolved') return r.status === 'Resolved';
      return r.category === filter && r.status === 'Pending';
    })
    .sort((a, b) => {
      if (sortBy === 'mostHelpers') return (b.helpers?.length || 0) - (a.helpers?.length || 0);
      if (sortBy === 'highestPriority') return priorityScore[b.urgency] - priorityScore[a.urgency];
      if (sortBy === 'lowestPriority') return priorityScore[a.urgency] - priorityScore[b.urgency];
      return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0); 
    });

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <style>{styles}</style>

      {/*HEADER*/}
      <nav style={{ 
          background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', 
          borderBottom: '1px solid var(--border-color)',
          padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', background: '#c0392b', borderRadius: '50%' }}></div>
          <h2 className="grad-text" style={{ margin: 0, fontSize: '22px', letterSpacing: '-0.5px' }}>SOMAIYA CONNECT</h2>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          {/* Dark Mode Toggle */}
          <button onClick={() => setDarkMode(!darkMode)} className="icon-btn tap-active" title="Toggle Dark Mode">
            {darkMode ? '☀️' : '🌙'}
          </button>

          <button onClick={() => setShowHelpGuide(true)} className="icon-btn tap-active" title="Help">?</button>
          
          {user && (
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <img src={user.photoURL} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '3px solid var(--card-bg)' }} alt="u" />
                <button onClick={() => signOut(auth)} className="tap-active" style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #c0392b', color: '#c0392b', background: 'transparent', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                    Log Out
                </button>
            </div>
          )}
        </div>
      </nav>

      {/*LOGIN */}
      {!user ? (
        <div className="fade-in" style={{ textAlign: 'center', padding: '140px 20px', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '80px', marginBottom: '10px' }}>👋</div>
          <h1 className="grad-text" style={{ fontSize: '48px', marginBottom: '10px' }}>Namaste!</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '18px', marginBottom: '40px', lineHeight: '1.6' }}>
            The ultimate companion for campus life.<br/>Find lost items, check sports vibes & more.
          </p>
          <button onClick={login} className="tap-active" style={{ padding: '20px 50px', background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '50px', fontWeight: '800', fontSize: '18px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(192, 57, 43, 0.4)' }}>
             G Sign in with Google
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '25px 20px' }}>
           
          {/* GREETING */}
          <div className="fade-in" style={{ marginBottom: '35px', textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>{greeting}, <span className="grad-text">{user.displayName.split(' ')[0]}</span></h2>
            <p style={{ margin: '5px 0 0 0', color: 'var(--text-sub)' }}>What's happening on campus today?</p>
          </div>

          {/* TAB NAVIGATION */}
          <div style={{ marginBottom: '30px', overflowX: 'auto', padding: '10px 5px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['lost', 'complaint', 'academic', 'vibe', 'eklavya', 'resolved', 'leaderboard'].map(t => (
                <button key={t} onClick={() => setFilter(t)} className={`nav-pill tap-active ${filter === t ? 'active' : ''}`}>
                    {t === 'academic' ? '📚 ACADEMIC' : t === 'vibe' ? '📍 VIBE CHECK' : t === 'eklavya' ? '🏅 EKLAVYA' : t.toUpperCase()}
                </button>
              ))}
            </div>
            
            {!['leaderboard', 'academic', 'vibe', 'eklavya'].includes(filter) && (
              <div className="fade-in" style={{ marginTop: '20px' }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-modern" style={{ width: '100%', cursor: 'pointer' }}>
                  <option value="newest">🕒 Sort: Newest First</option>
                  <option value="highestPriority">🚨 Sort: Highest Priority</option>
                  <option value="lowestPriority">🍃 Sort: Lowest Priority</option>
                  <option value="mostHelpers">🤝 Sort: Most Helpers</option>
                </select>
              </div>
            )}
          </div>

          {/*CONTENT AREA */}

          {/* 1. ACADEMIC */}
          {filter === 'academic' && (
              <div className="fade-in">
                  <div className="modern-card" style={{ padding: '30px', marginBottom: '30px' }}>
                      <h3 className="grad-text" style={{ marginTop: 0 }}>📚 Share Resources</h3>
                      <input className="input-modern" value={resTitle} onChange={(e) => setResTitle(e.target.value)} placeholder="Subject / Book Title" style={{ width: '100%', marginBottom: '15px', boxSizing:'border-box' }} />
                      <textarea className="input-modern" value={resLink} onChange={(e) => setResLink(e.target.value)} placeholder="Paste Drive Link or Description..." style={{ width: '100%', minHeight: '80px', boxSizing:'border-box' }} />
                      <button onClick={handlePostResource} className="tap-active" style={{ width: '100%', padding: '15px', background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '16px', marginTop: '15px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 5px 15px rgba(192, 57, 43, 0.3)' }}>Post & Earn +20 Pts</button>
                  </div>
                  
                  {resources.map((res, idx) => (
                      <div key={res.id} className="modern-card card-animate" style={{ padding: '20px', marginBottom: '15px', animationDelay: `${idx * 0.1}s` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                             <div>
                                 <h3 style={{margin: '0 0 5px 0', fontSize: '18px'}}>{res.title}</h3>
                                 <p style={{margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-sub)', wordBreak: 'break-all'}}>{res.link.startsWith('http') ? <a href={res.link} target="_blank" rel="noreferrer" style={{color: '#c0392b', textDecoration: 'none', fontWeight: 'bold'}}>Open Link ↗</a> : res.link}</p>
                                 <div style={{fontSize: '12px', color: '#aaa'}}>Shared by {res.userName}</div>
                             </div>
                             <button onClick={() => handleUpvote(res)} className="tap-active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: 'none', background: res.upvotes.includes(user.uid) ? '#e8f8f5' : 'var(--input-bg)', padding: '12px', borderRadius: '15px', cursor: 'pointer', minWidth: '60px', transition: '0.2s' }}>
                                 <span style={{fontSize: '20px'}}>🔼</span>
                                 <span style={{fontWeight: '800', marginTop: '5px', color: res.upvotes.includes(user.uid) ? '#27ae60' : '#bdc3c7'}}>{res.upvotes.length}</span>
                             </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* 2. VIBE CHECK*/}
          {filter === 'vibe' && (
              <div className="fade-in">
                  {/* Canteen */}
                  <div className="modern-card" style={{ padding: '30px', marginBottom: '30px', textAlign: 'center' }}>
                      <h3 style={{margin: '0 0 20px 0', fontSize: '20px'}}>🍔 Canteen Live Status</h3>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                          {['Empty 🟢', 'Busy 🟡', 'Full 🔴'].map(status => (
                              <button key={status} onClick={() => updateCanteenStatus(status)} className="tap-active" style={{ padding: '15px', flex: 1, borderRadius: '15px', border: 'none', background: canteenStatus.status === status ? '#ffeaa7' : 'var(--input-bg)', fontWeight: 'bold', cursor: 'pointer', color: 'black', boxShadow: canteenStatus.status === status ? '0 5px 15px rgba(253, 203, 110, 0.4)' : 'none', transform: canteenStatus.status === status ? 'scale(1.05)' : 'scale(1)', transition: '0.3s' }}>
                                  {status.split(' ')[0]}
                              </button>
                          ))}
                      </div>
                      <div className="badge" style={{ background: '#ecf0f1', color: '#7f8c8d' }}>
                          Current: {canteenStatus.status} • by {canteenStatus.updatedBy || 'Unknown'}
                      </div>
                  </div>

                  {/* Hotspots Grid */}
                  <h3 style={{marginLeft: '10px', color: 'var(--text-main)'}}>📍 Campus Hotspots</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
                      {campusSpots.map((spot, i) => {
                          const data = hotspots[spot] || { status: 'Unknown' };
                          const formattedStatus = data.status.replace(' ', '-');
                          return (
                              <div key={spot} className="modern-card card-animate" style={{ padding: '20px', animationDelay: `${i * 0.05}s`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                  <div>
                                      <div style={{fontWeight: '700', marginBottom: '8px', fontSize: '16px', lineHeight: '1.2'}}>{spot}</div>
                                      <div className={`badge status-${formattedStatus}`} style={{marginBottom: '10px'}}>
                                          {data.status === 'Unknown' ? '❓ No Data' : data.status}
                                      </div>
                                  </div>
                                  
                                  {data.updatedBy && <div style={{fontSize: '10px', color: 'var(--text-sub)', marginBottom: '10px'}}>By: {data.updatedBy.split(' ')[0]}</div>}
                                  
                                  <select onChange={(e) => updateSpotStatus(spot, e.target.value)} className="input-modern" style={{ width: '100%', padding: '8px', fontSize: '12px' }}>
                                      <option value="">Update...</option>
                                      <option value="Chill">🍃 Chill</option>
                                      <option value="Crowded">👥 Crowded</option>
                                      <option value="Event">🎉 Event</option>
                                  </select>
                              </div>
                          )
                      })}
                  </div>
              </div>
          )}

          {/* 3. EKLAVYA */}
          {filter === 'eklavya' && (
              <div className="fade-in">
                  <div className="modern-card" style={{ background: 'var(--primary-grad)', padding: '30px', borderRadius: '24px', marginBottom: '30px', color: 'white', textAlign: 'center', boxShadow: '0 10px 30px rgba(192, 57, 43, 0.5)' }}>
                      <h2 style={{margin: '0', fontSize: '28px'}}>🏅 Eklavya Sports</h2>
                      <p style={{margin:'5px 0 0 0', opacity: 0.9, fontWeight: '300'}}>Check availability & join the game!</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
                      {sportsList.map((sport, i) => {
                          const data = hotspots[sport] || { status: 'Unknown' };
                          const statusClass = data.status.replace(/ /g, '-'); 
                          
                          return (
                              <div key={sport} className="modern-card card-animate" style={{ padding: '20px', animationDelay: `${i * 0.05}s`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                  <div>
                                      <div style={{fontWeight: '700', marginBottom: '8px', fontSize: '16px'}}>{sport}</div>
                                      <div className={`badge status-${statusClass}`} style={{marginBottom: '10px'}}>
                                          {data.status === 'Unknown' ? '❓ No Data' : data.status}
                                      </div>
                                  </div>
                                  
                                  {data.updatedBy && <div style={{fontSize: '10px', color: 'var(--text-sub)', marginBottom: '10px'}}>By: {data.updatedBy.split(' ')[0]}</div>}

                                  <select onChange={(e) => updateSpotStatus(sport, e.target.value)} className="input-modern" style={{ width: '100%', padding: '8px', fontSize: '12px' }}>
                                      <option value="">Update...</option>
                                      <option value="Empty">🟢 Empty</option>
                                      <option value="Busy">🟡 Busy</option>
                                      <option value="Full">🔴 Full</option>
                                      <option value="Event here">🔵 Event here</option>
                                  </select>
                              </div>
                          )
                      })}
                  </div>
              </div>
          )}

          {/* 4. LEADERBOARD */}
          {filter === 'leaderboard' ? (
            <div className="modern-card card-animate" style={{ padding: '30px' }}>
              <h2 className="grad-text" style={{ textAlign: 'center', marginBottom: '25px' }}>🏆 Top Contributors</h2>
              {leaderboard.map((l, i) => (
                <div key={l.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', marginBottom: '10px', borderRadius: '16px', background: i === 0 ? '#fff9e6' : 'transparent', border: i === 0 ? '1px solid #ffeaa7' : 'none', color: i === 0 ? 'black' : 'var(--text-main)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '30px', fontWeight: '800', color: i < 3 ? '#e67e22' : '#bdc3c7', fontSize: '18px' }}>#{i+1}</div>
                    <img src={l.photo} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} alt="u" />
                    <span style={{ fontWeight: '600' }}>{l.name}</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#c0392b', background: '#fadbd8', padding: '5px 10px', borderRadius: '10px', fontSize: '14px' }}>{l.points} pts</span>
                </div>
              ))}
            </div>
          ) : null}

          {/* 5. FEED (Lost, Complaint) */}
          {!['leaderboard', 'academic', 'vibe', 'eklavya'].includes(filter) && (
            <>
              {filter !== 'resolved' && (
                <div className="modern-card" style={{ padding: '25px', marginBottom: '40px', borderTop: '5px solid #c0392b' }}>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-modern" style={{ flex: 1 }}>
                      <option value="lost">🔍 Lost & Found</option>
                      <option value="complaint">🛠️ Complaint</option>
                    </select>
                    <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="input-modern" style={{ flex: 1 }}>
                      <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">🚨 High</option>
                    </select>
                  </div>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-modern" placeholder="What's on your mind? Share details..." style={{ width: '100%', minHeight: '100px', boxSizing: 'border-box' }} />
                  <button onClick={handleSubmit} className="tap-active" style={{ width: '100%', padding: '16px', background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '16px', marginTop: '15px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 8px 20px rgba(192, 57, 43, 0.3)' }}>Post Update</button>
                </div>
              )}

              {processedReports.map((r, idx) => (
                <div key={r.id} className="modern-card card-animate" style={{ padding: '25px', marginBottom: '25px', animationDelay: `${idx * 0.1}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <img src={r.userPhoto} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt="p" />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>{r.userName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: '600', marginTop: '2px' }}>
                        {r.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                        <span style={{ color: r.urgency === 'High' ? '#e74c3c' : '#f39c12' }}> {r.urgency} Priority</span>
                      </div>
                    </div>
                  </div>
                  
                  {editId === r.id ? (
                    <div>
                      <textarea className="input-modern" value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: '100%' }} />
                      <button onClick={() => handleEditSave(r.id)} style={{marginTop:'10px', padding:'10px 20px', background:'#2c3e50', color:'white', border:'none', borderRadius:'10px'}}>Save</button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text-main)', margin: '0 0 20px 0' }}>{r.description} {r.isEdited && <small style={{color:'#aaa'}}>(edited)</small>}</p>
                  )}

                  {r.helpers?.length > 0 && (
                    <div onClick={() => setViewHelpersModal(r.helpers)} style={{ padding: '15px', background: 'var(--input-bg)', borderRadius: '16px', marginBottom: '20px', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <div style={{background: '#c0392b', color:'white', width:'24px', height:'24px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px'}}>🤝</div>
                       <span style={{ fontSize: '13px', color: '#c0392b', fontWeight: '700' }}>{r.helpers[0].name} {r.helpers.length > 1 && `+ ${r.helpers.length - 1} others`} are helping</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {r.status === 'Pending' && (
                      <button onClick={() => handleJoinSearch(r)} className="tap-active" style={{ padding: '10px 24px', borderRadius: '50px', background: r.helpers?.some(h => h.uid === user.uid) ? 'var(--input-bg)' : 'var(--card-bg)', color: r.helpers?.some(h => h.uid === user.uid) ? '#636e72' : '#c0392b', border: r.helpers?.some(h => h.uid === user.uid) ? 'none' : '2px solid #c0392b', fontWeight: '700', cursor: 'pointer' }}>
                        {r.helpers?.some(h => h.uid === user.uid) ? '✅ Helping' : '✋ I can help'}
                      </button>
                    )}
                    
                    {user.uid === r.userId && !r.isEdited && r.status === 'Pending' && (
                      <button onClick={() => { setEditId(r.id); setEditText(r.description); }} style={{ padding: '10px 20px', borderRadius: '50px', background: 'transparent', border: '1px solid #bdc3c7', color: '#7f8c8d' }}>Edit</button>
                    )}

                    {/*Resolve Button for Author*/}
                    {user.uid === r.userId && r.status === 'Pending' && (
                      <button onClick={() => handleMarkResolved(r.id)} style={{ padding: '10px 20px', borderRadius: '50px', background: '#27ae60', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>✅ Mark Resolved</button>
                    )}

                    {user.uid === r.userId && r.status === 'Pending' && r.helpers?.length > 0 && (
                      <select onChange={(e) => handleResolve(r.id, e.target.value)} style={{ padding: '10px', borderRadius: '50px', border: '2px solid #27ae60', color: '#27ae60', fontWeight: 'bold', background: 'white' }}>
                        <option>🎁 Award Points</option>
                        {r.helpers.map(h => <option key={h.uid} value={h.uid}>{h.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* MODALS */}
      {showHelpGuide && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modern-card" style={{ padding: '40px', maxWidth: '400px', width:'90%', textAlign:'center' }}>
            <div style={{fontSize:'40px', marginBottom:'10px'}}>💡</div>
            <h2 style={{ color: '#c0392b', margin: '0 0 10px 0' }}>Campus Guide</h2>
            <p style={{lineHeight: '1.6', color: 'var(--text-sub)' }}>
              <b>🏅 Eklavya:</b> Live sports ground status.<br/>
              <b>📍 Vibe Check:</b> Find empty hangout spots.<br/>
              <b>📚 Academic:</b> Share notes, earn 20 points.
            </p>
            <button onClick={() => setShowHelpGuide(false)} className="tap-active" style={{ width: '100%', padding: '15px', background: '#333', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginTop: '20px' }}>Got it</button>
          </div>
        </div>
      )}
      {viewHelpersModal && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modern-card" style={{ padding: '30px', width: '300px' }}>
            <h3 style={{marginTop:0}}>🦸‍♂️ Active Helpers</h3>
            <div style={{maxHeight:'300px', overflowY:'auto'}}>
                {viewHelpersModal.map((h, i) => <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #eee', display:'flex', alignItems:'center', gap:'10px' }}><img src={h.photo} style={{width:'30px', borderRadius:'50%'}} alt=""/> <span>{h.name}</span></div>)}
            </div>
            <button onClick={() => setViewHelpersModal(null)} style={{ width: '100%', padding: '12px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '12px', marginTop: '20px', fontWeight:'bold' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;