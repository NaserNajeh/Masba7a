import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, RotateCcw, Users, Trophy, Moon, Sun, Copy, Home, Settings, Vibrate } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TasbihPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [tasbih, setTasbih] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [ripples, setRipples] = useState([]);
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    const saved = localStorage.getItem('vibration_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const buttonRef = useRef(null);
  const audioRef = useRef(null);

  const fetchTasbih = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/tasbih/${id}`);
      setTasbih(response.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        toast.error('المسبحة غير موجودة');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    const name = localStorage.getItem('participant_name');
    if (!name) {
      toast.error('يرجى إدخال اسمك أولاً');
      navigate('/');
      return;
    }
    setParticipantName(name);
    fetchTasbih();

    const interval = setInterval(fetchTasbih, 2000);
    return () => clearInterval(interval);
  }, [fetchTasbih, navigate]);

  useEffect(() => {
    localStorage.setItem('vibration_enabled', vibrationEnabled);
  }, [vibrationEnabled]);

  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log('Audio play failed:', err);
    }
  };

  const triggerCompletionEffects = () => {
    playCompletionSound();
    
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  };

  const handleIncrement = async () => {
    if (tasbih?.is_completed) {
      return;
    }

    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(50);
    }

    const newRipple = {
      id: Date.now(),
      x: 50,
      y: 50
    };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    try {
      const response = await axios.post(`${API}/tasbih/${id}/increment`, {
        participant_name: participantName
      });

      if (response.data.is_completed) {
        triggerCompletionEffects();
        toast.success('تقبل الله .. تم الانتهاء من التسبيحات', {
          duration: 5000,
        });
      }

      await fetchTasbih();
    } catch (error) {
      console.error(error);
      if (error.response?.data?.detail === 'Tasbih is already completed') {
        toast.info('تم الوصول للهدف المطلوب');
      } else if (error.response?.data?.detail === 'Goal already reached') {
        toast.info('تم الوصول للهدف المطلوب');
      }
      await fetchTasbih();
    }
  };

  const handleReset = async () => {
    try {
      await axios.post(`${API}/tasbih/${id}/reset`);
      toast.success('تم إعادة تعيين المسبحة');
      await fetchTasbih();
      setShowReset(false);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إعادة التعيين');
    }
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/?join=${id}`;
    navigator.clipboard.writeText(link);
    toast.success('تم نسخ رابط الانضمام السريع');
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    toast.success('تم نسخ الرمز');
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme} flex items-center justify-center`} style={{ background: 'var(--background)' }}>
        <div className="animate-pulse text-2xl" style={{ color: 'var(--foreground)' }}>
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (!tasbih) {
    return null;
  }

  const progress = (tasbih.current_count / tasbih.goal) * 100;
  const myStats = tasbih.participants.find(p => p.name === participantName);

  return (
    <div className={`min-h-screen ${theme} transition-colors duration-300`} style={{ background: 'var(--background)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: theme === 'light' ? 'linear-gradient(135deg, #10B981 0%, transparent 70%)' : 'linear-gradient(135deg, #34D399 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: theme === 'light' ? 'linear-gradient(135deg, #D97706 0%, transparent 70%)' : 'linear-gradient(135deg, #FBBF24 0%, transparent 70%)' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-8 min-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <Button
            data-testid="home-btn"
            onClick={() => navigate('/')}
            variant="outline"
            size="icon"
            className={`rounded-full ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100' : 'border-gray-700 hover:bg-gray-800'}`}
            style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
          >
            <Home className="h-5 w-5" />
          </Button>
          <div className="flex gap-3">
            <Button
              data-testid="share-btn"
              onClick={handleShare}
              variant="outline"
              size="icon"
              className={`rounded-full ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100' : 'border-gray-700 hover:bg-gray-800'}`}
              style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            {tasbih.created_by === participantName && (
              <Button
                data-testid="reset-btn"
                onClick={() => setShowReset(true)}
                variant="outline"
                size="icon"
                className={`rounded-full ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100' : 'border-gray-700 hover:bg-gray-800'}`}
                style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            )}
            <Button
              data-testid="settings-btn"
              onClick={() => setShowSettings(true)}
              variant="outline"
              size="icon"
              className={`rounded-full ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100' : 'border-gray-700 hover:bg-gray-800'}`}
              style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              data-testid="theme-toggle-tasbih-btn"
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className={`rounded-full ${theme === 'light' ? 'border-gray-300 hover:bg-gray-100' : 'border-gray-700 hover:bg-gray-800'}`}
              style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 w-full max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-4 md:p-6 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} text-center`}
            >
              <div className="text-3xl md:text-5xl font-black mb-2" style={{ color: 'var(--primary)' }}>
                {tasbih.current_count}
              </div>
              <div className="text-sm md:text-base" style={{ color: 'var(--muted-foreground)' }}>
                العداد الإجمالي
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-4 md:p-6 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} text-center`}
            >
              <div className="text-3xl md:text-5xl font-black mb-2" style={{ color: 'var(--accent)' }}>
                {tasbih.goal}
              </div>
              <div className="text-sm md:text-base" style={{ color: 'var(--muted-foreground)' }}>
                الهدف
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-4 md:p-6 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} text-center`}
            >
              <div className="text-3xl md:text-5xl font-black mb-2" style={{ color: 'var(--primary)' }}>
                {myStats?.count || 0}
              </div>
              <div className="text-sm md:text-base" style={{ color: 'var(--muted-foreground)' }}>
                تسبيحاتي
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`p-4 md:p-6 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} text-center`}
            >
              <div className="text-3xl md:text-5xl font-black mb-2" style={{ color: 'var(--accent)' }}>
                {tasbih.participants.length}
              </div>
              <div className="text-sm md:text-base" style={{ color: 'var(--muted-foreground)' }}>
                المشاركين
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.5 }}
            className="mb-8 relative"
          >
            <svg className="transform -rotate-90" width="320" height="320" style={{ filter: 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.3))' }}>
              <circle
                cx="160"
                cy="160"
                r="150"
                stroke={theme === 'light' ? '#E5E7EB' : '#1E293B'}
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="160"
                cy="160"
                r="150"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 150}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 150 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 150 - (progress / 100) * 2 * Math.PI * 150 }}
                transition={{ duration: 0.5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>
            </svg>

            <motion.button
              ref={buttonRef}
              data-testid="tasbih-btn"
              onClick={handleIncrement}
              disabled={tasbih.is_completed}
              whileTap={tasbih.is_completed ? {} : { opacity: 0.85 }}
              className="absolute top-1/2 left-1/2 w-[280px] h-[280px] rounded-full flex flex-col items-center justify-center touch-manipulation select-none transition-opacity duration-100 overflow-hidden"
              style={{
                transform: 'translate(-50%, -50%)',
                background: tasbih.is_completed 
                  ? (theme === 'light' ? '#9CA3AF' : '#4B5563')
                  : `linear-gradient(135deg, ${theme === 'light' ? '#10B981' : '#34D399'}, ${theme === 'light' ? '#059669' : '#10B981'})`,
                boxShadow: tasbih.is_completed ? 'none' : '0 0 60px rgba(16, 185, 129, 0.4)',
                cursor: tasbih.is_completed ? 'not-allowed' : 'pointer'
              }}
            >
              <AnimatePresence>
                {ripples.map(ripple => (
                  <motion.div
                    key={ripple.id}
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'rgba(255, 255, 255, 0.5)',
                      transformOrigin: 'center'
                    }}
                  />
                ))}
              </AnimatePresence>
              
              {tasbih.is_completed ? (
                <>
                  <Trophy className="w-16 h-16 mb-4 text-white" />
                  <span className="text-2xl font-bold text-white">تم الإكمال!</span>
                </>
              ) : (
                <>
                  <span className="text-7xl md:text-9xl font-black text-white tabular-nums">{tasbih.current_count}</span>
                  <span className="text-lg text-white/80 mt-2">اضغط للتسبيح</span>
                </>
              )}
            </motion.button>
          </motion.div>

          <div className="text-center mb-8">
            <div className="text-lg md:text-xl mb-2" style={{ color: 'var(--muted-foreground)' }}>
              الإحصائيات
            </div>
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {Math.round(progress)}% من الهدف
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-6 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} max-w-4xl w-full mx-auto`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            <h3 className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
              المشاركون ({tasbih.participants.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasbih.participants
              .sort((a, b) => b.count - a.count)
              .map((participant, index) => (
                <motion.div
                  key={participant.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-2xl"
                  style={{ background: 'var(--muted)' }}
                >
                  <div className="flex items-center gap-3">
                    {index < 3 && (
                      <div className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                        {participant.name}
                        {participant.name === participantName && ' (أنت)'}
                      </div>
                      {participant.name === tasbih.created_by && (
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>المنشئ</div>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                    {participant.count}
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>

      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className={theme} style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center" style={{ color: 'var(--foreground)' }}>
              مشاركة المسبحة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl mb-4">
                <QRCodeSVG value={`${window.location.origin}/?join=${id}`} size={200} />
              </div>
              <p className="text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
                امسح رمز QR للانضمام مباشرة
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--foreground)' }}>
                رمز المسبحة
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={id}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl text-center font-mono"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                />
                <Button
                  data-testid="copy-id-btn"
                  onClick={handleCopyId}
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--foreground)' }}>
                رابط الانضمام السريع
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/?join=${id}`}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                />
                <Button
                  data-testid="copy-link-btn"
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showReset} onOpenChange={setShowReset}>
        <AlertDialogContent className={theme} style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--foreground)' }}>
              إعادة تعيين المسبحة
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--muted-foreground)' }}>
              هل أنت متأكد من إعادة تعيين المسبحة؟ سيتم إعادة جميع العدادات إلى الصفر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-reset-btn" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-reset-btn"
              onClick={handleReset}
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              إعادة تعيين
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className={theme} style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center" style={{ color: 'var(--foreground)' }}>
              الإعدادات
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--muted)' }}>
              <div className="flex items-center gap-3">
                <Vibrate className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <div>
                  <Label htmlFor="vibration-toggle" className="text-base font-medium cursor-pointer" style={{ color: 'var(--foreground)' }}>
                    الاهتزاز
                  </Label>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {vibrationEnabled ? 'مفعّل عند الضغط على زر التسبيح' : 'معطّل'}
                  </p>
                </div>
              </div>
              <Switch
                id="vibration-toggle"
                data-testid="vibration-toggle"
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
              />
            </div>
            
            <div className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <p>سيتم حفظ إعداداتك تلقائياً</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}