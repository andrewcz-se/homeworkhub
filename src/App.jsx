import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  Circle,
  Plus,
  Trash2,
  List,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Users,
  Printer,
  Pencil,
  X,
  Clock,
  CalendarDays,
  Book,
  Sun,
  Moon,
  CalendarPlus,
  CalendarPlus2,
  AlertTriangle,
  Lock, // For password
  Mail, // For email
} from 'lucide-react'; // Using lucide-react for icons

// Import Firebase
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setLogLevel,
} from 'firebase/firestore';

// --- Firebase Configuration (FOR VERCEL) ---
// PASTE YOUR KEYS HERE
// You get this object from your Firebase project settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- Subject Color Definitions (Unchanged) ---
const SUBJECT_COLORS = {
  'Maths': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Swedish': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'English': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Art': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Drama': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'I+S': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'Science': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Design': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'PE': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Spanish': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

const SUBJECT_CALENDAR_COLORS = {
  'Maths': 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  'Swedish': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  'English': 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200',
  'Art': 'bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  'Drama': 'bg-pink-50 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
  'I+S': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200',
  'Science': 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200',
  'Design': 'bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-200',
  'PE': 'bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  'Spanish': 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
};

const SUBJECT_OPTIONS = Object.keys(SUBJECT_COLORS);


// --- Custom Hook for Theme (Unchanged) ---
const useTheme = () => {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    const savedTheme = localStorage.getItem('homework-hub-theme');
    const osPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (osPrefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('homework-hub-theme', theme);
  }, [theme]);
  return [theme, setTheme];
};


// --- Helper Functions (Unchanged) ---
const toLocalDateISOString = (date) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split('T')[0];
};

const getTodayISO = () => {
  return toLocalDateISOString(new Date());
};

// --- React Components ---

/**
 * TaskItem Component (Unchanged)
 * Renders a single task in a list view
 */
