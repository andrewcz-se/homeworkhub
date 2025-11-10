# **Homework Hub**

Homework Hub is a clean and simple task management app built for students. It's built with **React** and **Vite**, and styled with **Tailwind CSS**. The purpospe of this project was to get some basic React experience and learn how to publish a React app to the web, whilst providing something useful for my kids.

It uses the browser's **localStorage** to save all the tasks, allowing you to create different user profiles on the same computer, each with its own separate homework list. I am investigating moving to Firebase for storage.

## **Features**

* **User Profiles:** Simple username login to keep task lists separate. This is just to seperate profiles so multiple people can use the app on the same device, it is **not** a secure login function.  
* **Persistent Storage:** All tasks are saved to localStorage, so the list is there when you return.  
* **Add/Edit/Delete Tasks:** Full CRUD (Create, Read, Update, Delete) functionality for the homework entries.  
* **Subject Dropdowns:** Pre-set list of subjects (Maths, Science, Art, etc.) for easy entry.  
* **Color-Coded Calendar:** A full monthly calendar that displays tasks on their due dates, with colors for each subject.  
* **Smart List Views:** Toggle between "Calendar," "Upcoming" (incomplete tasks), and "All Tasks."  
* **Interactive Dashboard:** "At a Glance" cards show you tasks due "Today" and "This Week." Clicking a card filters the upcoming list.  
* **Print Support:** A "Print" button for the Calendar and Upcoming views, formatted to be clean and ink-friendly.
* **Calendar Support:** Add homework tasks to your Google or Outlook calendar from the Upcoming and All Tasks views.

## **Getting Started (Running Locally)**

This project uses pnpm as the package manager, as it's fast and reliable.

1. Get the Code  

> Clone this repository or download and unzip the files into a new project folder.  

2. Install pnpm  

If you don't have pnpm installed, run this command in the terminal:  

> npm install -g pnpm

3. Install Dependencies  

Navigate into the project folder and run:  

> pnpm install

This will install the project's dependencies, like react and lucide-react.

4. Run the App  

Start the local development server:  

> pnpm dev

The app will now be running at **http://localhost:5173**.

## **Deploying Online (For example with Vercel + GitHub)**

This method should automatically re-deploy the app every time you push a change to the code, which i am still testing.

**You do not need to run pnpm build locally for this method.**

### **Step 1: Create a .gitignore File**

Before you push the project to GitHub, you **must** have a .gitignore file. This should be created automatically when you create the project, but double check it exists in the project folder. This tells Git to ignore temporary files (like node_modules).

### **Step 2: Push to GitHub**

1. Push to Github either with git and CLI or Github Desktop.

### **Step 3: Import Project to Vercel**

1. On your Vercel dashboard, click **"Add New... Project"**.  
2. Find your new GitHub repository in the list and click the **"Import"** button.

### **Step 4: Configure and Deploy**

Vercel will auto-detect that the project uses Vite.

* **Framework Preset:** It will automatically select **"Vite"**.  
* **Build Command:** It will default to pnpm build or npm run build.  
* **Output Directory:** It will default to dist.

Vercel will pull the code, run the build command on its servers, and deploy the resulting dist folder.
