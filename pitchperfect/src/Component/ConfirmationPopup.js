import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Typography, Button } from '@mui/material';
import './style/dashboard.scss';

const ConfirmationPopup = ({ onSeeReport, onNextQuestion }) => {
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-popup-original">
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
