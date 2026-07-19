import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './features/home/HomePage';
import { useReaderStore } from './stores/readerStore';
import './index.css';

const queryClient = new QueryClient();

function App() {
  const { file, setFile } = useReaderStore();
  const [route, setRoute] = useState(() => window.location.hash === '#/reader' ? 'reader' : 'home');

  useEffect(() => {
    const syncRoute = () => {
      const nextRoute = window.location.hash === '#/reader' ? 'reader' : 'home';
      setRoute(nextRoute);
      if (nextRoute === 'home') setFile(null, null);
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, [setFile]);

  const navigate = (nextRoute: 'home' | 'reader', replace = false) => {
    const nextUrl = nextRoute === 'reader' ? '#/reader' : '#/';
    window.history[replace ? 'replaceState' : 'pushState']({ route: nextRoute }, '', nextUrl);
    setRoute(nextRoute);
  };

  const openPdf = (selectedFile: File) => {
    setFile(selectedFile, selectedFile.name);
    navigate('reader');
  };

  const returnHome = () => {
    setFile(null, null);
    navigate('home', true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      {route === 'reader' && file ? <MainLayout onBackHome={returnHome} /> : <HomePage onOpenPdf={openPdf} />}
    </QueryClientProvider>
  );
}

export default App;
