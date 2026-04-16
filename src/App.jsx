import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Pause, CheckCircle, RotateCcw, Plus, LogOut, X } from 'lucide-react';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('inserted_at', { ascending: false });
    setTasks(data || []);
  };

  useEffect(() => {
    if (!user) return;
    fetchTasks();
    const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          // Включаем тихую синхронизацию в фоне
          fetchTasks();
        })
        .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.is_running && t.last_start_time) {
          const diff = Math.floor((new Date() - new Date(t.last_start_time)) / 1000);
          return { ...t, displaySeconds: t.total_seconds + diff };
        }
        return { ...t, displaySeconds: t.total_seconds };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addTask = async (e) => {
    if (e) e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) { setIsCreating(false); return; }

    const tempId = Math.random().toString();
    const newTask = {
      id: tempId,
      title,
      user_id: user.id,
      total_seconds: 0,
      is_running: false,
      is_archived: false,
      inserted_at: new Date().toISOString()
    };

    // Оптимистичное добавление
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setIsCreating(false);

    const { error } = await supabase.from('tasks').insert([{ title, user_id: user.id }]);
    if (error) fetchTasks(); // Если ошибка, откатываемся к данным с сервера
  };

  const toggleTask = async (task) => {
    const now = new Date().toISOString();
    const isStarting = !task.is_running;

    // Оптимистичное изменение состояния
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          is_running: isStarting,
          last_start_time: isStarting ? now : null,
          total_seconds: isStarting ? t.total_seconds : (t.displaySeconds || t.total_seconds)
        };
      }
      // Останавливаем другие задачи, если запускаем новую
      if (isStarting && t.is_running) {
        return { ...t, is_running: false, last_start_time: null, total_seconds: t.displaySeconds || t.total_seconds };
      }
      return t;
    }));

    if (isStarting) {
      const running = tasks.find(t => t.is_running);
      if (running) {
        const diff = Math.floor((new Date() - new Date(running.last_start_time)) / 1000);
        await supabase.from('tasks').update({
          is_running: false,
          total_seconds: running.total_seconds + diff,
          last_start_time: null
        }).eq('id', running.id);
      }
      await supabase.from('tasks').update({ is_running: true, last_start_time: now }).eq('id', task.id);
    } else {
      const diff = Math.floor((new Date() - new Date(task.last_start_time)) / 1000);
      await supabase.from('tasks').update({
        is_running: false,
        total_seconds: task.total_seconds + diff,
        last_start_time: null
      }).eq('id', task.id);
    }
  };

  const archiveTask = async (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_archived: true, is_running: false } : t));
    await supabase.from('tasks').update({ is_archived: true, is_running: false }).eq('id', id);
  };

  const unarchiveTask = async (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_archived: false } : t));
    await supabase.from('tasks').update({ is_archived: false }).eq('id', id);
  };

  const formatTime = (s = 0) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-indigo-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-sky-400 font-medium tracking-widest animate-pulse">
            <div className="w-12 h-12 bg-sky-400 rounded-full animate-ping opacity-20"></div>
            <p>Кродо</p>
          </div>
        </div>
    );
  }

  if (!user) return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
        <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
            className="bg-white/80 backdrop-blur-md text-sky-900 shadow-xl shadow-sky-200/50 px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-white transition-all border border-white/50"
        >
          Войти через Google
        </button>
      </div>
  );

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-indigo-50 font-sans text-sky-900">
        <div className="max-w-6xl mx-auto p-6">
          <header className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-black text-sky-600 tracking-widest drop-shadow-sm">Кродо</h1>
            <button onClick={() => supabase.auth.signOut()} className="bg-white/40 backdrop-blur-sm p-2 rounded-full text-sky-400 hover:text-sky-600 hover:bg-white/60 transition-all border border-white/50 shadow-sm"><LogOut size={20}/></button>
          </header>

          <div className="flex gap-6 mb-12 border-b border-sky-200/50">
            <button onClick={() => setActiveTab('active')} className={`pb-4 px-2 transition-all font-semibold ${activeTab === 'active' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-sky-300'}`}>В работе</button>
            <button onClick={() => setActiveTab('archive')} className={`pb-4 px-2 transition-all font-semibold ${activeTab === 'archive' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-sky-300'}`}>Архив</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeTab === 'active' && (
                <div
                    className={`p-6 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center min-h-[240px] transition-all
                                ${isCreating ? 'bg-white/80 border-sky-400 shadow-xl shadow-sky-200/50' : 'bg-white/20 border-sky-200 hover:border-sky-300 hover:bg-white/30 cursor-pointer backdrop-blur-sm'}`}
                    onClick={() => !isCreating && setIsCreating(true)}
                >
                  {isCreating ? (
                      <form onSubmit={addTask} className="w-full h-full flex flex-col justify-between">
                        <input autoFocus className="bg-transparent border-b-2 border-sky-300 w-full py-2 outline-none text-xl font-bold text-sky-800" placeholder="Название..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onBlur={() => !newTaskTitle && setIsCreating(false)} />
                        <div className="flex gap-2 mt-6">
                          <button type="submit" className="flex-1 bg-sky-500 text-white p-3 rounded-2xl hover:bg-sky-600 shadow-md shadow-sky-200">Создать</button>
                          <button type="button" onClick={(e) => {e.stopPropagation(); setIsCreating(false)}} className="bg-white/50 text-sky-400 p-3 rounded-2xl hover:bg-white/80"><X size={20}/></button>
                        </div>
                      </form>
                  ) : (
                      <div className="flex flex-col items-center gap-3 text-sky-300">
                        <div className="p-5 bg-white/60 rounded-full shadow-inner"><Plus size={32} /></div>
                        <span className="font-bold uppercase tracking-wider text-xs">Добавить</span>
                      </div>
                  )}
                </div>
            )}

            {tasks.filter(t => activeTab === 'active' ? !t.is_archived : t.is_archived).map(task => (
                <div key={task.id} className={`p-6 rounded-[2.5rem] border border-white/60 backdrop-blur-md transition-all duration-700 flex flex-col justify-between min-h-[240px] shadow-sm
                            ${task.is_running ? 'bg-white/90 border-sky-300 shadow-2xl shadow-sky-300/30 scale-[1.02]' : 'bg-white/50 border-white/20 hover:bg-white/70 hover:shadow-lg'}`}>
                  <div>
                    <h3 className="font-bold text-sky-800/80 mb-1 truncate text-lg">{task.title}</h3>
                    <div className={`text-4xl font-black font-mono tracking-tighter ${task.is_running ? 'text-sky-600' : 'text-sky-200'}`}>{formatTime(task.displaySeconds || task.total_seconds)}</div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    {activeTab === 'active' ? (
                        <>
                          <button onClick={() => toggleTask(task)} className={`p-5 rounded-[1.5rem] transition-all duration-300 shadow-md ${task.is_running ? 'bg-sky-500 text-white shadow-sky-200' : 'bg-white text-sky-400'}`}>
                            {task.is_running ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                          </button>
                          <button onClick={() => archiveTask(task.id)} className="p-2 text-sky-200 hover:text-emerald-400 transition-colors bg-white/30 rounded-full"><CheckCircle size={28}/></button>
                        </>
                    ) : (
                        <button onClick={() => unarchiveTask(task.id)} className="w-full flex items-center justify-center gap-2 p-4 bg-white/60 text-sky-600 font-bold rounded-2xl hover:bg-white transition-all border border-white"><RotateCcw size={20} /><span>Вернуть</span></button>
                    )}
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}