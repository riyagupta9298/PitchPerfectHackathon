// src/App.js
import React from 'react';
//import AudioRecorder from './RecordAudio/AudioRecorder';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Login from './Component/Login';




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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        {/* <AudioRecorder /> */}
          <Login />


       
      </div>
    </ThemeProvider>
  );
}

export default App;