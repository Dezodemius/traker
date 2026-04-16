import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Play, Pause, CheckCircle, RotateCcw, Plus, LogOut, X,
  Mail, Lock, Moon, Sun, GripVertical
} from 'lucide-react';

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
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // Состояние темы
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Аутентификация
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
      if (!session) setTasks([]); // Очистка при выходе
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
    setTasks(data || []);
  };

  useEffect(() => {
    if (user) {
      fetchTasks(); // Грузим задачи нового юзера
    } else {
      setTasks([]); // Стираем всё, если юзер вышел
    }
  }, [user]);

  // Таймер обновления в реальном времени
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

  const handleEmailAuth = async (e, type) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const { error } = type === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  };

  const addTask = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) { setIsCreating(false); return; }

    const maxPos = tasks.length > 0 ? Math.max(...tasks.map(t => t.position)) : 0;
    const tempId = Math.random().toString();
    const newTask = {
      id: tempId, title, user_id: user.id, total_seconds: 0,
      is_running: false, is_archived: false, position: maxPos + 1000,
      inserted_at: new Date().toISOString()
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setIsCreating(false);

    const { error } = await supabase.from('tasks').insert([{
      title, user_id: user.id, position: maxPos + 1000
    }]);
    if (error) fetchTasks();
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTasks(items);

    const prev = items[result.destination.index - 1];
    const next = items[result.destination.index + 1];
    let newPos;
    if (!prev && !next) newPos = 0;
    else if (!prev) newPos = next.position - 1000;
    else if (!next) newPos = prev.position + 1000;
    else newPos = (prev.position + next.position) / 2;

    await supabase.from('tasks').update({ position: newPos }).eq('id', reorderedItem.id);
  };

  const toggleTask = async (task) => {
    const now = new Date().toISOString();
    const isStarting = !task.is_running;

    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        return {
          ...t, is_running: isStarting,
          last_start_time: isStarting ? now : null,
          total_seconds: isStarting ? t.total_seconds : (t.displaySeconds || t.total_seconds)
        };
      }
      if (isStarting && t.is_running) return { ...t, is_running: false, last_start_time: null, total_seconds: t.displaySeconds || t.total_seconds };
      return t;
    }));

    if (isStarting) {
      const running = tasks.find(t => t.is_running);
      if (running) {
        const diff = Math.floor((new Date() - new Date(running.last_start_time)) / 1000);
        await supabase.from('tasks').update({ is_running: false, total_seconds: running.total_seconds + diff, last_start_time: null }).eq('id', running.id);
      }
      await supabase.from('tasks').update({ is_running: true, last_start_time: now }).eq('id', task.id);
    } else {
      const diff = Math.floor((new Date() - new Date(task.last_start_time)) / 1000);
      await supabase.from('tasks').update({ is_running: false, total_seconds: task.total_seconds + diff, last_start_time: null }).eq('id', task.id);
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

  if (loading) return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-blue-50'}`}>
        <div className="text-sky-500 font-black animate-pulse tracking-widest text-2xl">КРОДО</div>
      </div>
  );

  if (!user) return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-blue-50'}`}>
        <div className={`w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border backdrop-blur-2xl transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-white/50 shadow-sky-200/50'}`}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-sky-500 tracking-tighter mb-2">КРОДО</h1>
            <p className={`${darkMode ? 'text-slate-400' : 'text-sky-400'} font-medium text-sm italic`}>Твое время под контролем</p>
          </div>
          <form onSubmit={(e) => handleEmailAuth(e, 'login')} className="space-y-4 mb-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={20} />
              <input name="email" type="email" placeholder="Email" className={`w-full border rounded-2xl py-3 pl-12 pr-4 outline-none transition-all ${darkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500' : 'bg-white/50 border-sky-100'}`} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={20} />
              <input name="password" type="password" placeholder="Пароль" className={`w-full border rounded-2xl py-3 pl-12 pr-4 outline-none transition-all ${darkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500' : 'bg-white/50 border-sky-100'}`} required />
            </div>
            <button type="submit" className="w-full bg-sky-500 text-white font-bold py-4 rounded-2xl hover:bg-sky-600 shadow-lg shadow-sky-400/20 active:scale-[0.98] transition-all">Войти</button>
          </form>
          <div className="relative flex items-center justify-center mb-6">
            <div className={`w-full border-t ${darkMode ? 'border-slate-700' : 'border-sky-100'}`}></div>
            <span className={`absolute px-4 text-[10px] font-bold uppercase tracking-[0.2em] ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-white text-sky-200'}`}>Или через</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className={`flex items-center justify-center gap-3 border py-3 rounded-2xl transition-all ${darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white' : 'bg-white border-sky-50 hover:shadow-md'}`}>
              <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
              <span className="text-sm font-bold">Google</span>
            </button>
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className={`flex items-center justify-center gap-3 border py-3 rounded-2xl transition-all ${darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white' : 'bg-white border-sky-50 hover:shadow-md'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z"/></svg>
              <span className="text-sm font-bold">GitHub</span>
            </button>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="w-full text-[10px] font-bold text-sky-500 uppercase tracking-widest hover:underline">Сменить тему</button>
        </div>
      </div>
  );

  return (
      <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? 'bg-slate-900 text-slate-200' : 'bg-gradient-to-br from-blue-50 via-sky-100 to-indigo-50 text-sky-900'}`}>
        <div className="max-w-6xl mx-auto p-6">
          <header className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-black text-sky-500 tracking-tighter">КРОДО</h1>
            <div className="flex gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white/40 border-white/50 text-sky-500'}`}>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={() => supabase.auth.signOut()} className={`p-2 rounded-full border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white/40 border-white/50 text-sky-400'}`}>
                <LogOut size={20}/>
              </button>
            </div>
          </header>

          <div className={`flex gap-6 mb-12 border-b ${darkMode ? 'border-slate-800' : 'border-sky-200/50'}`}>
            <button onClick={() => setActiveTab('active')} className={`pb-4 px-2 transition-all font-bold ${activeTab === 'active' ? 'border-b-2 border-sky-500 text-sky-500' : 'opacity-30'}`}>В работе</button>
            <button onClick={() => setActiveTab('archive')} className={`pb-4 px-2 transition-all font-bold ${activeTab === 'archive' ? 'border-b-2 border-sky-500 text-sky-500' : 'opacity-30'}`}>Архив</button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="tasks-grid" direction="horizontal">
              {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {activeTab === 'active' && (
                        <div onClick={() => !isCreating && setIsCreating(true)} className={`p-6 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center min-h-[240px] cursor-pointer transition-all ${isCreating ? 'bg-sky-500/10 border-sky-500' : darkMode ? 'border-slate-800 bg-slate-800/20' : 'border-sky-200 bg-white/20'}`}>
                          {isCreating ? (
                              <form onSubmit={addTask} className="w-full flex flex-col gap-4">
                                <input autoFocus className={`bg-transparent border-b-2 w-full py-2 outline-none text-xl font-bold ${darkMode ? 'border-slate-700 text-white' : 'border-sky-300 text-sky-800'}`} placeholder="Что делаем?" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                                <div className="flex gap-2">
                                  <button type="submit" className="flex-1 bg-sky-500 text-white p-3 rounded-2xl font-bold active:scale-95 transition-transform">Создать</button>
                                  <button type="button" onClick={() => setIsCreating(false)} className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-700' : 'bg-white shadow-sm'}`}><X size={20}/></button>
                                </div>
                              </form>
                          ) : (
                              <div className="text-sky-500 text-center animate-pulse"><Plus size={32} className="mx-auto mb-2" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Добавить</span></div>
                          )}
                        </div>
                    )}

                    {tasks.filter(t => activeTab === 'active' ? !t.is_archived : t.is_archived).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className={`relative p-6 rounded-[2.5rem] border transition-all duration-300 flex flex-col justify-between min-h-[240px] ${snapshot.isDragging ? 'shadow-2xl scale-105 z-50' : ''} ${task.is_running ? 'ring-2 ring-sky-500 shadow-xl' : ''} ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/50 border-white/20 shadow-sm'}`}>
                                <div {...provided.dragHandleProps} className="absolute top-6 right-6 opacity-20 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"><GripVertical size={20}/></div>
                                <div>
                                  <h3 className={`font-bold mb-1 truncate pr-8 ${darkMode ? 'text-slate-100' : 'text-sky-800'}`}>{task.title}</h3>
                                  <div className={`text-4xl font-black font-mono tracking-tighter ${task.is_running ? 'text-sky-500' : 'opacity-10'}`}>{formatTime(task.displaySeconds || task.total_seconds)}</div>
                                </div>
                                <div className="flex justify-between items-center mt-6">
                                  {activeTab === 'active' ? (
                                      <>
                                        <button onClick={() => toggleTask(task)} className={`p-5 rounded-[1.5rem] transition-all ${task.is_running ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/50' : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-white text-sky-400 shadow-sm'}`}>
                                          {task.is_running ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                                        </button>
                                        <button onClick={() => archiveTask(task.id)} className="p-2 text-emerald-500 opacity-30 hover:opacity-100 transition-opacity"><CheckCircle size={28}/></button>
                                      </>
                                  ) : (
                                      <button onClick={() => unarchiveTask(task.id)} className={`w-full flex items-center justify-center gap-2 p-4 font-bold rounded-2xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-sky-500' : 'bg-white/60 border-white text-sky-600'}`}><RotateCcw size={20} /><span>Восстановить</span></button>
                                  )}
                                </div>
                              </div>
                          )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
  );
}