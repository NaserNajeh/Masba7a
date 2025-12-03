import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, Moon, Sun, Plus, ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const [searchParams] = useSearchParams();
  const directJoinId = searchParams.get('join');
  
  const [mode, setMode] = useState(directJoinId ? 'direct-join' : null);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [joinId, setJoinId] = useState(directJoinId || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (directJoinId) {
      setMode('direct-join');
      setJoinId(directJoinId);
    }
  }, [directJoinId]);

  const handleCreate = async () => {
    if (!name.trim() || !goal || parseInt(goal) <= 0) {
      toast.error('يرجى إدخال اسمك والهدف المطلوب');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/tasbih/create`, {
        goal: parseInt(goal),
        created_by: name.trim()
      });
      
      localStorage.setItem('participant_name', name.trim());
      toast.success('تم إنشاء المسبحة بنجاح!');
      navigate(`/tasbih/${response.data.id}`);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إنشاء المسبحة');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !joinId.trim()) {
      toast.error('يرجى إدخال اسمك ورمز المسبحة');
      return;
    }

    setLoading(true);
    try {
      await axios.get(`${API}/tasbih/${joinId.trim()}`);
      
      await axios.post(`${API}/tasbih/${joinId.trim()}/join`, {
        participant_name: name.trim()
      });
      
      localStorage.setItem('participant_name', name.trim());
      toast.success('تم الانضمام بنجاح!');
      navigate(`/tasbih/${joinId.trim()}`);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        toast.error('المسبحة غير موجودة');
      } else {
        toast.error('حدث خطأ أثناء الانضمام');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme} transition-colors duration-300`} style={{ background: theme === 'light' ? 'var(--background)' : 'var(--background)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: theme === 'light' ? 'linear-gradient(135deg, #10B981 0%, transparent 70%)' : 'linear-gradient(135deg, #34D399 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: theme === 'light' ? 'linear-gradient(135deg, #D97706 0%, transparent 70%)' : 'linear-gradient(135deg, #FBBF24 0%, transparent 70%)' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 min-h-screen flex flex-col">
        <div className="flex justify-end mb-8">
          <Button
            data-testid="theme-toggle-btn"
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className={`rounded-full ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100' : 'border-gray-700 hover:bg-gray-800'}`}
            style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>

        {!mode ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-12 text-center"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6" style={{ background: theme === 'light' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #34D399, #10B981)', boxShadow: theme === 'light' ? '0 10px 40px rgba(16, 185, 129, 0.3)' : '0 10px 40px rgba(52, 211, 153, 0.3)' }}>
                <Users className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ color: 'var(--foreground)' }}>
                المسبحة الجماعية
              </h1>
              <p className="text-base md:text-lg" style={{ color: 'var(--muted-foreground)' }}>
                سبّح مع عائلتك وأصدقائك في نفس الوقت
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <motion.button
                data-testid="create-tasbih-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('create')}
                className={`p-8 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    <Plus className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl md:text-4xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                    إنشاء مسبحة جديدة
                  </h2>
                  <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
                    ابدأ مسبحة جديدة وشاركها مع الآخرين
                  </p>
                </div>
              </motion.button>

              <motion.button
                data-testid="join-tasbih-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('join')}
                className={`p-8 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                    <Users className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl md:text-4xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                    الانضمام لمسبحة
                  </h2>
                  <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
                    انضم لمسبحة موجودة باستخدام الرمز
                  </p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full"
          >
            {mode !== 'direct-join' && (
              <Button
                data-testid="back-btn"
                onClick={() => setMode(null)}
                variant="ghost"
                className="mb-8 self-start"
                style={{ color: 'var(--foreground)' }}
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                رجوع
              </Button>
            )}

            <div className={`w-full p-8 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
              <h2 className="text-2xl md:text-4xl font-semibold mb-8 text-center" style={{ color: 'var(--foreground)' }}>
                {mode === 'create' ? 'إنشاء مسبحة جديدة' : mode === 'direct-join' ? 'الانضمام للمسبحة' : 'الانضمام لمسبحة'}
              </h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-base mb-2 block" style={{ color: 'var(--foreground)' }}>
                    اسمك
                  </Label>
                  <Input
                    id="name"
                    data-testid="name-input"
                    type="text"
                    placeholder="أدخل اسمك"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg py-6 text-center"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}
                  />
                </div>

                {mode === 'create' && (
                  <div>
                    <Label htmlFor="goal" className="text-base mb-2 block" style={{ color: 'var(--foreground)' }}>
                      الهدف المطلوب
                    </Label>
                    <Input
                      id="goal"
                      data-testid="goal-input"
                      type="number"
                      placeholder="مثال: 1000"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="text-4xl py-8 text-center font-bold"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}
                    />
                  </div>
                )}

                {mode === 'join' && (
                  <div>
                    <Label htmlFor="joinId" className="text-base mb-2 block" style={{ color: 'var(--foreground)' }}>
                      رمز المسبحة
                    </Label>
                    <Input
                      id="joinId"
                      data-testid="join-id-input"
                      type="text"
                      placeholder="أدخل رمز المسبحة"
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      className="text-lg py-6 text-center"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}
                    />
                  </div>
                )}

                <Button
                  data-testid="submit-btn"
                  onClick={mode === 'create' ? handleCreate : handleJoin}
                  disabled={loading}
                  className="w-full py-8 text-xl font-semibold rounded-2xl"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {loading ? 'جاري المعالجة...' : mode === 'create' ? 'إنشاء المسبحة' : 'الانضمام'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}