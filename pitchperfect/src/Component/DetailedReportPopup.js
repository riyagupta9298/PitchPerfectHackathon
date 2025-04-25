import React, { useRef, useEffect, useState } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import { Typography, Button, IconButton } from '@mui/material';
import AudioPlayer from './AudioPlayer';
import './style/index.scss';

const DetailedReportPopup = ({ questionData, onNextQuestion, onClose, onGoToDashboard }) => {
  const popupRef = useRef(null);
  const [showQuestionDetails, setShowQuestionDetails] = useState(true);

  const toggleQuestionDetails = () => {
    setShowQuestionDetails(!showQuestionDetails);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose ? onClose() : onNextQuestion();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, onNextQuestion]);
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-popup" ref={popupRef}>
      
        <div className="confirmation-header">
          <div className="confirmation-status">
            <CheckCircleOutlineIcon className="check-icon" />
            <Typography className="confirmation-title">
              Response submitted
            </Typography>
          </div>
          <Button
            variant="contained"
            className="next-button"
            onClick={onNextQuestion}
          >
            Next question
          </Button>
        </div>

        <div className="question-details-header" onClick={toggleQuestionDetails}>
          <Typography className="question-number">Question {questionData.number}/{questionData.total}</Typography>
          <div className="toggle-icon">
            {showQuestionDetails ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </div>
        </div>
        {showQuestionDetails && (
          <div className="question-details">
            <Typography className="question-full-text">{questionData.text}</Typography>
          </div>
        )}

        <div className="responses-container">
          <div className="response-box">
            <div className="response-header">
              <Typography className="response-title">Your response</Typography>
              <AudioPlayer showPlaybackRate={true} />
            </div>
          </div>

          <div className="response-box">
            <div className="response-header">
              <Typography className="response-title">Best response</Typography>
              <AudioPlayer showPlaybackRate={true} />
            </div>

          </div>

        </div>
        <div class="question-details"><p class="MuiTypography-root MuiTypography-body1 question-full-text css-rizt0-MuiTypography-root">Mr. Rajesh Sharma is a 35-year-old married professional residing in Mumbai. He and his spouse are both employed full-time and have recently purchased a home with a joint mortgage. They are planning to start a family soon. Mr. Sharma is seeking financial security to protect his family's future, cover outstanding debts, and ensure stability in case of unforeseen events. He values affordable insurance options that offer comprehensive coverage, including riders for critical illness and accidental death. A term insurance plan with a high claim settlement ratio and flexible premium options aligns with his priorities for safeguarding his family's financial well-being.</p></div>
      </div>
    </div>
  );
};

export default DetailedReportPopup;
