import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import InstructionsDialog from './InstructionsDialog';
import './style/index.scss';

const Dashboard = ({ onStartQuestion }) => {
  const [showQuestions, setShowQuestions] = React.useState(false);
  const [openInstructionsDialog, setOpenInstructionsDialog] = React.useState(false);

  // Module score data (can be replaced with actual data from props or API)
  const moduleScore = 85;
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
      <Box className="header">
        <img
          src="../img/logo.svg"
          alt="Pitch perfect"
        />
      </Box>



      <Box className="content-wrapper">
        <Box className="pitch-card">
          <Box className="card-content">

              <img
                src="/img/Frame.svg"
                alt="Pitch illustration"

              />

            <Box className="text-content">
              <Typography variant="h5" className="title">
              Improve your Pitch with Confidence
              </Typography>
              <Typography variant="body2" className="subtitle">
              Solve the case studies to gain actionable insights and connect with customers more Effectively & Efficiently
              </Typography>

              {/* Module Score Footer */}
              <Box className="module-score-footer">
                <Box className="scores-container">
                  <Box className="score-item">
                    <Typography className="score-label">Your average score:</Typography>
                    <Box className="score-circle">
                      <CircularProgress
                        variant="determinate"
                        value={85}
                        size={45}
                        thickness={4}
                        className="score-progress"
                      />
                      <Typography className="score-value">
                        {moduleScore}
                      </Typography>
                    </Box>
                  </Box>

                  <Box className="score-item">
                    <Typography className="score-label">Your confidence score:</Typography>
                    <Box className="confidence-bars-container">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="confidence-bar active"
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>

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
        </Box>

        <Box className="questions-section">
        <Box className="questions-header">
          <Typography className="title">
          Case Studies
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
              Start solving case studies to unlock and explore valuable insights.
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



