import React, { useRef, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Typography, Button, IconButton } from '@mui/material';
import './style/dashboard.scss';

const ConfirmationPopup = ({ onSeeReport, onNextQuestion, onClose, onGoToDashboard }) => {
  const popupRef = useRef(null);

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
      <div className="confirmation-popup-original" ref={popupRef}>
        <IconButton
          aria-label="close"
          onClick={onGoToDashboard || onClose || onNextQuestion}
          className="close-button"
          disableRipple
        >
          <CloseIcon />
        </IconButton>
        <div className="confirmation-icon">
          <CheckCircleIcon fontSize="large" />
        </div>
        <Typography className="confirmation-title">
          Response submitted
        </Typography>
        <div className="confirmation-buttons">
          <Button
            variant="outlined"
            className="report-button"
            onClick={onSeeReport}
          >
            See report
          </Button>
          <Button
            variant="contained"
            className="next-button"
            onClick={onNextQuestion}
          >
            Next question
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
