import { useState, useEffect } from 'react';
import BubbleBackground from './components/BubbleBackground';
import Navbar from './components/Navbar';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Lessons from './screens/Lessons';
import SharkChase from './screens/SharkChase';
import ChunkReading from './screens/ChunkReading';
import HomeRowDrill from './screens/HomeRowDrill';
import Leaderboard from './screens/Leaderboard';
import Profile from './screens/Profile';
import { loadUser, saveUser } from './userStore';

export default function App() {
  const [user, setUserState] = useState(null);
  const [screen, setScreen] = useState('home');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const u = loadUser();
    if (u && u.username) {
      setUserState(u);
    }
    setLoaded(true);
  }, []);

  const setUser = (u) => {
    setUserState(u);
    saveUser(u);
  };

  if (!loaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#04101e',
      }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 24,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #00b4d8, #90e0ef)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          SHARKTYPE
        </div>
      </div>
    );
  }

  if (!user || !user.username) {
    return (
      <>
        <BubbleBackground />
        <Onboarding onComplete={(u) => { setUser(u); setScreen('home'); }} />
      </>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <Home user={user} setUser={setUser} setScreen={setScreen} />;
      case 'lessons':
        return <Lessons user={user} setUser={setUser} setScreen={setScreen} />;
      case 'chase':
        return <SharkChase user={user} setUser={setUser} setScreen={setScreen} />;
      case 'chunk':
        return <ChunkReading user={user} setUser={setUser} setScreen={setScreen} />;
      case 'homerow':
        return <HomeRowDrill user={user} setUser={setUser} setScreen={setScreen} />;
      case 'leaderboard':
        return <Leaderboard user={user} setUser={setUser} setScreen={setScreen} />;
      case 'profile':
        return <Profile user={user} setUser={setUser} setScreen={setScreen} />;
      default:
        return <Home user={user} setUser={setUser} setScreen={setScreen} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#04101e' }}>
      <BubbleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar user={user} screen={screen} setScreen={setScreen} />
        <main>
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}
