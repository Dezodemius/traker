import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, Pause, CheckCircle, RotateCcw, Plus, LogOut, X } from 'lucide-react';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isCreating, setIsCreating] = useState(false); // Режим создания новой плитки
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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

    // Подписка на изменения
    const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'tasks' },
            (payload) => {
              console.log('Change received!', payload);
              fetchTasks(); // Принудительно обновляем список при любом изменении
            }
        )
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
    if (!newTaskTitle.trim()) {
      setIsCreating(false);
      return;
    }
    const { error } = await supabase.from('tasks').insert([{ title: newTaskTitle, user_id: user.id }]);
    if (!error) {
      setNewTaskTitle('');
      setIsCreating(false);
      fetchTasks(); // Локальное обновление на случай задержки Real-time
    }
  };

  const toggleTask = async (task) => {
    if (!task.is_running) {
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
      <div className="flex h-screen items-center justify-center bg-black">
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}
                className="bg-white text-black px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition">
          Войти через Google
        </button>
      </div>
  );

  return (
      <div className="min-h-screen bg-black max-w-6xl mx-auto p-6 text-white">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-black text-blue-500 tracking-widest">CLOCK_WORK</h1>
          <button onClick={() => supabase.auth.signOut()} className="text-gray-500 hover:text-white transition"><LogOut size={20}/></button>
        </header>

        <div className="flex gap-6 mb-12 border-b border-gray-900">
          <button onClick={() => setActiveTab('active')} className={`pb-4 px-2 transition-all ${activeTab === 'active' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}>В работе</button>
          <button onClick={() => setActiveTab('archive')} className={`pb-4 px-2 transition-all ${activeTab === 'archive' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}>Архив</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Кнопка-плитка создания (только во вкладке "В работе") */}
          {activeTab === 'active' && (
              <div className={`p-6 rounded-[2rem] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center min-h-[220px] transition-all
                  ${isCreating ? 'bg-gray-900 border-blue-500' : 'bg-transparent hover:border-gray-600 cursor-pointer'}`}
                   onClick={() => !isCreating && setIsCreating(true)}>

                {isCreating ? (
                    <form onSubmit={addTask} className="w-full h-full flex flex-col justify-between">
                      <input
                          autoFocus
                          className="bg-transparent border-b border-blue-500 w-full py-2 outline-none text-xl font-bold"
                          placeholder="Название..."
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          onBlur={() => !newTaskTitle && setIsCreating(false)}
                      />
                      <div className="flex gap-2 mt-4">
                        <button type="submit" className="flex-1 bg-blue-600 p-3 rounded-xl hover:bg-blue-500">Создать</button>
                        <button type="button" onClick={() => setIsCreating(false)} className="bg-gray-800 p-3 rounded-xl"><X size={20}/></button>
                      </div>
                    </form>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-600">
                      <div className="p-4 bg-gray-900 rounded-full"><Plus size={32} /></div>
                      <span className="font-medium">Новая задача</span>
                    </div>
                )}
              </div>
          )}

          {/* Список задач */}
          {tasks.filter(t => activeTab === 'active' ? !t.is_archived : t.is_archived).map(task => (
              <div key={task.id} className={`p-6 rounded-[2rem] border-2 transition-all duration-500 flex flex-col justify-between min-h-[220px] 
                  ${task.is_running ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-gray-900 border-gray-800'}`}>

                <div>
                  <h3 className="font-bold text-gray-300 mb-1 truncate">{task.title}</h3>
                  <div className={`text-4xl font-mono ${task.is_running ? 'text-blue-400' : 'text-gray-600'}`}>
                    {formatTime(task.displaySeconds || task.total_seconds)}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <button onClick={() => toggleTask(task)} className={`p-4 rounded-2xl transition-all ${task.is_running ? 'bg-white text-black scale-110' : 'bg-gray-800 text-white hover:bg-gray-700'}`}>
                    {task.is_running ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                  </button>

                  {activeTab === 'active' ? (
                      <button onClick={() => supabase.from('tasks').update({ is_archived: true, is_running: false }).eq('id', task.id)} className="text-gray-700 hover:text-green-500 transition-colors"><CheckCircle size={28}/></button>
                  ) : (
                      <button onClick={() => supabase.from('tasks').update({ is_archived: false }).eq('id', task.id)} className="text-gray-700 hover:text-blue-500 transition-colors"><RotateCcw size={28}/></button>
                  )}
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}