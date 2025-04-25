import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import HeadsetIcon from '@mui/icons-material/Headset';
import WifiIcon from '@mui/icons-material/Wifi';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import './style/index.scss';

const InstructionsDialog = ({ open, onClose, onStart }) => {
    const [hasMicPermission, setHasMicPermission] = useState(false);

    useEffect(() => {
        checkMicPermission();
    }, [open]);

    const checkMicPermission = async () => {
        try {
            navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                setHasMicPermission(true);
            })
            .catch(function (err) {
                setHasMicPermission(false);
            });
        } catch (err) {
            setHasMicPermission(false);
        }
    };

    const handleStart = () => {
        if (hasMicPermission) {
            onClose();
            onStart();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            className="instructions-dialog"
        >
            <DialogTitle className="dialog-title">
                Instructions before beginning
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    className="close-button"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box className="instruction-item">
                    <Box className="icon-container">
                        <MicIcon 
                            className = {hasMicPermission ? "icon-active" : "icon-red"}
                        />
                    </Box>
                    <Box className="instruction-content">
                        <Typography variant="h6" className="instruction-title">
                            Microphone is mandatory
                        </Typography>
                        <Typography variant="body2" className="instruction-description">
                            Sit close to about 6-12 inches from the microphone for clear audio.
                        </Typography>
                        {!hasMicPermission && (
                            <Typography 
                                variant="body2" 
                                className="permission-warning"
                            >
                                Please allow microphone to start module
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box className="instruction-item">
                    <Box className="icon-container">
                        <HeadsetIcon className="icon" />
                    </Box>
                    <Box className="instruction-content">
                        <Typography variant="h6" className="instruction-title">
                            Test Your Equipment
                        </Typography>
                        <Typography variant="body2" className="instruction-description">
                            Make sure your mic is working properly.
                        </Typography>
                    </Box>
                </Box>

                <Box className="instruction-item">
                    <Box className="icon-container">
                        <WifiIcon className="icon" />
                    </Box>
                    <Box className="instruction-content">
                        <Typography variant="h6" className="instruction-title">
                            Check Your Internet Connection
                        </Typography>
                        <Typography variant="body2" className="instruction-description">
                            A stable internet connection ensures uninterrupted process.
                        </Typography>
                    </Box>
                </Box>

                <Box className="instruction-item">
                    <Box className="icon-container">
                        <VolumeOffIcon className="icon" />
                    </Box>
                    <Box className="instruction-content">
                        <Typography variant="h6" className="instruction-title">
                            Find a Quiet Space
                        </Typography>
                        <Typography variant="body2" className="instruction-description">
                            Sit in a quiet environment before starting the module.
                        </Typography>
                    </Box>
                </Box>

                <Box className="instruction-item">
                    <Box className="icon-container">
                        <RecordVoiceOverIcon className="icon" />
                    </Box>
                    <Box className="instruction-content">
                        <Typography variant="h6" className="instruction-title">
                            Speak Clearly and at a Moderate Pace
                        </Typography>
                        <Typography variant="body2" className="instruction-description">
                            This helps the system understand your responses better.
                        </Typography>
                    </Box>
                </Box>

                <Box className="button-container">
                    <Button
                        variant="contained"
                        onClick={handleStart}
                        className="start-dialog-button"
                        disabled={!hasMicPermission}
                        sx={{
                            opacity: !hasMicPermission ? 0.5 : 1,
                            '&.Mui-disabled': {
                                backgroundColor: '#666',
                                color: '#fff'
                            }
                        }}
                    >
                        Let's start
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default InstructionsDialog;
