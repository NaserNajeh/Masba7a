import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TasbihPage from './pages/TasbihPage';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasbih/:id" element={<TasbihPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </div>
    </ThemeProvider>
  );
}

export default App;