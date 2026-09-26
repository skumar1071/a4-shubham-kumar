## Shubham's Workout Tracker

**Live Application:** https://a4-shubham-kumar.onrender.com/

Workout Tracker is a full-stack web application for recording and managing strength-training workouts. For Assignment 4, I reimplemented the client-side workout interface from Assignment 3 using React components while keeping the existing Express server, MongoDB storage, authentication, and CRUD routes. The workout form, workout table, and individual workout rows are now separate React components, with React state used to manage workout data and editing behavior.

React improved the development experience by making the user interface easier to organize into smaller, reusable components. Using state and props was cleaner than manually creating and updating DOM elements with `document.createElement`, `querySelector`, and `appendChild`. There was some additional setup required for Vite and JSX compilation, but after that configuration was working, the component-based structure made the client-side code easier to understand and maintain.
