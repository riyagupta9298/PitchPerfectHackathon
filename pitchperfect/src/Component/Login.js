import React, { useState, useEffect } from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import "./style/login.scss";
import Dashboard from "./Dashboard";
import QuestionAnalysis from "./QuestionAnalysis";

const pageview = {
    LOGIN       : "LOGIN",
    DASHBOARD   : "DASHBOARD",            
    QUESTION    : "QUESTION"
}

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [currentView, setCurrentView] = useState(() => {
        return localStorage.getItem('currentView') || pageview.LOGIN;
    });
    const [caseStudies, setCaseStudies] = useState([]);
    const [selectedCaseStudyId, setSelectedCaseStudyId] = useState(null);
    const [formData, setFormData] = useState({
        employeeId: "",
        password: "",
    });

    const handleStartQuestion = (caseStudyId) => {
        setSelectedCaseStudyId(caseStudyId);
        setCurrentView(pageview.QUESTION);
    };

    useEffect(() => {
        localStorage.setItem('currentView', currentView);
    }, [currentView]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (formData.employeeId === "" || formData.password === "") {
            return;
        } else {
            setCurrentView(pageview.DASHBOARD);
        }
    };

    return (
        <>
            {currentView === pageview.LOGIN && (
                <div className="login-container">
                    <div className="login-header fade-in">
                        <img
                            src="../img/logo.svg"
                            alt="Pitch perfect"
                            className="login-header__logo"
                        />

                        <h1 className="login-header__title">Welcome to Pitch perfect</h1>
                        <p className="login-header__subtitle">
                            A tool to help you analyze and improve your pitch, to help you
                            sell better
                        </p>
                    </div>

                    <form className="login-form fade-in" onSubmit={handleSubmit}>
                        <div className="login-form__field">
                            <label className="login-form__field__label">Employee ID</label>
                            <TextField
                                fullWidth
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </div>

                        <div className="login-form__field mb">
                            <label className="login-form__field__label">Password</label>
                            <TextField
                                fullWidth
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="login-form__forgot-password">
                            <a href="#forgot-password">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            className="login-form__submit-button"
                            disabled={!formData.employeeId || !formData.password}
                        >
                            Log in
                        </button>
                    </form>
                </div>
            )}

            {currentView === pageview.DASHBOARD && (
                <Dashboard 
                    onStartQuestion={handleStartQuestion}
                    caseStudies={caseStudies}
                    setCaseStudies={setCaseStudies}
                />
            )}

            {currentView === pageview.QUESTION && (
                <QuestionAnalysis 
                    onBack={() => setCurrentView(pageview.DASHBOARD)}
                    onStartQuestion={(id) => handleStartQuestion(id)}
                    caseStudies={caseStudies}
                    caseStudyId={selectedCaseStudyId}
                />
            )}
        </>
    );
};

export default Login;
