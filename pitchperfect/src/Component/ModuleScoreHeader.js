import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import './style/module-score-header.scss';

const ModuleScoreHeader = ({ moduleScore = 85, confidenceScore = 3 }) => {
  // Function to determine color class based on score
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'Green';
    if (score >= 50) return 'Yellow';
    return 'Red';
  };

  // Generate confidence bars based on score (1-5)
  const renderConfidenceBars = () => {
    const bars = [];
    for (let i = 0; i < 5; i++) {
      const isActive = i < confidenceScore;
      bars.push(
        <div 
          key={i} 
          className={`confidence-bar ${isActive ? getScoreColorClass(confidenceScore * 20) : ''}`}
          style={{ width: '100%' }}
        />
      );
    }
    return bars;
  };

  return (
    <Box className="module-score-header">
      <Box className="score-container">
        <Typography className="score-label">Module score:</Typography>
        <Box className="score-circle">
          <CircularProgress
            variant="determinate"
            value={100}
            size={30}
            thickness={3}
            className={`score-progress left-rotation ${getScoreColorClass(moduleScore)}`}
          />
          <Typography className="score-value">
            {moduleScore}
          </Typography>
        </Box>
      </Box>
      
      <Box className="confidence-container">
        <Typography className="score-label">Average confidence score:</Typography>
        <Box className="confidence-bars-wrapper">
          {renderConfidenceBars()}
        </Box>
      </Box>
      
      <Button
        variant="contained"
        className="start-button"
        onClick={() => {}}
      >
        Start module
      </Button>
    </Box>
  );
};

export default ModuleScoreHeader;