const TaskItem = ({ task, onToggleComplete, onDelete, onOpenEditModal, onAddToGoogle, onAddToOutlook }) => {
  const isOverdue = !task.completed && new Date(task.dueDate) < new Date(getTodayISO());

  return (
    <div
      className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none print:shadow-none print:border print:border-gray-200 ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onToggleComplete(task.id, task.completed)}
          className="flex-shrink-0"
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.completed ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <Circle className="w-6 h-6 text-gray-400 hover:text-green-500 transition-colors" />
          )}
        </button>
        <div className="flex-1">
          <p
            className={`font-medium text-gray-900 dark:text-gray-100 ${
              task.completed ? 'line-through' : ''
            }`}
          >
            {task.taskName}
          </p>
          <div className="flex items-center space-x-2 text-sm">
            <span className={`px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[task.subject] || SUBJECT_COLORS['Other']}`}>
              {task.subject}
            </span>
            <span
              className={`font-medium ${
                isOverdue
                  ? 'text-red-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Due: {new Date(task.dueDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onAddToGoogle(task)}
          className="text-gray-400 hover:text-green-500 transition-colors"
          aria-label="Add to Google Calendar"
        >
          <CalendarPlus className="w-5 h-5" />
        </button>
        <button
          onClick={() => onAddToOutlook(task)}
          className="text-gray-400 hover:text-blue-500 transition-colors"
          aria-label="Add to Outlook Calendar"
        >
          <CalendarPlus2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => onOpenEditModal(task)}
          className="text-gray-400 hover:text-blue-500 transition-colors"
          aria-label="Edit task"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Delete task"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * HomeworkForm Component (Unchanged)
 * A form for adding new homework tasks
 */
const HomeworkForm = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState('');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [dueDate, setDueDate] = useState(getTodayISO());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim() || !subject.trim() || !dueDate) {
      console.warn("Please fill out all fields.");
      return;
    }

    onAddTask({
      taskName: taskName.trim(),
      subject: subject.trim(),
      dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
      // 'profile' field is no longer needed
    });

    setTaskName('');
    setSubject(SUBJECT_OPTIONS[0]);
    setDueDate(getTodayISO());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none mb-6 space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add New Homework</h2>
      <div>
        <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Task Name
        </label>
        <input
          type="text"
          id="taskName"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
          placeholder="e.g., Chapter 5 Problems"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Subject
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            required
          >
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            required
            min={getTodayISO()}
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Task
      </button>
    </form>
  );
};

/**
 * TaskLists Component (Unchanged)
 * Displays either "Upcoming" or "All" tasks
 */
const TaskLists = ({ tasks, view, onToggleComplete, onDelete, onOpenEditModal, onAddToGoogle, onAddToOutlook, upcomingFilter }) => {
  
  const todayISO = getTodayISO();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowISO = toLocalDateISOString(sevenDaysFromNow);

  const filteredTasks = useMemo(() => {
    let tasksToFilter = [...tasks];

    if (view === 'upcoming') {
      tasksToFilter = tasksToFilter.filter((task) => !task.completed);
    }

    if (view === 'upcoming' && upcomingFilter === 'overdue') {
      tasksToFilter = tasksToFilter.filter((task) => task.dueDate < todayISO);
    } else if (view === 'upcoming' && upcomingFilter === 'today') {
      tasksToFilter = tasksToFilter.filter((task) => task.dueDate === todayISO);
    } else if (view === 'upcoming' && upcomingFilter === 'week') {
      tasksToFilter = tasksToFilter.filter((task) => 
        task.dueDate >= todayISO && task.dueDate <= sevenDaysFromNowISO
      );
    }

    return tasksToFilter.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  }, [tasks, view, upcomingFilter, todayISO, sevenDaysFromNowISO]);

  const getTitle = () => {
    if (upcomingFilter === 'overdue') return 'Overdue Tasks';
    if (upcomingFilter === 'today') return 'Tasks Due Today';
    if (upcomingFilter === 'week') return 'Tasks Due This Week';
    if (view === 'upcoming') return 'Upcoming Homework';
    return 'All Homework';
  };
  const title = getTitle();

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {filteredTasks.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No homework found for this view.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onOpenEditModal={onOpenEditModal}
              onAddToGoogle={onAddToGoogle}
              onAddToOutlook={onAddToOutlook}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * CalendarView Component (Unchanged)
 * Renders a monthly calendar with tasks
 */
const CalendarView = ({ tasks, onToggleComplete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const date = task.dueDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const todayISO = getTodayISO();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`pad-start-${i}`} className="border-r border-b border-gray-200 dark:border-gray-700 print:border-gray-400"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = toLocalDateISOString(dateObj);
      const tasksForDay = tasksByDate[dateStr] || [];
      const isToday = dateStr === todayISO;

      days.push(
        <div
          key={dateStr}
          className="relative p-2 border-r border-b border-gray-200 dark:border-gray-700 min-h-[120px] h-full flex flex-col print:border-gray-400"
        >
          <span
            className={`flex items-center justify-center h-8 w-8 text-sm font-medium rounded-full ${
              isToday
                ? 'bg-blue-600 text-white'
                : 'text-gray-900 dark:text-gray-100 print:text-black'
            }`}
          >
            {day}
          </span>
          <div className="mt-1 space-y-1 overflow-y-auto flex-1">
            {tasksForDay.map(task => {
              const colorClass = task.completed
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                : (SUBJECT_CALENDAR_COLORS[task.subject] || SUBJECT_CALENDAR_COLORS['Other']);

              return (
                <div
                  key={task.id}
                  className={`flex items-start space-x-1.5 p-1 rounded-md text-xs ${colorClass} ${task.completed ? 'opacity-70' : ''}`}
                >
                  <button 
                    onClick={() => onToggleComplete(task.id, task.completed)}
                    className="flex-shrink-0 pt-0.5"
                    aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {task.completed ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                  </button>
                  <span className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                    {task.taskName}
                    <span className="ml-1 opacity-75">({task.subject})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return days;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none overflow-hidden print:shadow-none print:overflow-visible">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 print:hidden">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {monthName}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="hidden print:block text-center p-4 border-b border-gray-400">
        <h2 className="text-xl font-semibold text-black">{monthName}</h2>
      </div>
      <div className="grid grid-cols-7">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 print:border-gray-400 print:text-black">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {renderDays()}
      </div>
    </div>
  );
};

/**
 * Header Component (Updated)
 * Now shows the user's email and a true "Log Out" button.
 */
const Header = ({ userEmail, view, setView, onLogout, onPrint, onClearFilter, theme, setTheme }) => {
  
  const handleSetView = (targetView) => {
    setView(targetView);
    onClearFilter();
  };

  const NavButton = ({ targetView, icon: Icon, label }) => (
    <button
      onClick={() => handleSetView(targetView)}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        view === targetView
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="bg-gray-800 text-white p-4 rounded-lg shadow-lg dark:shadow-none mb-6 print:hidden">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 md:mb-0 flex items-center">
          <Book className="w-7 h-7 mr-2" />
          <span>Homework Hub</span>
        </h1>
        <nav className="flex items-center space-x-2">
          <NavButton targetView="calendar" icon={Calendar} label="Calendar" />
          <NavButton targetView="upcoming" icon={List} label="Upcoming" />
          <NavButton targetView="all" icon={List} label="All Tasks" />
          
          {(view === 'calendar' || view === 'upcoming' || view === 'all') && (
            <button
              onClick={onPrint}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
              title="Print View"
            >
              <Printer className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </nav>
      </div>
      <div className="text-sm text-gray-300 mt-2 flex items-center justify-center md:justify-end">
        <User className="w-4 h-4 mr-2" />
        <span className="font-medium text-white">{userEmail}</span>
        <button
          onClick={onLogout}
          className="ml-4 flex items-center text-gray-300 hover:text-white transition-colors"
          title="Log Out"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Log Out
        </button>
      </div>
    </header>
  );
};

/**
 * LoginScreen Component (New)
 * Handles both Sign Up and Log In with Email/Password.
 */
const LoginScreen = ({ auth, authError, setAuthError }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Cleans up Firebase's error messages
  const cleanFirebaseError = (message) => {
    if (message.includes('auth/wrong-password')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (message.includes('auth/user-not-found')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (message.includes('auth/email-already-in-use')) {
      return 'That email address is already in use by another account.';
    }
    if (message.includes('auth/weak-password')) {
      return 'Password is too weak. Must be at least 6 characters.';
    }
    if (message.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    return 'Unable to login or sign-up, please check your details and try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null); // Clear previous errors

    if (!email.trim() || !password.trim()) {
      setAuthError("Please enter both an email and password.");
      return;
    }

    try {
      if (isSignUp) {
        // --- SIGN UP ---
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // --- LOG IN ---
        await signInWithEmailAndPassword(auth, email, password);
      }
      // onAuthStateChanged in App.jsx will handle success
    } catch (error) {
      console.error("Firebase auth error:", error.code, error.message);
      setAuthError(cleanFirebaseError(error.message));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none text-center">
        <Users className="w-16 h-16 mx-auto text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">Welcome to Homework Hub</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">
          {isSignUp ? 'Create an account to save your tasks.' : 'Log in to see your tasks.'}
        </p>
		<div className="mt-4 text-center text-xs text-gray-400">
          Privacy Notice: This application is a personal project not designed for production use. We respect your privacy and aim to minimise data collection at all times. This application does not use cookies, analytics, tracking, advertising, or marketing technologies. The app allows account creation using Firebase (your email address is used only to create and manage your account via Firebase authentication). Non-personal app settings may be stored locally in your browser. Assets may be delivered via third-party CDNs (e.g. Tailwind).
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g., alice@example.com"
                required
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                placeholder="Password (min. 6 characters)"
                required
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {authError && (
            <p className="text-red-500 text-sm text-left">{authError}</p>
          )}

          <button
            type="submit"
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setAuthError(null); // Clear errors when toggling
          }}
          className="mt-4 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};


/**
 * EditTaskModal Component (Unchanged)
 * A modal form for editing an existing task
 */
const EditTaskModal = ({ task, isOpen, onClose, onSave }) => {
  const [taskName, setTaskName] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTaskName(task.taskName);
      setSubject(task.subject);
      setDueDate(task.dueDate);
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim() || !subject.trim() || !dueDate) {
      console.warn("Please fill out all fields.");
      return;
    }

    onSave({
      ...task, // Keep original ID, completed status, etc.
      taskName: taskName.trim(),
      subject: subject.trim(),
      dueDate,
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 print:hidden"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Homework</h2>
          <div>
            <label htmlFor="editTaskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Task Name
            </label>
            <input
              type="text"
              id="editTaskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="editSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <select
                id="editSubject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                required
              >
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="editDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
              </label>
              <input
                type="date"
                id="editDueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                required
                min={getTodayISO()}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Dashboard Component (Unchanged)
 * Shows "At a Glance" stats
 */
const Dashboard = ({ tasks, setUpcomingFilter }) => {
  const todayISO = getTodayISO();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowISO = toLocalDateISOString(sevenDaysFromNow);

  const { tasksDueToday, tasksDueThisWeek, tasksOverdue } = useMemo(() => {
    const incompleteTasks = tasks.filter(task => !task.completed);
    
    const today = incompleteTasks.filter(task => task.dueDate === todayISO).length;
    
    const week = incompleteTasks.filter(task => 
      task.dueDate >= todayISO && task.dueDate <= sevenDaysFromNowISO
    ).length;
    
    const overdue = incompleteTasks.filter(task => task.dueDate < todayISO).length;

    return { tasksDueToday: today, tasksDueThisWeek: week, tasksOverdue: overdue };
  }, [tasks, todayISO, sevenDaysFromNowISO]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
      <button
        onClick={() => setUpcomingFilter('overdue')}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-none flex items-center space-x-3 text-left w-full transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      >
        <div className="flex-shrink-0 bg-red-100 dark:bg-red-900 p-3 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-200" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tasksOverdue} {tasksOverdue === 1 ? 'Task' : 'Tasks'}
          </p>
        </div>
      </button>

      <button
        onClick={() => setUpcomingFilter('today')}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-none flex items-center space-x-3 text-left w-full transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      >
        <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
          <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-200" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Today</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tasksDueToday} {tasksDueToday === 1 ? 'Task' : 'Tasks'}
          </p>
        </div>
      </button>
      
      <button
        onClick={() => setUpcomingFilter('week')}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-none flex items-center space-x-3 text-left w-full transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      >
        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
          <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-200" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Due This Week</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tasksDueThisWeek} {tasksDueThisWeek === 1 ? 'Task' : 'Tasks'}
          </p>
        </div>
      </button>
    </div>
  );
};


/**
 * Main App Component (Updated for Email/Password Auth)
 */
export default function App() {
  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  // App state
  const [tasks, setTasks] = useState([]); // All tasks for the logged-in user
  const [view, setView] = useState('calendar');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [upcomingFilter, setUpcomingFilter] = useState('all');
  const [theme, setTheme] = useTheme();
  
  // --- Firebase Initialization and Auth ---
  useEffect(() => {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
      console.error("Firebase config is missing! Ensure you've pasted your keys into app.jsx.");
      setAuthError("Firebase config is missing. App cannot load. Please paste your keys from the Firebase console into the firebaseConfig object in app.jsx.");
      setIsAuthReady(true); // Set to true to stop loading screen
      return;
    }
    try {
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      setLogLevel('Debug');
      setDb(dbInstance);
      setAuth(authInstance); // Store auth instance

      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          // User is signed in
          setUserId(user.uid);
          setUserEmail(user.email);
          setIsAuthReady(true);
        } else {
          // User is signed out
          setUserId(null);
          setUserEmail(null);
          setTasks([]); // Clear tasks on logout
          setIsAuthReady(true); // Auth is ready, but no user
        }
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setAuthError("Could not initialize Firebase. Please refresh.");
    }
  }, []);

  // --- Firestore Data Loading (Tasks) ---
  useEffect(() => {
    // Wait for auth and db, AND a logged-in user
    if (!isAuthReady || !db || !userId) {
      // Clear tasks if user logs out but auth is ready
      if (isAuthReady && !userId) {
        setTasks([]);
      }
      return; 
    }

    // --- Listener for TASKS (Path Updated) ---
    const tasksCollectionPath = `users/${userId}/tasks`;
    const tasksCollectionRef = collection(db, tasksCollectionPath);
    const unsubscribeTasks = onSnapshot(tasksCollectionRef, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData);
    }, (error) => {
      console.error("Error listening to Tasks snapshot:", error);
    });

    // Clean up listener
    return () => {
      unsubscribeTasks();
    };

  }, [db, userId, isAuthReady]); // Re-run when user logs in

  // --- Auth Handlers ---
  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      // onAuthStateChanged will handle clearing user state
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // --- CRUD Functions (Paths Updated) ---
  const handleAddTask = async (newTask) => {
    if (!db || !userId) {
      console.error("Not authenticated.");
      return;
    }
    try {
      const tasksCollectionPath = `users/${userId}/tasks`;
      await addDoc(collection(db, tasksCollectionPath), newTask);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    if (!db || !userId) return;
    try {
      const taskDocRef = doc(db, `users/${userId}/tasks`, taskId);
      await updateDoc(taskDocRef, {
        completed: !currentStatus
      });
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!db || !userId) return;
    try {
      const taskDocRef = doc(db, `users/${userId}/tasks`, taskId);
      await deleteDoc(taskDocRef);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTask = async (updatedTask) => {
    if (!db || !userId) return;
    
    // Remove ID from the data object
    const { id, ...taskData } = updatedTask;

    try {
      const taskDocRef = doc(db, `users/${userId}/tasks`, id);
      await updateDoc(taskDocRef, taskData);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
    
    handleCloseEditModal();
  };

  // --- "Add to Calendar" Handlers (Unchanged) ---
  const handleAddToGoogle = (task) => {
    const startDate = task.dueDate.replace(/-/g, '');
    const endDateObj = new Date(task.dueDate);
    endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);
    const endDate = toLocalDateISOString(endDateObj).replace(/-/g, '');
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams();
    params.append('text', task.taskName);
    params.append('dates', `${startDate}/${endDate}`);
    params.append('details', `Homework for: ${task.subject}`);
    const url = `${baseUrl}&${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddToOutlook = (task) => {
    const startDate = `${task.dueDate}T00:00:00`;
    const endDateObj = new Date(task.dueDate);
    endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);
    const endDate = `${toLocalDateISOString(endDateObj)}T00:00:00`;
    const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const params = new URLSearchParams();
    params.append('subject', task.taskName);
    params.append('body', `Homework for: ${task.subject}`);
    params.append('startdt', startDate);
    params.append('enddt', endDate);
    params.append('allday', 'true');
    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // --- Filter/Print Handlers (Unchanged) ---
  const handlePrint = () => {
    window.print();
  };

  const handleClearFilter = () => {
    setUpcomingFilter('all');
  };

  const handleSetUpcomingFilter = (filter) => {
    setView('upcoming');
    setUpcomingFilter(filter);
  };

  // --- Render Logic ---

  // 1. Show loading indicator
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none text-center">
          <Book className="w-16 h-16 mx-auto text-blue-600 animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">Homework Hub</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">Connecting to service...</p>
        </div>
      </div>
    );
  }

  // 2. Show Login screen
  if (!userId) {
    return (
      <LoginScreen 
        auth={auth} 
        authError={authError} 
        setAuthError={setAuthError} 
      />
    );
  }

  // 3. Show main app content
  const renderContent = () => {
    if (view === 'calendar') {
      return <CalendarView tasks={tasks} onToggleComplete={handleToggleComplete} />;
    }
    
    return (
      <>
        {view === 'upcoming' && (
          <Dashboard 
            tasks={tasks}
            setUpcomingFilter={handleSetUpcomingFilter}
          />
        )}
        <TaskLists
          tasks={tasks}
          view={view}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
          onOpenEditModal={handleOpenEditModal}
          onAddToGoogle={handleAddToGoogle}
          onAddToOutlook={handleAddToOutlook}
          upcomingFilter={upcomingFilter}
        />
      </>
    );
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 md:p-8 font-inter print:bg-white">
      <div className="max-w-6xl mx-auto">
        <Header 
          userEmail={userEmail}
          view={view} 
          setView={setView} 
          onLogout={handleLogout}
          onPrint={handlePrint}
          onClearFilter={handleClearFilter}
          theme={theme}
          setTheme={setTheme}
        />
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 print:hidden">
            <HomeworkForm onAddTask={handleAddTask} />
          </div>
          <div className="lg:col-span-2 print:col-span-3">
            {renderContent()}
          </div>
        </main>

        <EditTaskModal
          isOpen={isEditModalOpen}
          task={editingTask}
          onClose={handleCloseEditModal}
          onSave={handleUpdateTask}
        />
      </div>
    </div>
  );
}