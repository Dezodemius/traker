import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Pause, CheckCircle, RotateCcw, Plus, LogOut } from 'lucide-react';

// Инициализация через переменные окружения Vite
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Следим за авторизацией
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Загрузка данных и Real-time (синхронизация)
  useEffect(() => {
    if (!user) return;
    const fetchTasks = async () => {
      const { data } = await supabase.from('tasks').select('*').order('inserted_at', { ascending: true });
      setTasks(data || []);
    };
    fetchTasks();

    const channel = supabase.channel('tasks-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
        .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // Таймер для визуального обновления (раз в секунду)
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

  // Логика управления задачами
  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await supabase.from('tasks').insert([{ title: newTaskTitle, user_id: user.id }]);
    setNewTaskTitle('');
  };

  const toggleTask = async (task) => {
    if (!task.is_running) {
      // Останавливаем все остальные перед запуском новой
      const running = tasks.find(t => t.is_running);
      if (running) await stopTask(running);
      await supabase.from('tasks').update({ is_running: true, last_start_time: new Date().toISOString() }).eq('id', task.id);
    } else {
      await stopTask(task);
    }
  };

  const stopTask = async (task) => {
    const diff = Math.floor((new Date() - new Date(task.last_start_time)) / 1000);
    await supabase.from('tasks').update({
      is_running: false,
      total_seconds: task.total_seconds + diff,
      last_start_time: null
    }).eq('id', task.id);
  };

  const formatTime = (s = 0) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!user) return (
      <div className="flex h-screen items-center justify-center">
        <button
            onClick={() => supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: window.location.origin // Это скажет Supabase вернуться на текущий домен Vercel
              }
            })}
            className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2"
        >
          Войти через Google
        </button>
      </div>
  );

  return (
      <div className="max-w-6xl mx-auto p-6 text-white">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-black text-blue-500 tracking-widest">CLOCK_WORK</h1>
          <button onClick={() => supabase.auth.signOut()} className="text-gray-500 hover:text-white transition"><LogOut size={20}/></button>
        </header>

        <form onSubmit={addTask} className="flex gap-3 mb-10">
          <input
              className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Новая задача..."
          />
          <button className="bg-blue-600 px-8 rounded-2xl hover:bg-blue-500 transition"><Plus /></button>
        </form>

        <div className="flex gap-6 mb-8 border-b border-gray-900">
          <button onClick={() => setActiveTab('active')} className={`pb-4 px-2 ${activeTab === 'active' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}>В работе</button>
          <button onClick={() => setActiveTab('archive')} className={`pb-4 px-2 ${activeTab === 'archive' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}>Архив</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tasks.filter(t => activeTab === 'active' ? !t.is_archived : t.is_archived).map(task => (
              <div key={task.id} className={`p-6 rounded-[2rem] border-2 transition-all duration-500 ${task.is_running ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-gray-900 border-gray-800'}`}>
                <h3 className="font-bold text-gray-300 mb-2 truncate">{task.title}</h3>
                <div className={`text-4xl font-mono mb-8 ${task.is_running ? 'text-blue-400' : 'text-gray-600'}`}>{formatTime(task.displaySeconds || task.total_seconds)}</div>
                <div className="flex justify-between items-center">
                  <button onClick={() => toggleTask(task)} className={`p-4 rounded-2xl ${task.is_running ? 'bg-white text-black' : 'bg-gray-800 text-white'}`}>
                    {task.is_running ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                  </button>
                  {activeTab === 'active' ? (
                      <button onClick={() => supabase.from('tasks').update({ is_archived: true, is_running: false }).eq('id', task.id)} className="text-gray-700 hover:text-green-500 transition"><CheckCircle size={28}/></button>
                  ) : (
                      <button onClick={() => supabase.from('tasks').update({ is_archived: false }).eq('id', task.id)} className="text-gray-700 hover:text-blue-500 transition"><RotateCcw size={28}/></button>
                  )}
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}