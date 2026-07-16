import { Toaster } from 'sonner';
import HomePage from '@/pages/HomePage.jsx';

function App() {
  return (
    <>
      <HomePage />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

export default App;
