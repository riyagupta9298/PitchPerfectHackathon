import React from 'react';
import { Box, Typography, Button, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import HeadsetIcon from '@mui/icons-material/Headset';
import WifiIcon from '@mui/icons-material/Wifi';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import './style/dashboard.scss';

const Dashboard = () => {
  const [showQuestions, setShowQuestions] = React.useState(false);
  const [openInstructionsDialog, setOpenInstructionsDialog] = React.useState(false);
  const questions = [
    {
      text: "Mr. Rajesh Sharma is a 35-year-old married professional residing in Mumbai. He and his spouse are both employed full-t...",

    },
    {
      text: "Pitch to customer on why they should buy term insurance?",

    },
    {
      text: "Pitch to customer on why they should buy term insurance?",

    },
    {
      text: "Pitch to customer on why they should buy term insurance?",

    },
    {
      text: "Pitch to customer on why they should buy term insurance?",

    }
  ];



  return (
    <div className="dashboard-container">
      <Box className="header"> <img
        src="../img/logo.svg"
        alt="Pitch perfect"

      /></Box>
      <Box className="content-wrapper">
        <Box className="pitch-card">
          <Box className="card-content">

              <img
                src="/img/Frame.svg"
                alt="Pitch illustration"

              />

            <Box className="text-content">
              <Typography variant="h5" className="title">
                Improve your Term Insurance Pitch
              </Typography>
              <Typography variant="body2" className="subtitle">
                Answer 5 targeted questions to gain actionable insights and connect with customers more effectively
              </Typography>
              <Button
                variant="contained"
                className="start-button"
                onClick={() => setOpenInstructionsDialog(true)}
              >
               Start module
              </Button>
            </Box>
          </Box>
        </Box>

        <Box className="questions-section">
        <Box className="questions-header">
          <Typography className="title">
            All questions
          </Typography>
          <Typography
            className="counter"
            onClick={() => setShowQuestions(!showQuestions)}

          >
            0/5 unlocked
          </Typography>
        </Box>

        {showQuestions ? (
          <Box className="questions-list animate-in">
            {questions.map((question, index) => (
              <Box key={index} className="question-item">
                <Typography className="question-text">
                  {question.text}
                </Typography>
                <Button
                  variant="outlined"
                  className="attempt-button"
                >
                  Attempt this
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Box className="empty-state animate-in">
            <img
              src="/img/folder-icon.svg"
              alt="Empty folder"
              className="empty-icon"
            />
            <Typography variant="body2" className="empty-text">
              Your learning starts here, start the{'\n'}
              module to see the questions.
            </Typography>
          </Box>
        )}
      </Box>
        </Box>
      {/* Instructions Dialog */}
      <Dialog
      open={openInstructionsDialog}
      onClose={() => setOpenInstructionsDialog(false)}
      maxWidth="sm"
      fullWidth
      className="instructions-dialog"
    >
      <DialogTitle className="dialog-title">
        Instructions before beginning
        <IconButton
          aria-label="close"
          onClick={() => setOpenInstructionsDialog(false)}
          className="close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box className="instruction-item">
          <Box className="icon-container">
            <MicIcon className="icon" />
          </Box>
          <Box className="instruction-content">
            <Typography variant="h6" className="instruction-title">
              Microphone is mandatory
            </Typography>
            <Typography variant="body2" className="instruction-description">
              Sit close to about 6-12 inches from the microphone for clear audio.
            </Typography>
          </Box>
        </Box>

        <Box className="instruction-item">
          <Box className="icon-container">
            <HeadsetIcon className="icon" />
          </Box>
          <Box className="instruction-content">
            <Typography variant="h6" className="instruction-title">
              Test Your Equipment
            </Typography>
            <Typography variant="body2" className="instruction-description">
              Make sure your mic is working properly.
            </Typography>
          </Box>
        </Box>

        <Box className="instruction-item">
          <Box className="icon-container">
            <WifiIcon className="icon" />
          </Box>
          <Box className="instruction-content">
            <Typography variant="h6" className="instruction-title">
              Check Your Internet Connection
            </Typography>
            <Typography variant="body2" className="instruction-description">
              A stable internet connection ensures uninterrupted process.
            </Typography>
          </Box>
        </Box>

        <Box className="instruction-item">
          <Box className="icon-container">
            <VolumeOffIcon className="icon" />
          </Box>
          <Box className="instruction-content">
            <Typography variant="h6" className="instruction-title">
              Find a Quiet Space
            </Typography>
            <Typography variant="body2" className="instruction-description">
              Sit in a quiet environment before starting the module.
            </Typography>
          </Box>
        </Box>

        <Box className="instruction-item">
          <Box className="icon-container">
            <RecordVoiceOverIcon className="icon" />
          </Box>
          <Box className="instruction-content">
            <Typography variant="h6" className="instruction-title">
              Speak Clearly and at a Moderate Pace
            </Typography>
            <Typography variant="body2" className="instruction-description">
              This helps the system understand your responses better.
            </Typography>
          </Box>
        </Box>

        <Box className="button-container">
          <Button
            variant="contained"
            onClick={() => setOpenInstructionsDialog(false)}
            className="start-dialog-button"
          >
            Let's start
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
    </div>
  );
};

export default Dashboard;



