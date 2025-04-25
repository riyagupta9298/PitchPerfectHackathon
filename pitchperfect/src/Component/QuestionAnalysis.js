import React, { useState, useEffect } from 'react';
import { Typography, IconButton, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AudioRecorder from '../RecordAudio/AudioRecorder';
import ConfirmationPopup from './ConfirmationPopup';
import DetailedReportPopup from './DetailedReportPopup';
import './style/dashboard.scss';

export const getProgressColor = (score) => {
    if (score <= 2) return 'Red';
    if (score <= 6) return 'Yellow';
    return 'Green';
};


const QuestionAnalysis = ({ onBack, caseStudies, caseStudyId, onStartQuestion }) => {
    const [showKeywords, setShowKeywords] = useState(false);
    const [isRecordingDone, setIsRecordingDone] = useState(false);
    const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
    const [showDetailedReport, setShowDetailedReport] = useState(false);
    const [analysisData, setAnalysisData] = useState({
        overallScore: 0,
        confidenceScore: 0,
        nextMinuteTips: [],
        sentimentTips: [],
        keywordsToUse: []
    });

    const currentCaseStudy = caseStudies.find(item => item.CaseStudy.CaseStudyId === caseStudyId);

    const questionData = {
        number: caseStudyId,
        total: caseStudies.length,
        text: currentCaseStudy?.CaseStudy?.CaseStudyDesc || "",
        allowedTime: currentCaseStudy?.CaseStudy?.AllowedTimeToRecordInSecs || 180,
        excellentPitch: currentCaseStudy?.CaseStudy?.ExcellentPitch,
        keywords: currentCaseStudy?.CaseStudy?.KeywordsWithWeightage || [],
    };

    const handleRecordingStart = () => {
        setIsRecordingDone(false);
        setShowKeywords(false);
    };

    const handleSeeReport = () => {
        setShowSubmitConfirmation(false);
        setShowDetailedReport(true);
    };

    const handleNextQuestion = () => {
        setShowSubmitConfirmation(false);
        setShowDetailedReport(false);
        setIsRecordingDone(false);

        // Find the next case study ID
        const currentIndex = caseStudies.findIndex(item => item.CaseStudy.CaseStudyId === caseStudyId);
        const nextIndex = currentIndex + 1;

        if (nextIndex < caseStudies.length) {
            // If there's a next question, navigate to it
            const nextCaseStudyId = caseStudies[nextIndex].CaseStudy.CaseStudyId;
            onBack(); // First go back to dashboard
            setTimeout(() => {
                // Then start the next question
                onStartQuestion(nextCaseStudyId);
            }, 0);
        } else {
            // If this was the last question, just go back to dashboard
            onBack();
        }
    };

    const onAnalysisUpdate = (data) => {
        setAnalysisData(data);
    };

    useEffect(() => {
        if (analysisData && (
            analysisData.keywordsToUse?.length > 0 || 
            analysisData.nextMinuteTips?.length > 0 || 
            analysisData.sentimentTips?.length > 0
        )) {
            setShowKeywords(true);
        }
    }, [analysisData]);

    return (
        <div className="question-analysis-container">
            {/* Simple Confirmation Popup */}
            {showSubmitConfirmation && (
                <ConfirmationPopup
                    onSeeReport={handleSeeReport}
                    onNextQuestion={handleNextQuestion}
                    closeBtn={onBack}
                />
            )}

            {/* Detailed Report Popup */}
            {showDetailedReport && (
                <DetailedReportPopup
                    questionData={questionData}
                    onNextQuestion={handleNextQuestion}
                    showCloseBtn={false}
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
                        {questionData.text.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                                {line}
                                {index < questionData.text.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </Typography>

                    <AudioRecorder 
                        allowedTime={questionData.allowedTime}
                        onRecordingStart={handleRecordingStart}
                        onRecordingStop={() => setIsRecordingDone(true)}
                        onSubmit={() => setShowSubmitConfirmation(true)}
                        isRecordingDone={isRecordingDone}
                        currentCaseStudyId={caseStudyId}
                        onAnalysisUpdate={onAnalysisUpdate}
                    />
                </div>

                {/* Analysis Section */}
                <div className="analysis-section">
                    <div className="analysis-header">
                        <Typography className="analysis-title">
                            Analysis
                        </Typography>
                        <Typography className="analysis-status">
                            {isRecordingDone ? 'Completed' : 'In Progress'}
                        </Typography>
                    </div>
                    <Typography className="analysis-subtitle">
                        The score refreshes after every 30 seconds.
                    </Typography>

                    <div className="metrics-container">
                        {/* Score Metric */}
                        <div className="metric-item score-item">
                            <div className="score-circle">
                                <CircularProgress
                                    variant="determinate"
                                    value={analysisData.overallScore}
                                    size={134}
                                    thickness={2}
                                    className={`score-progress ${getProgressColor(analysisData.overallScore)}`}
                                />
                                <Typography className="score-value">
                                    {analysisData.overallScore}
                                </Typography>
                            </div>
                            <Typography className="metric-label">
                                Pitch score
                            </Typography>
                        </div>

                        {/* Confidence Metric */}
                        <div className="metric-item confidence-item">
                            <div className="confidence-bars-container">
                                <div className={`confidence-bar ${analysisData.confidenceScore > 80 ? 'Green' : ''}`} />
                                <div className={`confidence-bar ${analysisData.confidenceScore > 60 ? 'Green' : ''}`} />
                                <div className={`confidence-bar ${analysisData.confidenceScore > 40 ? 'Yellow' : ''}`} />
                                <div className={`confidence-bar ${analysisData.confidenceScore > 20 ? 'Yellow' : ''}`} />
                                <div className={`confidence-bar ${analysisData.confidenceScore > 0 ? 'Red' : ''}`} />
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
                        Suggestions
                    </Typography>
                    <Typography className="keywords-subtitle">
                        Suggestions help you better your score and your overall pitch, so you can sell more, more efficiently.
                    </Typography>

                    {showKeywords && analysisData ? (
                        <div className="keywords-container">
                             <div className="keywords-column">
                                <Typography className="column-title">
                                    Helping Keywords
                                </Typography>
                                <div className="keywords-grid">
                                    {analysisData.keywordsToUse.map((keywordItem, index) => (
                                        <div key={index} className="keyword-chip">
                                            {keywordItem}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="keywords-column">
                                <Typography className="column-title">
                                    Next Minute Tips
                                </Typography>
                                <div className="keywords-grid">
                                    {analysisData.nextMinuteTips.slice(0,2).map((tip, index) => (
                                        <div key={index} className="keyword-chip" title={tip}>
                                            {tip}
                                        </div>
                                    ))}
                                    {analysisData.sentimentTips.slice(0,2).map((tip, index) => (
                                        <div key={index} className="keyword-chip" title={tip}>
                                            {tip}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Typography className="keywords-pending">
                            Suggestions will start displaying after 30 seconds of recording
                        </Typography>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionAnalysis;
