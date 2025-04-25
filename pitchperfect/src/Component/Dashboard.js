import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import InstructionsDialog from './InstructionsDialog';
import './style/index.scss';
import DetailedReportPopup from './DetailedReportPopup';
import { getProgressColor } from './QuestionAnalysis';

const getFirstUnattemptedCaseStudyId = (caseStudies) => {
    const firstUnattempted = caseStudies.find(q => !q.IsAttempted);
    return firstUnattempted?.CaseStudy?.CaseStudyId;
};

const Dashboard = ({ onStartQuestion, caseStudies, setCaseStudies }) => {
    const [attemptedCount, setAttemptedCount] = useState(0);
    const [openInstructionsDialog, setOpenInstructionsDialog] = useState(false);
    const [showDetailedReport, setShowDetailedReport] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [overallModuleScore, setOverallModuleScore] = useState(0);
    const [overallConfidenceScore, setOverallConfidenceScore] = useState(0);
    const [pendingCaseStudyId, setPendingCaseStudyId] = useState(null);

    useEffect(() => {
        fetchCaseStudies();
    }, []);

    useEffect(() => {
        const attempted = caseStudies.filter(q => q.IsAttempted).length;
        setAttemptedCount(attempted);

        // Calculate average scores when all questions are attempted
        if (attempted === caseStudies.length && caseStudies.length > 0) {
            const scores = caseStudies.map(q => q.UserResponse?.AnalysisReport?.Data?.Data?.OverallScore || 0);
            const confidenceScores = caseStudies.map(q => q.UserResponse?.AnalysisReport?.Data?.Data?.ConfidenceScore || 0);
            
            const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            const avgConfidence = Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length);
            
            setOverallModuleScore(avgScore);
            setOverallConfidenceScore(avgConfidence);
        }
    }, [caseStudies]);

    // Add a computed value for all questions attempted
    const isModuleCompleted = attemptedCount === caseStudies.length && caseStudies.length > 0;

    const fetchCaseStudies = async () => {
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

            if (response.data.Status) {
                if(Array.isArray(response.data.Data) && response.data.Data.length > 0) {
                    setCaseStudies(response.data.Data);
                }
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    const getNextUnattemptedCaseStudy = () => {
        return caseStudies.find(q => !q.IsAttempted)?.CaseStudy?.CaseStudyId;
    };

    const handleQuestionClick = (caseStudyItem) => {
        if (caseStudyItem.IsAttempted) {
            // For attempted questions, show the report
            setSelectedQuestion({
                number: caseStudyItem.CaseStudy.CaseStudyId,
                total: caseStudies.length,
                text: caseStudyItem.CaseStudy.CaseStudyDesc
            });
            setShowDetailedReport(true);
        } else {
            // For unattempted questions, show instructions first
            setPendingCaseStudyId(caseStudyItem.CaseStudy.CaseStudyId);
            setOpenInstructionsDialog(true);
        }
    };

    const handleCloseReport = () => {
        setShowDetailedReport(false);
        setSelectedQuestion(null);
    };

    const handleStartModule = () => {
        // If there's a pending case study, start that specific one
        if (pendingCaseStudyId) {
            onStartQuestion(pendingCaseStudyId);
            setPendingCaseStudyId(null);
        } else {
            // Otherwise, find the first unattempted case study (original behavior)
            const firstUnattemptedId = getFirstUnattemptedCaseStudyId(caseStudies);
            if (firstUnattemptedId) {
                onStartQuestion(firstUnattemptedId);
            }
        }
        setOpenInstructionsDialog(false);
    };

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
                                Solve the case studies to gain actionable insights and connect with customers more <b>efficiently</b> and effectively
                            </Typography>
                            <Box className="module-score-footer">
                                {isModuleCompleted && 
                                    <Box className="scores-container">
                                        <Box className="score-item">
                                            <Typography className="score-label">Your average score:</Typography>
                                            <Box className="score-circle">
                                                <CircularProgress
                                                    variant="determinate"
                                                    value={overallModuleScore}
                                                    size={45}
                                                    thickness={4}
                                                    className={`score-progress ${getProgressColor(overallModuleScore)}`}
                                                />
                                                <Typography className="score-value">
                                                    {overallModuleScore}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box className="score-item">
                                            <Typography className="score-label">Your confidence score:</Typography>
                                            <Box className="confidence-bars-container">
                                                <div className={`confidence-bar ${overallConfidenceScore > 80 ? 'Green' : ''}`} />
                                                <div className={`confidence-bar ${overallConfidenceScore > 60 ? 'Green' : ''}`} />
                                                <div className={`confidence-bar ${overallConfidenceScore > 40 ? 'Yellow' : ''}`} />
                                                <div className={`confidence-bar ${overallConfidenceScore > 20 ? 'Yellow' : ''}`} />
                                                <div className={`confidence-bar ${overallConfidenceScore > 0 ? 'Red' : ''}`} />
                                            </Box>
                                        </Box>
                                    </Box>
                                }
                                <Button
                                    variant="contained"
                                    className={`start-button ${isModuleCompleted ? 'completed' : ''}`}
                                    onClick={() => setOpenInstructionsDialog(true)}
                                    disabled={isModuleCompleted}
                                >
                                    {isModuleCompleted ? 'Completed' : 'Start module'}
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
                        <Typography className="counter">
                            {attemptedCount}/{caseStudies.length} unlocked
                        </Typography>
                    </Box>
                    <Box className="questions-list animate-in">
                        {caseStudies.map((caseStudyItem) => {
                            const isNextUnattempted = caseStudyItem.CaseStudy.CaseStudyId === getNextUnattemptedCaseStudy();
                            
                            return (
                                <Box 
                                    key={caseStudyItem.CaseStudy.CaseStudyId} 
                                    className={`question-item ${caseStudyItem.IsAttempted || isNextUnattempted ? 'active' : 'disabled'}`}
                                >
                                    <Typography className="question-text">
                                        {caseStudyItem.CaseStudy.CaseStudyDesc}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        className="attempt-button"
                                        onClick={() => handleQuestionClick(caseStudyItem)}
                                        disabled={!caseStudyItem.IsAttempted && !isNextUnattempted}
                                    >
                                        {caseStudyItem.IsAttempted ? 'See report' : 'Attempt this'}
                                    </Button>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
            
            {/* Instructions Dialog */}
            <InstructionsDialog
                open={openInstructionsDialog}
                onClose={() => {
                    setOpenInstructionsDialog(false);
                    setPendingCaseStudyId(null);
                }}
                onStart={handleStartModule}
            />

            {/* Detailed Report Dialog */}
            {showDetailedReport && selectedQuestion && (
                <DetailedReportPopup
                    questionData={selectedQuestion}
                    onNextQuestion={handleCloseReport}
                    showCloseBtn={true}
                />
            )}
        </div>
    );
};

export default Dashboard;
