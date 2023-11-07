import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AppProvider } from './context/appContext';

import { RouterProvider } from 'react-router-dom';
import TestRouter, { NoStateRouter } from './router/TestRouter';

import initializeComms from './comms/comms';

await initializeComms();
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(<NoStateRouter />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
