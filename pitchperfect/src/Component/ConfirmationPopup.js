import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Typography, Button, IconButton } from '@mui/material';
import './style/dashboard.scss';

const ConfirmationPopup = ({ onSeeReport, onNextQuestion, closeBtn }) => {
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-popup-original">
        <IconButton
            aria-label="close"
            onClick={closeBtn}
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
