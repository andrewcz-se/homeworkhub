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
  Lock, 
  Mail, 
  RefreshCw, 
  Link as LinkIcon, 
  Settings,
  HelpCircle
} from 'lucide-react';

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
  writeBatch,
  query,
  where,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';

// --- Firebase Configuration ---

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- Subject Color Definitions ---
const SUBJECT_COLORS = {
  'Drama': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Swedish': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'English': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Art': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Maths': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'I+S': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'Science': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Design': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'PE': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Spanish': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

const SUBJECT_CALENDAR_COLORS = {
  'Drama': 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  'Swedish': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  'English': 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200',
  'Art': 'bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  'Maths': 'bg-pink-50 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
  'I+S': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200',
  'Science': 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200',
  'Design': 'bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-200',
  'PE': 'bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  'Spanish': 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
};

const SUBJECT_OPTIONS = Object.keys(SUBJECT_COLORS);

// Helper to guess subject from iCal text, class subject seems to be held in Classes, within Description.
const guessSubject = (text) => {
  const lowerText = text.toLowerCase();
  
  // 1. Check Spanish EARLY to ensure it grabs matches before generic fallbacks
  if (lowerText.includes('spanish') || lowerText.includes('espanol') || lowerText.includes('español')) return 'Spanish';

  if (lowerText.includes('math')) return 'Maths';
  if (lowerText.includes('swedish') || lowerText.includes('svenska')) return 'Swedish';
  if (lowerText.includes('english')) return 'English';
  
  // 2. Use Regex for 'Art' to avoid matching "part", "start", "smart"
  // \b means "word boundary" (space, punctuation, start/end of line)
  if (/\bart\b/.test(lowerText)) return 'Art';
  
  if (lowerText.includes('drama') || lowerText.includes('theatre')) return 'Drama';
  if (lowerText.includes('individuals') || lowerText.includes('societies') || lowerText.includes('i&s') || lowerText.includes('history') || lowerText.includes('geography')) return 'I+S';
  if (lowerText.includes('science') || lowerText.includes('physics') || lowerText.includes('chem') || lowerText.includes('bio')) return 'Science';
  if (lowerText.includes('design')) return 'Design';
  
  // 3. Use Regex for 'PE' to avoid matching "open", "hope", "specific"
  if (/\bpe\b/.test(lowerText) || lowerText.includes('phys ed') || lowerText.includes('sport')) return 'PE';
  
  return 'Other';
};

// --- Custom Hook for Theme ---
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


// --- Helper Functions ---
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
 * TaskItem Component
 */
const TaskItem = ({ task, onToggleComplete, onDelete, onOpenEditModal, onAddToGoogle, onAddToOutlook, onClickTask }) => {
  const isOverdue = !task.completed && new Date(task.dueDate) < new Date(getTodayISO());
  const isSynced = task.source === 'toddle';

  return (
    <div
      className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none print:shadow-none print:border print:border-gray-200 ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <button
          onClick={() => onToggleComplete(task.id, task.completed)}
          className="shrink-0"
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.completed ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <Circle className="w-6 h-6 text-gray-400 hover:text-green-500 transition-colors" />
          )}
        </button>
        
        <div 
          className="flex-1 min-w-0 cursor-pointer" 
          onClick={() => onClickTask(task)}
        >
          <div className="flex items-center gap-2">
            <p
              className={`font-medium text-gray-900 dark:text-gray-100 truncate ${
                task.completed ? 'line-through' : ''
              }`}
            >
              {task.taskName}
            </p>
            {isSynced && (
               <span title="Synced from Toddle" className="text-blue-500 shrink-0">
                 <RefreshCw className="w-3 h-3" />
               </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-sm mt-1">
            <span className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${SUBJECT_COLORS[task.subject] || SUBJECT_COLORS['Other']}`}>
              {task.subject}
            </span>
            <span
              className={`font-medium truncate ${
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
        
        {/* Only show Edit/Delete for manual tasks */}
        {!isSynced ? (
          <>
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
          </>
        ) : (
          <span className="text-gray-300 dark:text-gray-600 cursor-not-allowed px-1">
            <Lock className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * SyncSettingsModal Component
 */
const SyncSettingsModal = ({ isOpen, onClose, icalUrl, setIcalUrl, onSaveUrl, isSyncing, lastSyncTime }) => {
  const [urlInput, setUrlInput] = useState(icalUrl || '');

  // Update local state when prop changes
  useEffect(() => {
    setUrlInput(icalUrl || '');
  }, [icalUrl]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
           <RefreshCw className={`w-6 h-6 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
           <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Calendar Sync</h2>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Paste your Toddle iCal URL here to automatically sync assignments. 
          Synced tasks will replace any previous tasks imported from Toddle.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="icalUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Toddle iCal URL
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="icalUrl"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2"
                placeholder="https://web.toddleapp.com/..."
              />
            </div>
          </div>

          {lastSyncTime && (
             <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
               Last synced: {new Date(lastSyncTime).toLocaleString()}
             </p>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
            >
              Close
            </button>
            <button
              onClick={() => onSaveUrl(urlInput)}
              disabled={isSyncing}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 flex items-center"
            >
              {isSyncing ? 'Syncing...' : 'Save & Sync'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


/**
 * HomeworkForm Component
 */
const HomeworkForm = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState('');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [description, setDescription] = useState('');

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
      description: description.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      source: 'manual' // Mark as manually added
    });

    setTaskName('');
    setSubject(SUBJECT_OPTIONS[0]);
    setDueDate(getTodayISO());
    setDescription('');
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
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
          placeholder="Additional details..."
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
 * TaskLists Component
 */
const TaskLists = ({ tasks, view, onToggleComplete, onDelete, onOpenEditModal, onAddToGoogle, onAddToOutlook, onClickTask, upcomingFilter }) => {
  
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
              onClickTask={onClickTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * CalendarView Component
 */
const CalendarView = ({ tasks, onToggleComplete, onClickTask, onDayDoubleClick }) => {
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
          className="relative p-2 border-r border-b border-gray-200 dark:border-gray-700 min-h-30 h-full flex flex-col print:border-gray-400 cursor-default"
          onDoubleClick={() => onDayDoubleClick(dateStr)}
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
                    className="shrink-0 pt-0.5"
                    aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {task.completed ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                  </button>
                  <span 
                    className={`font-medium cursor-pointer wrap-break-word ${task.completed ? 'line-through' : ''}`}
                    onClick={() => onClickTask(task)}
                  >
                    {task.taskName}
                    {task.source === 'toddle' && <span className="ml-1 opacity-60">↺</span>}
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
 * Header Component
 */
const Header = ({ userEmail, view, setView, onLogout, onPrint, onClearFilter, theme, setTheme, onOpenSync, onOpenHelp }) => {
  
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
          
          <button
            onClick={onOpenSync}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
            title="Sync Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenHelp}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
            title="How to use"
          >
            <HelpCircle className="w-5 h-5" />
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

const LoginScreen = ({ auth, authError, setAuthError }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const cleanFirebaseError = (message) => {
    if (message.includes('auth/wrong-password')) return 'Incorrect email or password.';
    if (message.includes('auth/user-not-found')) return 'Incorrect email or password.';
    if (message.includes('auth/email-already-in-use')) return 'Email already in use.';
    if (message.includes('auth/weak-password')) return 'Password too weak.';
    if (message.includes('auth/invalid-email')) return 'Invalid email address.';
    return 'Unable to login/sign-up. Check details.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    if (!email.trim() || !password.trim()) {
      setAuthError("Please enter email and password.");
      return;
    }
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setAuthError(cleanFirebaseError(error.message));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none text-center">
        <Users className="w-16 h-16 mx-auto text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">Homework Hub</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">
          {isSignUp ? 'Create an account.' : 'Log in to see your tasks.'}
        </p>
        <div className="mt-4 text-center text-xs text-gray-400">
          Privacy Notice: This application is a personal project not designed for production use. We respect your privacy and aim to minimise data collection at all times. This application does not use cookies, analytics, tracking, advertising, or marketing technologies. The app allows account creation using Firebase (your email address is used only to create and manage your account via Firebase authentication). Your task data is stored in a Firestore database. Non-personal app settings may be stored locally in your browser.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" placeholder="Email" required />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <div className="relative">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" placeholder="Password" required />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          {authError && <p className="text-red-500 text-sm text-left">{authError}</p>}
          <button type="submit" className="w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form> 
         {/* <button onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }} className="mt-4 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
          {isSignUp ? 'Have an account? Log In' : "Don't have an account? Sign Up"}
        </button> */}
      </div>
    </div>
    
  );
};

const EditTaskModal = ({ task, isOpen, onClose, onSave }) => {
  const [taskName, setTaskName] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (task) {
      setTaskName(task.taskName);
      setSubject(task.subject);
      setDueDate(task.dueDate);
      setDescription(task.description || '');
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...task, taskName: taskName.trim(), subject: subject.trim(), dueDate, description: description.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-6 h-6" /></button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Homework</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Name</label>
            <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" required>
                {SUBJECT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" required />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700">Cancel</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskDetailModal = ({ task, isOpen, onClose }) => {
  if (!isOpen || !task) return null;

  const formatDescription = (text) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/;

    return text.split(/\n/).map((line, i) => (
      <React.Fragment key={i}>
        {line.split(urlRegex).map((part, index) =>
          part.match(urlRegex) ? (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {part}
            </a>
          ) : (
            part
          )
        )}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="space-y-4">
          <div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SUBJECT_COLORS[task.subject] || SUBJECT_COLORS['Other']}`}>
              {task.subject}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{task.taskName}</h2>
          </div>

          <div className="flex items-center text-gray-600 dark:text-gray-400 space-x-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium">
              Due: {new Date(task.dueDate).toLocaleDateString(undefined, { timeZone: 'UTC', dateStyle: 'long' })}
            </span>
          </div>

          {task.description && (
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h3>
              <div className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                {formatDescription(task.description)}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden" onClick={onClose}>
      <div className="relative w-full max-w-2xl p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close modal">
          <X className="w-6 h-6" />
        </button>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">How to use Homework Hub</h2>
          </div>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" /> Adding Tasks
            </h3>
            <ul className="list-disc list-inside mt-2 text-gray-600 dark:text-gray-300 space-y-1 ml-4">
              <li><strong>Manual Form:</strong> Use the "Add New Homework" form on the dashboard to enter Task Name, Description, Subject, and Due Date.</li>
              <li><strong>Calendar Shortcut:</strong> Double-click any day on the Calendar view to quickly add a task for that specific date.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-500" /> Managing Tasks
            </h3>
            <ul className="list-disc list-inside mt-2 text-gray-600 dark:text-gray-300 space-y-1 ml-4">
              <li><strong>View Details:</strong> Click on any task name to see its full details, including the description.</li>
              <li><strong>Complete:</strong> Click the circle icon to mark a task as finished.</li>
              <li><strong>Edit/Delete:</strong> For manually added tasks, use the pencil icon to edit or the trash icon to delete.</li>
              <li><strong>External Calendars:</strong> Use the calendar plus icons to add tasks to your Google or Outlook calendar.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-500" /> Calendar Sync
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300 ml-4">
              Click the <Settings className="w-4 h-4 inline" /> icon in the toolbar to set up iCal sync. 
              Paste your iCal URL to automatically import assignments. Synced tasks are marked with a <RefreshCw className="w-3 h-3 inline" /> icon and are read-only.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <List className="w-5 h-5 text-blue-500" /> Navigation & Views
            </h3>
            <ul className="list-disc list-inside mt-2 text-gray-600 dark:text-gray-300 space-y-1 ml-4">
              <li><strong>Calendar:</strong> A monthly overview of all your tasks.</li>
              <li><strong>Upcoming:</strong> Shows incomplete tasks with quick filters for Overdue, Today, and This Week.</li>
              <li><strong>All Tasks:</strong> A complete list of all your homework entries.</li>
              <li><strong>Print:</strong> Use the <Printer className="w-4 h-4 inline" /> icon to print your current view.</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">Got it!</button>
        </div>
      </div>
    </div>
  );
};

const AddTaskModal = ({ isOpen, onClose, onAddTask, initialDate }) => {
  const [taskName, setTaskName] = useState('');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [dueDate, setDueDate] = useState(initialDate || getTodayISO());
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTaskName('');
      setSubject(SUBJECT_OPTIONS[0]);
      setDueDate(initialDate || getTodayISO());
      setDescription('');
    }
  }, [isOpen, initialDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim() || !subject.trim() || !dueDate) return;

    onAddTask({
      taskName: taskName.trim(),
      subject: subject.trim(),
      dueDate,
      description: description.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      source: 'manual'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-6 h-6" /></button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add New Homework</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Name</label>
            <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" placeholder="e.g., Chapter 5 Problems" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" placeholder="Additional details..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" required>
                {SUBJECT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100" required />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700">Cancel</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ tasks, setUpcomingFilter }) => {
  const todayISO = getTodayISO();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowISO = toLocalDateISOString(sevenDaysFromNow);

  const { tasksDueToday, tasksDueThisWeek, tasksOverdue } = useMemo(() => {
    const incompleteTasks = tasks.filter(task => !task.completed);
    const today = incompleteTasks.filter(task => task.dueDate === todayISO).length;
    const week = incompleteTasks.filter(task => task.dueDate >= todayISO && task.dueDate <= sevenDaysFromNowISO).length;
    const overdue = incompleteTasks.filter(task => task.dueDate < todayISO).length;
    return { tasksDueToday: today, tasksDueThisWeek: week, tasksOverdue: overdue };
  }, [tasks, todayISO, sevenDaysFromNowISO]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
      <button onClick={() => setUpcomingFilter('overdue')} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3 text-left w-full">
        <div className="shrink-0 bg-red-100 dark:bg-red-900 p-3 rounded-full"><AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-200" /></div>
        <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tasksOverdue}</p></div>
      </button>
      <button onClick={() => setUpcomingFilter('today')} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3 text-left w-full">
        <div className="shrink-0 bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full"><Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-200" /></div>
        <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Today</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tasksDueToday}</p></div>
      </button>
      <button onClick={() => setUpcomingFilter('week')} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3 text-left w-full">
        <div className="shrink-0 bg-blue-100 dark:bg-blue-900 p-3 rounded-full"><CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-200" /></div>
        <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Due This Week</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tasksDueThisWeek}</p></div>
      </button>
    </div>
  );
};


/**
 * Main App Component
 */
export default function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [tasks, setTasks] = useState([]); 
  const [view, setView] = useState('calendar');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDate, setAddModalDate] = useState(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [upcomingFilter, setUpcomingFilter] = useState('all');
  const [theme, setTheme] = useTheme();

  // Sync State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [icalUrl, setIcalUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // --- Firebase Initialization ---
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      setLogLevel('warn'); // Reduced log noise
      setDb(dbInstance);
      setAuth(authInstance);

      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          setUserId(user.uid);
          setUserEmail(user.email);
          setIsAuthReady(true);
        } else {
          setUserId(null);
          setUserEmail(null);
          setTasks([]);
          setIcalUrl(''); // Reset sync info on logout
          setIsAuthReady(true);
        }
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setAuthError("Could not initialize Firebase.");
    }
  }, []);

  // --- Firestore Data Loading & Sync Config Loading ---
  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;

    // 1. Listen for Tasks (Using the clean path users/${userId}/tasks)
    const tasksCollectionPath = `users/${userId}/tasks`;
    const tasksCollectionRef = collection(db, tasksCollectionPath);
    const unsubscribeTasks = onSnapshot(tasksCollectionRef, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData);
    }, (error) => {
      console.error("Error fetching tasks (likely permission denied):", error);
    });

    // 2. Load Sync Settings (Stored in a separate document)
    const settingsRef = doc(db, `users/${userId}/settings/sync`);
    getDoc(settingsRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIcalUrl(data.icalUrl || '');
        setLastSyncTime(data.lastSyncTime || null);
        
        // Trigger background sync if URL exists
        if (data.icalUrl) {
           handleSyncToddle(data.icalUrl, true);
        }
      }
    }).catch(err => console.error("Error fetching settings:", err));

    return () => unsubscribeTasks();
  }, [db, userId, isAuthReady]);

  // --- Handlers ---
  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const handleAddTask = async (newTask) => {
    if (!db || !userId) return;
    try {
      await addDoc(collection(db, `users/${userId}/tasks`), newTask);
    } catch (e) {
      console.error("Add failed (expected in preview):", e);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    if (!db || !userId) return;
    try {
      await updateDoc(doc(db, `users/${userId}/tasks`, taskId), { completed: !currentStatus });
    } catch (e) {
      console.error("Update failed (expected in preview):", e);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!db || !userId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/tasks`, taskId));
    } catch (e) {
      console.error("Delete failed (expected in preview):", e);
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    if (!db || !userId) return;
    const { id, ...taskData } = updatedTask;
    try {
      await updateDoc(doc(db, `users/${userId}/tasks`, id), taskData);
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (e) {
      console.error("Update failed (expected in preview):", e);
    }
  };

  // --- SYNC LOGIC ---

  const handleSaveSyncUrl = async (url) => {
    if (!db || !userId) return;
    
    const settingsRef = doc(db, `users/${userId}/settings/sync`);
    try {
      await setDoc(settingsRef, { icalUrl: url }, { merge: true });
      setIcalUrl(url);
      
      // Trigger sync immediately
      await handleSyncToddle(url, false);
    } catch (e) {
      console.error("Save settings failed (expected in preview):", e);
    }
  };

  const handleSyncToddle = async (url, isBackground = false) => {
     if (!url || !db || !userId) return;
     if (isSyncing) return; // Prevent double sync

     setIsSyncing(true);

     try {
       // 1. Fetch parsed events from Serverless API
       const response = await fetch('/api/parse-ical', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ url })
       });
       
       if (!response.ok) throw new Error('Failed to fetch calendar');
       const { events } = await response.json();

       // 2. Batch Operations: Delete old 'toddle' events, add new ones
       const batch = writeBatch(db);
       
       // A. Find old events
       const q = query(collection(db, `users/${userId}/tasks`), where("source", "==", "toddle"));
       const querySnapshot = await getDocs(q);
       
       // B. Delete old events
       querySnapshot.forEach((doc) => {
         batch.delete(doc.ref);
       });

       // C. Add new events
       events.forEach(event => {
          const newDocRef = doc(collection(db, `users/${userId}/tasks`)); // Generate ID
          //const subject = guessSubject(event.taskName);
          const subject = guessSubject(event.taskName + " " + (event.description || ""));
          
          batch.set(newDocRef, {
            taskName: event.taskName,
            subject: subject,
            dueDate: event.dueDate,
            description: event.description || '',
            completed: false,
            createdAt: new Date().toISOString(),
            source: 'toddle', // Mark as synced
            externalId: event.uid
          });
       });
       
       // D. Update Last Sync Time
       const settingsRef = doc(db, `users/${userId}/settings/sync`);
       batch.set(settingsRef, { lastSyncTime: new Date().toISOString() }, { merge: true });

       await batch.commit();
       setLastSyncTime(new Date().toISOString());

     } catch (error) {
       console.error("Sync failed:", error);
       if (!isBackground) alert("Failed to sync calendar.");
     } finally {
       setIsSyncing(false);
     }
  };


  // --- Render Handlers ---
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleOpenDetailModal = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleDayDoubleClick = (date) => {
    setAddModalDate(date);
    setIsAddModalOpen(true);
  };

  const handleAddToGoogle = (task) => {
    const startDate = task.dueDate.replace(/-/g, '');
    const endDateObj = new Date(task.dueDate);
    endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);
    const endDate = endDateObj.toISOString().split('T')[0].replace(/-/g, '');
    window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${task.taskName}&dates=${startDate}/${endDate}&details=Homework for: ${task.subject}`, '_blank');
  };

  const handleAddToOutlook = (task) => {
    const startDate = `${task.dueDate}T00:00:00`;
    const endDateObj = new Date(task.dueDate);
    endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);
    const endDate = `${endDateObj.toISOString().split('T')[0]}T00:00:00`;
    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?subject=${task.taskName}&body=Homework for: ${task.subject}&startdt=${startDate}&enddt=${endDate}&allday=true`, '_blank');
  };

  // --- Render Logic ---
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center">
          <Book className="w-16 h-16 mx-auto text-blue-600 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-300 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return <LoginScreen auth={auth} authError={authError} setAuthError={setAuthError} />;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 md:p-8 font-inter print:bg-white">
      <div className="max-w-6xl mx-auto">
        <Header 
          userEmail={userEmail}
          view={view} 
          setView={setView} 
          onLogout={handleLogout}
          onPrint={() => window.print()}
          onClearFilter={() => setUpcomingFilter('all')}
          theme={theme}
          setTheme={setTheme}
          onOpenSync={() => setIsSyncModalOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
        />
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 print:hidden">
            <HomeworkForm onAddTask={handleAddTask} />
          </div>
          <div className="lg:col-span-2 print:col-span-3">
            {view === 'calendar' ? (
              <CalendarView tasks={tasks} onToggleComplete={handleToggleComplete} onClickTask={handleOpenDetailModal} onDayDoubleClick={handleDayDoubleClick} />
            ) : (
              <>
                {view === 'upcoming' && <Dashboard tasks={tasks} setUpcomingFilter={(filter) => { setView('upcoming'); setUpcomingFilter(filter); }} />}
                <TaskLists
                  tasks={tasks}
                  view={view}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onOpenEditModal={handleOpenEditModal}
                  onAddToGoogle={handleAddToGoogle}
                  onAddToOutlook={handleAddToOutlook}
                  onClickTask={handleOpenDetailModal}
                  upcomingFilter={upcomingFilter}
                />
              </>
            )}
          </div>
        </main>

        <EditTaskModal
          isOpen={isEditModalOpen}
          task={editingTask}
          onClose={() => { setIsEditModalOpen(false); setEditingTask(null); }}
          onSave={handleUpdateTask}
        />

        <AddTaskModal
          isOpen={isAddModalOpen}
          initialDate={addModalDate}
          onClose={() => { setIsAddModalOpen(false); setAddModalDate(null); }}
          onAddTask={handleAddTask}
        />

        <TaskDetailModal
          isOpen={isDetailModalOpen}
          task={selectedTask}
          onClose={() => { setIsDetailModalOpen(false); setSelectedTask(null); }}
        />

        <SyncSettingsModal 
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          icalUrl={icalUrl}
          setIcalUrl={setIcalUrl}
          onSaveUrl={handleSaveSyncUrl}
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
        />

        <HelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
      </div>
    </div>
  );
}