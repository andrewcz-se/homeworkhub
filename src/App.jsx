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
  Sun, // Added Sun icon
  Moon, // Added Moon icon
} from 'lucide-react'; // Using lucide-react for icons

// --- Subject Color Definitions ---
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
  'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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
  'Other': 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300' // Corrected typo here
};

const SUBJECT_OPTIONS = Object.keys(SUBJECT_COLORS);


// --- Custom Hook for Theme ---
const useTheme = () => {
  // Default to 'light' to avoid flash, but check localStorage/OS immediately
  const [theme, setTheme] = useState('light');

  // On initial load: Check localStorage or OS preference
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
  }, []); // Empty array = run once on load

  // On theme change: Update <html> class and localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('homework-hub-theme', theme);
  }, [theme]); // Run whenever 'theme' changes

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

const generateId = () => {
  return crypto.randomUUID();
};

// --- React Components ---

/**
 * TaskItem Component
 * Renders a single task in a list view
 */
const TaskItem = ({ task, onToggleComplete, onDelete, onOpenEditModal }) => {
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
 * HomeworkForm Component
 * A form for adding new homework tasks
 */
const HomeworkForm = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState('');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]); // Default to the first subject
  const [dueDate, setDueDate] = useState(getTodayISO());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim() || !subject.trim() || !dueDate) {
      console.warn("Please fill out all fields.");
      return;
    }

    onAddTask({
      id: generateId(),
      taskName: taskName.trim(),
      subject: subject.trim(),
      dueDate, // Already in YYYY-MM-DD format
      completed: false,
      createdAt: new Date().toISOString(),
    });

    // Reset form
    setTaskName('');
    setSubject(SUBJECT_OPTIONS[0]); // Reset to the first subject
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
 * TaskLists Component
 * Displays either "Upcoming" or "All" tasks
 */
