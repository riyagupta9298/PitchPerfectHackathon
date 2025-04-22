import React, { useState } from 'react';
import { Typography, IconButton, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicIcon from '@mui/icons-material/Mic';
import ConfirmationPopup from './ConfirmationPopup';
import DetailedReportPopup from './DetailedReportPopup';
import './style/dashboard.scss';

const QuestionAnalysis = ({ onBack }) => {
  // States for recording and UI control
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingDone, setIsRecordingDone] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  // Static data for the demo
  const keywords = [
    'Tax benefit', 'Risk reduction', 'Risk reduction', 'Risk reduction', 'Risk reduction',
    'Tax benefit', 'Risk reduction', 'Risk reduction', 'Risk reduction', 'Risk reduction'
  ];

  // Handle start answer button click
  const handleStartAnswer = () => {
    setIsRecording(true);
    setIsRecordingDone(false);
  };

  // Handle done button click
  const handleDone = () => {
    setIsRecording(false);
    setIsRecordingDone(true);
  };

  // Handle submit button click
  const handleSubmit = () => {
    // Show the confirmation popup
    setShowSubmitConfirmation(true);
    console.log('Answer submitted');
  };

  // Handle see report button click
  const handleSeeReport = () => {
    // Show the detailed report popup
    setShowSubmitConfirmation(false);
    setShowDetailedReport(true);
    console.log('Showing detailed report');
  };

  // Handle next question button click
  const handleNextQuestion = () => {
    // Here you would navigate to the next question
    setShowSubmitConfirmation(false);
    setShowDetailedReport(false);
    setIsRecordingDone(false);
    console.log('Navigating to next question');
  };

  // Mock question data
  const questionData = {
    number: 1,
    total: 5,
    text: "Mr. Rajesh Sharma is a 35-year-old married professional residing in Mumbai. He and his spouse are both employed full-time and have recently purchased a home with a joint mortgage. They are planning to start a family soon. Mr. Sharma is seeking financial security to protect his family's future, cover outstanding debts, and ensure stability in case of unforeseen events. He values affordable insurance options that offer comprehensive coverage, including riders for critical illness and accidental death. A term insurance plan with a high claim settlement ratio and flexible premium options aligns with his priorities for safeguarding his family's financial well-being."
  };

  return (
    <div className="question-analysis-container">
      {/* Simple Confirmation Popup */}
      {showSubmitConfirmation && (
        <ConfirmationPopup
          onSeeReport={handleSeeReport}
          onNextQuestion={handleNextQuestion}
        />
      )}

      {/* Detailed Report Popup */}
      {showDetailedReport && (
        <DetailedReportPopup
          questionData={questionData}
          onNextQuestion={handleNextQuestion}
        />
      )}

      <div className="header">
        <IconButton className="back-button" onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <img
          src="../img/logo.svg"
          alt="Pitch perfect"
        />
      </div>
      <div className="question-analysis-grid">
        {/* Question Section */}
        <div className="question-section">
          <Typography className="question-counter">
            Question {questionData.number}/{questionData.total}
          </Typography>
          <Typography className="question-text">
            {questionData.text}
          </Typography>

          {/* Recording Controls */}
          {isRecording ? (
            <div className="recording-controls">
              <div className="waveform-container">
                <div className="audio-waveform">
                  {/* Generate bars for the waveform visualization */}
                  {Array.from({ length: 100 }, (_, i) => (
                    <div
                      key={i}
                      className="waveform-bar"
                    />
                  ))}
                </div>
                <Typography className="recording-time">0:56</Typography>
              </div>

              <div className="control-buttons">
                <Button
                  variant="contained"
                  className="control-button done-button"
                  onClick={handleDone}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : isRecordingDone ? (
            <div className="recording-controls">
              <div className="waveform-container">
                <div className="audio-waveform">
                  {/* Static waveform visualization after recording */}
                  {Array.from({ length: 100 }, (_, i) => (
                    <div
                      key={i}
                      className="waveform-bar"
                      style={{ height: `${5 + Math.sin(i * 0.2) * 15}px` }}
                    />
                  ))}
                </div>
                <Typography className="recording-time">0:56</Typography>
              </div>

              <div className="control-buttons">
                <Button
                  variant="contained"
                  className="control-button done-button"
                  onClick={handleSubmit}
                >
                  Submit
                </Button>
              </div>
            </div>
          ) : (
            <div className="start-answer-container">
              <Button
                variant="contained"
                className="start-answer-button"
                onClick={handleStartAnswer}
                startIcon={<MicIcon />}
              >
                Start answer
              </Button>
            </div>
          )}
        </div>

        {/* Analysis Section */}
        <div className="analysis-section">
          <div className="analysis-header">
            <Typography className="analysis-title">
              Analysis
            </Typography>
            <Typography className="analysis-status">
              Pending
            </Typography>
          </div>
          <Typography className="analysis-subtitle">
            The score refresh after every minute.
          </Typography>

          <div className="metrics-container">
            {/* Score Metric */}
            <div className="metric-item score-item">
              <div className="score-circle">
                <CircularProgress
                  variant="determinate"
                  value={45}
                  size={134}
                  thickness={2}
                  className="score-progress left-rotation Green"
                />
                <Typography className="score-value">
                  45
                </Typography>
              </div>
              <Typography className="metric-label">
                Pitch score
              </Typography>
            </div>

            {/* Confidence Metric */}
            <div className="metric-item confidence-item">
              <div className="confidence-bars-container">
                <div className="confidence-bar"></div>
                <div className="confidence-bar Green"></div>
                <div className="confidence-bar Yellow"></div>
                <div className="confidence-bar Yellow"></div>
                <div className="confidence-bar Red"></div>
              </div>
              <Typography className="metric-label">
                Confidence
              </Typography>
            </div>
          </div>
        </div>

        {/* Keywords Section */}
        <div className="keywords-section">
          <Typography className="keywords-title">
            Helping keywords
          </Typography>
          <Typography className="keywords-subtitle">
            Keywords help you better your score and your overall pitch, so you can sell more, more efficiently.
          </Typography>

          {isRecording || isRecordingDone ? (
            <div className="keywords-grid">
              {keywords.map((keyword, index) => (
                <div key={index} className="keyword-chip">
                  {keyword}
                </div>
              ))}
            </div>
          ) : (
            <Typography className="keywords-pending">
              Keywords will start displaying after a minute of recording
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionAnalysis;
