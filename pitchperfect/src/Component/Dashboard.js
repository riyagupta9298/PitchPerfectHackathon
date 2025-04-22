import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InstructionsDialog from './InstructionsDialog';
import './style/index.scss';

const Dashboard = ({ onStartQuestion }) => {
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
                  onClick={onStartQuestion}
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
      <InstructionsDialog
        open={openInstructionsDialog}
        onClose={() => setOpenInstructionsDialog(false)}
        onStart={onStartQuestion}
      />
    </div>
  );
};

export default Dashboard;