const TaskLists = ({ tasks, view, onToggleComplete, onDelete, onOpenEditModal, upcomingFilter }) => {
  
  const todayISO = getTodayISO();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowISO = toLocalDateISOString(sevenDaysFromNow);

  const filteredTasks = useMemo(() => {
    let tasksToFilter = [...tasks];

    // 1. Filter based on main view ('upcoming' or 'all')
    if (view === 'upcoming') {
      tasksToFilter = tasksToFilter.filter((task) => !task.completed);
    }

    // 2. Filter based on dashboard selection ('today' or 'week')
    if (view === 'upcoming' && upcomingFilter === 'today') {
      tasksToFilter = tasksToFilter.filter((task) => task.dueDate === todayISO);
    } else if (view === 'upcoming' && upcomingFilter === 'week') {
      tasksToFilter = tasksToFilter.filter((task) => 
        task.dueDate >= todayISO && task.dueDate <= sevenDaysFromNowISO
      );
    }

    // 3. Sort the final list
    return tasksToFilter.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  }, [tasks, view, upcomingFilter, todayISO, sevenDaysFromNowISO]);

  // Determine the title based on the filters
  const getTitle = () => {
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
          No homework found that's due today. Lucky you..
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onOpenEditModal={onOpenEditModal} // Pass prop
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * CalendarView Component
 * Renders a monthly calendar with tasks
 */
const CalendarView = ({ tasks, onToggleComplete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const date = task.dueDate; // Tasks are stored as 'YYYY-MM-DD'
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
    // Padding for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`pad-start-${i}`} className="border-r border-b border-gray-200 dark:border-gray-700 print:border-gray-400"></div>);
    }

    // Actual days
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
      {/* Calendar Header - For Screen */}
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

      {/* Calendar Header - For Print Only */}
      <div className="hidden print:block text-center p-4 border-b border-gray-400">
        <h2 className="text-xl font-semibold text-black">{monthName}</h2>
      </div>
      
      {/* Calendar Grid */}
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
 * Displays navigation and user info
 */
const Header = ({ currentUser, view, setView, onLogout, onPrint, onClearFilter, theme, setTheme }) => {
  
  const handleSetView = (targetView) => {
    setView(targetView);
    onClearFilter(); // Clear any sub-filters when changing main view
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
          
          {/* Print Button */}
          {(view === 'calendar' || view === 'upcoming') && (
            <button
              onClick={onPrint}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
              title="Print View"
            >
              <Printer className="w-5 h-5" />
            </button>
          )}

          {/* Theme Toggle Button */}
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
        <span>Logged in as: <strong className="font-medium text-white">{currentUser}</strong></span>
        <button
          onClick={onLogout}
          className="ml-4 flex items-center text-gray-300 hover:text-white transition-colors"
          title="Switch user"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </button>
      </div>
    </header>
  );
};

/**
 * LoginScreen Component
 * A simple form to "log in" by just entering a name.
 */
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none text-center">
        <Users className="w-16 h-16 mx-auto text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-4">Welcome to Homework Hub</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">Enter a username to manage your homework tasks. Each user has their own list, linked to their login name. Don't forget the login name you used to login!</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            placeholder="e.g., Alice, Bob, or 'Family'"
            required
          />
          <button
            type="submit"
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-4"
          >
            <User className="w-5 h-5 mr-2" />
            Login / Continue
          </button>
        </form>
      </div>
    </div>
  );
};


/**
 * EditTaskModal Component
 * A modal form for editing an existing task
 */
const EditTaskModal = ({ task, isOpen, onClose, onSave }) => {
  const [taskName, setTaskName] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');

  // When the `task` prop changes (i.e., when the modal is opened),
  // populate the form fields with the task's data.
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
      ...task, // Keep the original ID, completed status, etc.
      taskName: taskName.trim(),
      subject: subject.trim(),
      dueDate,
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Modal Backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 print:hidden"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Re-using the HomeworkForm structure, but for editing */}
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
 * Dashboard Component
 * Shows "At a Glance" stats
 */
const Dashboard = ({ tasks, setUpcomingFilter }) => {
  const todayISO = getTodayISO();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowISO = toLocalDateISOString(sevenDaysFromNow);

  const { tasksDueToday, tasksDueThisWeek } = useMemo(() => {
    const incompleteTasks = tasks.filter(task => !task.completed);
    
    const today = incompleteTasks.filter(task => task.dueDate === todayISO).length;
    
    const week = incompleteTasks.filter(task => 
      task.dueDate >= todayISO && task.dueDate <= sevenDaysFromNowISO
    ).length;

    return { tasksDueToday: today, tasksDueThisWeek: week };
  }, [tasks, todayISO, sevenDaysFromNowISO]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:hidden">
      {/* Stat Card: Due Today */}
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
      
      {/* Stat Card: Due This Week */}
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
 * Main App Component
 */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('calendar'); // 'calendar', 'upcoming', 'all'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [upcomingFilter, setUpcomingFilter] = useState('all'); // 'all', 'today', 'week'
  const [theme, setTheme] = useTheme(); // Use the new theme hook

  // Create a dynamic localStorage key based on the user
  const getStorageKey = (user) => `homework-hub-tasks-${user}`;

  // 1. Load the current user from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem('homework-hub-currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  // 2. Load tasks from localStorage *when the user changes*
  useEffect(() => {
    if (currentUser) {
      const storageKey = getStorageKey(currentUser);
      try {
        const storedTasks = localStorage.getItem(storageKey);
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        } else {
          setTasks([]); // No tasks for this user, set to empty
        }
      } catch (error) {
        console.error("Failed to load tasks from localStorage:", error);
        setTasks([]);
      }
    }
  }, [currentUser]); // This effect re-runs when currentUser changes

  // 3. Save tasks to localStorage *whenever tasks change*
  useEffect(() => {
    // Only save if there's a user
    if (currentUser) {
      const storageKey = getStorageKey(currentUser);
      try {
        localStorage.setItem(storageKey, JSON.stringify(tasks));
      } catch (error) {
        console.error("Failed to save tasks to localStorage:", error);
      }
    }
  }, [tasks, currentUser]); // This effect re-runs when tasks or currentUser changes

  // --- Login / Logout Handlers ---

  const handleLogin = (username) => {
    setCurrentUser(username);
    localStorage.setItem('homework-hub-currentUser', username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTasks([]); // Clear tasks from state
    localStorage.removeItem('homework-hub-currentUser');
  };

  // --- CRUD Functions (now just update state) ---

  const handleAddTask = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const handleToggleComplete = (taskId, currentStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !currentStatus } : task
      )
    );
  };

  const handleDeleteTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  // --- Edit Task Functions ---

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    handleCloseEditModal(); // Close the modal after saving
  };

  // --- Filter/Print Handlers ---
  const handlePrint = () => {
    window.print(); // The browser will use the print: styles
  };

  const handleClearFilter = () => {
    setUpcomingFilter('all');
  };

  const handleSetUpcomingFilter = (filter) => {
    // This function is passed to the dashboard
    // It will set the filter and also switch the view to 'upcoming'
    setView('upcoming');
    setUpcomingFilter(filter);
  };


  // --- Render Logic ---

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (view === 'calendar') {
      return <CalendarView tasks={tasks} onToggleComplete={handleToggleComplete} />;
    }
    
    // For 'upcoming' or 'all' views
    return (
      <>
        {/* Only show Dashboard on 'upcoming' view */}
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
          upcomingFilter={upcomingFilter}
        />
      </>
    );
  };

  return (
    // The <html> tag will get the 'dark' class, so this outer div
    // will correctly get the dark mode background color.
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 md:p-8 font-inter print:bg-white">
      <div className="max-w-6xl mx-auto">
        <Header 
          currentUser={currentUser} 
          view={view} 
          setView={setView} 
          onLogout={handleLogout}
          onPrint={handlePrint}
          onClearFilter={handleClearFilter}
          theme={theme} // Pass theme
          setTheme={setTheme} // Pass setter
        />
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-100 dark:bg-gray-900">
          <div className="lg-col-span-1 print:hidden">
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