// src/App.js
import React, { useState } from 'react';
//import AudioRecorder from './RecordAudio/AudioRecorder';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
// import Login from './Component/Login';
import Dashboard from './Component/Dashboard';
import QuestionAnalysis from './Component/QuestionAnalysis';


const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        {/* <AudioRecorder /> */}
        {/* <Login /> */}
        {currentView === 'dashboard' && <Dashboard onStartQuestion={() => setCurrentView('question')} />}
        {currentView === 'question' && <QuestionAnalysis onBack={() => setCurrentView('dashboard')} />}
      </div>
    </ThemeProvider>
  );
}

export default App;