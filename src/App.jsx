import React, { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
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

const TEXT = {
  brand: '\u041a\u0420\u041e\u0414\u041e',
  subtitle: '\u0422\u0432\u043e\u0435 \u0432\u0440\u0435\u043c\u044f \u043f\u043e\u0434 \u043a\u043e\u043d\u0442\u0440\u043e\u043b\u0435\u043c',
  authRequired: '\u041d\u0443\u0436\u043d\u043e \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u043e\u0432\u0430\u0442\u044c\u0441\u044f',
  accountCreated: '\u0410\u043a\u043a\u0430\u0443\u043d\u0442 \u0441\u043e\u0437\u0434\u0430\u043d. \u0415\u0441\u043b\u0438 \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u043e \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435 \u043f\u043e\u0447\u0442\u044b, \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0435 \u0435\u0433\u043e \u0447\u0435\u0440\u0435\u0437 \u043f\u0438\u0441\u044c\u043c\u043e.',
  login: '\u0412\u0445\u043e\u0434',
  signup: '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f',
  signIn: '\u0412\u043e\u0439\u0442\u0438',
  signUp: '\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u0441\u044f',
  password: '\u041f\u0430\u0440\u043e\u043b\u044c',
  orVia: '\u0418\u043b\u0438 \u0447\u0435\u0440\u0435\u0437',
  toggleTheme: '\u0421\u043c\u0435\u043d\u0438\u0442\u044c \u0442\u0435\u043c\u0443',
  active: '\u0412 \u0440\u0430\u0431\u043e\u0442\u0435',
  archive: '\u0410\u0440\u0445\u0438\u0432',
  whatToDo: '\u0427\u0442\u043e \u0434\u0435\u043b\u0430\u0435\u043c?',
  create: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c',
  add: '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c',
  restore: '\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c'
};

const BRAND_LOGO = '/android-chrome-192x192.png';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [authMode, setAuthMode] = useState('login');
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const requireAuth = () => {
    if (!user) {
      alert(TEXT.authRequired);
      return false;
    }
    return true;
  };

  const fetchTasks = async (currentUser = user) => {
    if (!currentUser) return;

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('position', { ascending: true });

    setTasks(data || []);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const loadTasksForSession = async (sessionUser) => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', sessionUser.id)
        .order('position', { ascending: true });

      setTasks(data || []);
    };

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadTasksForSession(session.user);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadTasksForSession(session.user);
      } else {
        setTasks([]);
        setIsCreating(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.is_running && task.last_start_time) {
          const diff = Math.floor((new Date() - new Date(task.last_start_time)) / 1000);
          return { ...task, displaySeconds: task.total_seconds + diff };
        }

        return { ...task, displaySeconds: task.total_seconds };
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

    if (error) {
      alert(error.message);
      return;
    }

    if (type === 'signup') {
      alert(TEXT.accountCreated);
      setAuthMode('login');
      e.target.reset();
    }
  };

  const addTask = async (e) => {
    if (!requireAuth()) return;
    if (e?.preventDefault) e.preventDefault();

    const title = newTaskTitle.trim();
    if (!title) {
      setIsCreating(false);
      return;
    }

    const maxPos = tasks.length > 0 ? Math.max(...tasks.map(task => task.position)) : 0;
    const tempId = Math.random().toString();
    const newTask = {
      id: tempId,
      title,
      user_id: user.id,
      total_seconds: 0,
      is_running: false,
      is_archived: false,
      position: maxPos + 1000,
      inserted_at: new Date().toISOString()
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setIsCreating(false);

    const { error } = await supabase.from('tasks').insert([{
      title,
      user_id: user.id,
      position: maxPos + 1000
    }]);

    if (error) {
      fetchTasks();
    }
  };

  const onDragEnd = async (result) => {
    if (!requireAuth()) return;
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

    await supabase
      .from('tasks')
      .update({ position: newPos })
      .eq('id', reorderedItem.id)
      .eq('user_id', user.id);
  };

  const toggleTask = async (task) => {
    if (!requireAuth()) return;

    const now = new Date().toISOString();
    const isStarting = !task.is_running;

    setTasks(prev => prev.map(item => {
      if (item.id === task.id) {
        return {
          ...item,
          is_running: isStarting,
          last_start_time: isStarting ? now : null,
          total_seconds: isStarting ? item.total_seconds : (item.displaySeconds || item.total_seconds)
        };
      }

      if (isStarting && item.is_running) {
        return {
          ...item,
          is_running: false,
          last_start_time: null,
          total_seconds: item.displaySeconds || item.total_seconds
        };
      }

      return item;
    }));

    if (isStarting) {
      const running = tasks.find(item => item.is_running);

      if (running) {
        const diff = Math.floor((new Date() - new Date(running.last_start_time)) / 1000);

        await supabase
          .from('tasks')
          .update({
            is_running: false,
            total_seconds: running.total_seconds + diff,
            last_start_time: null
          })
          .eq('id', running.id)
          .eq('user_id', user.id);
      }

      await supabase
        .from('tasks')
        .update({ is_running: true, last_start_time: now })
        .eq('id', task.id)
        .eq('user_id', user.id);
    } else {
      const diff = Math.floor((new Date() - new Date(task.last_start_time)) / 1000);

      await supabase
        .from('tasks')
        .update({
          is_running: false,
          total_seconds: task.total_seconds + diff,
          last_start_time: null
        })
        .eq('id', task.id)
        .eq('user_id', user.id);
    }
  };

  const archiveTask = async (id) => {
    if (!requireAuth()) return;

    setTasks(prev => prev.map(task => (
      task.id === id ? { ...task, is_archived: true, is_running: false } : task
    )));

    await supabase
      .from('tasks')
      .update({ is_archived: true, is_running: false })
      .eq('id', id)
      .eq('user_id', user.id);
  };

  const unarchiveTask = async (id) => {
    if (!requireAuth()) return;

    setTasks(prev => prev.map(task => (
      task.id === id ? { ...task, is_archived: false } : task
    )));

    await supabase
      .from('tasks')
      .update({ is_archived: false })
      .eq('id', id)
      .eq('user_id', user.id);
  };

  const formatTime = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-blue-50'}`}>
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <img src={BRAND_LOGO} alt={TEXT.brand} className="w-16 h-16" />
          <div className="text-sky-500 font-black tracking-widest text-2xl">{TEXT.brand}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-blue-50'}`}>
        <div className={`w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border backdrop-blur-2xl transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/70 border-white/50 shadow-sky-200/50'}`}>
          <div className="text-center mb-8">
            <img src={BRAND_LOGO} alt={TEXT.brand} className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-4xl font-black text-sky-500 tracking-tighter mb-2">{TEXT.brand}</h1>
            <p className={`${darkMode ? 'text-slate-400' : 'text-sky-400'} font-medium text-sm italic`}>{TEXT.subtitle}</p>
          </div>

          <div className={`grid grid-cols-2 gap-2 p-1 mb-6 rounded-2xl ${darkMode ? 'bg-slate-900/60' : 'bg-sky-50'}`}>
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`rounded-2xl py-3 text-sm font-bold transition-all ${authMode === 'login' ? 'bg-sky-500 text-white shadow-lg shadow-sky-400/20' : darkMode ? 'text-slate-400' : 'text-sky-500'}`}
            >
              {TEXT.login}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`rounded-2xl py-3 text-sm font-bold transition-all ${authMode === 'signup' ? 'bg-sky-500 text-white shadow-lg shadow-sky-400/20' : darkMode ? 'text-slate-400' : 'text-sky-500'}`}
            >
              {TEXT.signup}
            </button>
          </div>

          <form onSubmit={(e) => handleEmailAuth(e, authMode)} className="space-y-4 mb-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={20} />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className={`w-full border rounded-2xl py-3 pl-12 pr-4 outline-none transition-all ${darkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500' : 'bg-white/50 border-sky-100'}`}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={20} />
              <input
                name="password"
                type="password"
                placeholder={TEXT.password}
                minLength={6}
                className={`w-full border rounded-2xl py-3 pl-12 pr-4 outline-none transition-all ${darkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500' : 'bg-white/50 border-sky-100'}`}
                required
              />
            </div>
            <button type="submit" className="w-full bg-sky-500 text-white font-bold py-4 rounded-2xl hover:bg-sky-600 shadow-lg shadow-sky-400/20 active:scale-[0.98] transition-all">
              {authMode === 'login' ? TEXT.signIn : TEXT.signUp}
            </button>
          </form>

          <div className="relative flex items-center justify-center mb-6">
            <div className={`w-full border-t ${darkMode ? 'border-slate-700' : 'border-sky-100'}`}></div>
            <span className={`absolute px-4 text-[10px] font-bold uppercase tracking-[0.2em] ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-white text-sky-200'}`}>{TEXT.orVia}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className={`flex items-center justify-center gap-3 border py-3 rounded-2xl transition-all ${darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white' : 'bg-white border-sky-50 hover:shadow-md'}`}>
              <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
              <span className="text-sm font-bold">Google</span>
            </button>
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className={`flex items-center justify-center gap-3 border py-3 rounded-2xl transition-all ${darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white' : 'bg-white border-sky-50 hover:shadow-md'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" /></svg>
              <span className="text-sm font-bold">GitHub</span>
            </button>
          </div>

          <button onClick={() => setDarkMode(!darkMode)} className="w-full text-[10px] font-bold text-sky-500 uppercase tracking-widest hover:underline">
            {TEXT.toggleTheme}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? 'bg-slate-900 text-slate-200' : 'bg-gradient-to-br from-blue-50 via-sky-100 to-indigo-50 text-sky-900'}`}>
      <Analytics />
      <SpeedInsights />

      <div className="max-w-6xl mx-auto p-6">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <img src={BRAND_LOGO} alt={TEXT.brand} className="w-11 h-11" />
            <h1 className="text-3xl font-black text-sky-500 tracking-tighter">{TEXT.brand}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white/40 border-white/50 text-sky-500'}`}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => supabase.auth.signOut()} className={`p-2 rounded-full border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white/40 border-white/50 text-sky-400'}`}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className={`flex gap-6 mb-12 border-b ${darkMode ? 'border-slate-800' : 'border-sky-200/50'}`}>
          <button onClick={() => setActiveTab('active')} className={`pb-4 px-2 transition-all font-bold ${activeTab === 'active' ? 'border-b-2 border-sky-500 text-sky-500' : 'opacity-30'}`}>
            {TEXT.active}
          </button>
          <button onClick={() => setActiveTab('archive')} className={`pb-4 px-2 transition-all font-bold ${activeTab === 'archive' ? 'border-b-2 border-sky-500 text-sky-500' : 'opacity-30'}`}>
            {TEXT.archive}
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tasks-grid" direction="horizontal">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {activeTab === 'active' && (
                  <div onClick={() => !isCreating && setIsCreating(true)} className={`p-6 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center min-h-[240px] cursor-pointer transition-all ${isCreating ? 'bg-sky-500/10 border-sky-500' : darkMode ? 'border-slate-800 bg-slate-800/20' : 'border-sky-200 bg-white/20'}`}>
                    {isCreating ? (
                      <form onSubmit={addTask} className="w-full flex flex-col gap-4">
                        <input
                          autoFocus
                          className={`bg-transparent border-b-2 w-full py-2 outline-none text-xl font-bold ${darkMode ? 'border-slate-700 text-white' : 'border-sky-300 text-sky-800'}`}
                          placeholder={TEXT.whatToDo}
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-sky-500 text-white p-3 rounded-2xl font-bold active:scale-95 transition-transform">
                            {TEXT.create}
                          </button>
                          <button type="button" onClick={() => setIsCreating(false)} className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-700' : 'bg-white shadow-sm'}`}>
                            <X size={20} />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-sky-500 text-center animate-pulse">
                        <Plus size={32} className="mx-auto mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{TEXT.add}</span>
                      </div>
                    )}
                  </div>
                )}

                {tasks
                  .filter(task => (activeTab === 'active' ? !task.is_archived : task.is_archived))
                  .map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(draggableProvided, snapshot) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          className={`relative p-6 rounded-[2.5rem] border transition-all duration-300 flex flex-col justify-between min-h-[240px] ${snapshot.isDragging ? 'shadow-2xl scale-105 z-50' : ''} ${task.is_running ? 'ring-2 ring-sky-500 shadow-xl' : ''} ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/50 border-white/20 shadow-sm'}`}
                        >
                          <div {...draggableProvided.dragHandleProps} className="absolute top-6 right-6 opacity-20 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                            <GripVertical size={20} />
                          </div>

                          <div>
                            <h3 className={`font-bold mb-1 truncate pr-8 ${darkMode ? 'text-slate-100' : 'text-sky-800'}`}>{task.title}</h3>
                            <div className={`text-4xl font-black font-mono tracking-tighter ${task.is_running ? 'text-sky-500' : 'opacity-10'}`}>
                              {formatTime(task.displaySeconds || task.total_seconds)}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-6">
                            {activeTab === 'active' ? (
                              <>
                                <button onClick={() => toggleTask(task)} className={`p-5 rounded-[1.5rem] transition-all ${task.is_running ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/50' : darkMode ? 'bg-slate-700 text-slate-400' : 'bg-white text-sky-400 shadow-sm'}`}>
                                  {task.is_running ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                                </button>
                                <button onClick={() => archiveTask(task.id)} className="p-2 text-emerald-500 opacity-30 hover:opacity-100 transition-opacity">
                                  <CheckCircle size={28} />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => unarchiveTask(task.id)} className={`w-full flex items-center justify-center gap-2 p-4 font-bold rounded-2xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-sky-500' : 'bg-white/60 border-white text-sky-600'}`}>
                                <RotateCcw size={20} />
                                <span>{TEXT.restore}</span>
                              </button>
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
