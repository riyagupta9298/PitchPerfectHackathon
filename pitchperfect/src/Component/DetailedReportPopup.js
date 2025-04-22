import React from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Typography, Button } from '@mui/material';
import AudioPlayer from './AudioPlayer';
import './style/index.scss';

const DetailedReportPopup = ({ questionData, onNextQuestion }) => {
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-popup">
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

        <div className="question-details">
          <Typography className="question-number">Question {questionData.number}/{questionData.total}</Typography>
          <Typography className="question-full-text">{questionData.text}</Typography>
        </div>

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
            <Typography className="best-response-credit">Best response by Keysang Yonthan (PW37624)</Typography>
          </div>
        </div>
        <div className="question-details">

          <Typography className="question-full-text">{questionData.text}</Typography>
        </div>

      </div>
    </div>
  );
};

export default DetailedReportPopup;
