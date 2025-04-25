import React, { useState, useEffect } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Typography, Button } from '@mui/material';
import AudioPlayer from './AudioPlayer';
import axios from 'axios';
import './style/index.scss';

const DetailedReportPopup = ({ questionData, onNextQuestion, showCloseBtn }) => {
  const [bestResponseAudio, setBestResponseAudio] = useState(null);
  const [userResponseAudio, setUserResponseAudio] = useState(null);
  const [caseStudyData, setCaseStudyData] = useState(null);
  const [showQuestionDetails, setShowQuestionDetails] = useState(true);

  useEffect(() => {
    const fetchCaseStudyData = async () => {
      try {
        const response = await axios.get(
          'https://qainternalmatrixapi.policybazaar.com/api/WebSiteService/GetPitchPerfectCaseStudies',
          {
            params: {
              UserID: '91227',
              ProductID: '7'
            },
            headers: {
              'source': 'matrix',
              'authKey': 'LGsaWLYmF6YWNav',
              'clientKey': 'L6YWNav'
            }
          }
        );

        if (response.data?.Status && Array.isArray(response.data.Data)) {
          const currentCaseStudy = response.data.Data.find(
            item => item.CaseStudy.CaseStudyId === questionData.number
          );

          if (currentCaseStudy) {
            setCaseStudyData(currentCaseStudy);
            if (currentCaseStudy.CaseStudy.ExcellentPitch) {
              fetchAudio(currentCaseStudy.CaseStudy.ExcellentPitch, setBestResponseAudio);
            }
            if (currentCaseStudy.IsAttempted && currentCaseStudy.UserResponse?.AudioFileId) {
              fetchAudio(currentCaseStudy.UserResponse.AudioFileId, setUserResponseAudio);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching case studies:', error);
      }
    };

    fetchCaseStudyData();
  }, [questionData.number]);


  const toggleQuestionDetails = () => {
    setShowQuestionDetails(!showQuestionDetails);
  };

  const fetchAudio = async (audioId, setAudioCallback) => {
    try {
      const response = await axios({
        method: 'GET',
        url: `https://qainternalmatrixapi.policybazaar.com/api/WebSiteService/GetAudio/${audioId}`,
        headers: {
          'source': 'matrix',
          'authKey': 'LGsaWLYmF6YWNav',
          'clientKey': 'L6YWNav',
        },
        responseType: 'blob'
      });

      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioCallback(audioUrl);
    } catch (error) {
      console.error('Error fetching audio:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (bestResponseAudio) {
        URL.revokeObjectURL(bestResponseAudio);
      }
      if (userResponseAudio) {
        URL.revokeObjectURL(userResponseAudio);
      }
    };
  }, [bestResponseAudio, userResponseAudio]);

  const hasNextQuestion = questionData.number < questionData.total;

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
          <div className="button-group">
              {hasNextQuestion && !showCloseBtn && (
                <Button
                  variant="contained"
                  className="next-button"
                  onClick={onNextQuestion}
                >
                  Next question
                </Button>
              )}
            <Button
              variant="outlined"
              className="close-button"
              onClick={onNextQuestion}
            >
              Close
            </Button>
          </div>
        </div>

        <div className="question-details-header" onClick={toggleQuestionDetails}>
          <Typography className="question-number">
            Question {questionData.number}/{questionData.total}
          </Typography>
          <div className="toggle-icon">
            {showQuestionDetails ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </div>
        </div>
        {showQuestionDetails && (
          <div className="question-details">
            <div className="question-text">
              {questionData.text.split('\n').map((line, index) => (
                line.trim() ? (
                  <Typography key={index} component="p" className="question-paragraph">
                    {line}
                  </Typography>
                ) : null
              ))}
            </div>
          </div>
        )}

        <div className="responses-container">
          <div className="response-box">
            <div className="response-header">
              <Typography className="response-title">Your response</Typography>
              <AudioPlayer
                showPlaybackRate={true}
                audioSrc={userResponseAudio}
              />
            </div>
          </div>

          <div className="response-box">
            <div className="response-header">
              <Typography className="response-title">Best response</Typography>
              <AudioPlayer
                showPlaybackRate={true}
                audioSrc={bestResponseAudio}
              />
            </div>
          </div>
        </div>
        {caseStudyData?.UserResponse?.AnalysisReport?.Data?.Data &&
          <div className="analysis-report-section">
            <div className="analysis-header-section">
              <div className="header-content">
                <Typography className="analysis-title">Performance Analysis</Typography>
                <div className="scores-container">
                  <div className="score-item">
                    <div className="score-circle">
                      <Typography className="score-value">{caseStudyData.UserResponse.AnalysisReport.Data.Data.OverallScore}</Typography>
                    </div>
                    <Typography className="score-label">Overall</Typography>
                  </div>
                  <div className="score-item">
                    <div className="score-circle">
                      <Typography className="score-value">{caseStudyData.UserResponse.AnalysisReport.Data.Data.ConfidenceScore}</Typography>
                    </div>
                    <Typography className="score-label">Confidence</Typography>
                  </div>
                </div>
              </div>
            </div>

            <div className="analysis-content">
              <div className="analysis-section">
                <Typography className="section-title">Case Study Handling</Typography>
                <ul className="analysis-list">
                  <li>{caseStudyData.UserResponse.AnalysisReport.Data.Data.CaseStudyHandling}</li>
                </ul>
              </div>

              <div className="analysis-section">
                <Typography className="section-title">Keyword Usage Analysis</Typography>
                <ul className="analysis-list">
                  <li>{caseStudyData.UserResponse.AnalysisReport.Data.Data.KeywordUsageAnalysis}</li>
                </ul>
              </div>

              <div className="analysis-section">
                <Typography className="section-title">Improvement Suggestions</Typography>
                <ul className="analysis-list">
                  {caseStudyData.UserResponse.AnalysisReport.Data.Data.ImprovementSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              <div className="analysis-section">
                <Typography className="section-title">Concern Areas</Typography>
                <ul className="analysis-list">
                  {caseStudyData.UserResponse.AnalysisReport.Data.Data.ConcernAreas.map((concern, index) => (
                    <li key={index}>{concern}</li>
                  ))}
                </ul>
              </div>

              <div className="analysis-section">
                <Typography className="section-title">Sentiment Analysis</Typography>
                <ul className="analysis-list">
                  <li>{caseStudyData.UserResponse.AnalysisReport.Data.Data.SentimentAnalysis}</li>
                </ul>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  );
};

export default DetailedReportPopup;
