import React, { useEffect, useRef, useState } from "react";
import { Button, Typography, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import dayjs from './dayjs';
import axios from 'axios';

const AudioRecorder = (props) => {
    const { allowedTime, onRecordingStart, onRecordingStop, onSubmit, isRecordingDone, currentCaseStudyId, onAnalysisUpdate } = props;

    const [isRecording, setIsRecording] = useState(false);
    const [remainingTime, setRemainingTime] = useState(allowedTime);
    const [isSendingFinal, setIsSendingFinal] = useState(false);

    const audioContextRef = useRef(null);
    const streamRef = useRef(null);
    const processorRef = useRef(null);
    const sourceRef = useRef(null);
    const timerRef = useRef(null);
    const audioChunks = useRef([]);
    const finalAudioChunks = useRef([]);

    useEffect(() => {
        setRemainingTime(allowedTime);
    }, [allowedTime]);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRemainingTime(prev => {
                    const newTime = prev - 1;

                    if (newTime <= 0) {
                        handleStopRecording();
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRecording]);

    useEffect(() => {
        if (isRecording && remainingTime > 0 && remainingTime % 20 === 0 && allowedTime !== remainingTime) {
            sendAudioChunk();
            audioChunks.current = [];
        }
    }, [remainingTime, isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 8000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            source.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0);
                const audioData = new Float32Array(input);
                audioChunks.current.push(audioData);
                finalAudioChunks.current.push(audioData);
            };

            setIsRecording(true);
            setRemainingTime(allowedTime);
            onRecordingStart();
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };

    const handleStopRecording = async () => {
        try {
            setIsSendingFinal(true);
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            if (processorRef.current && processorRef.current.numberOfOutputs > 0) {
                processorRef.current.disconnect();
            }

            if (sourceRef.current && sourceRef.current.numberOfOutputs > 0) {
                sourceRef.current.disconnect();
            }

            onRecordingStop();

            try {
                await sendAudioChunk(true);
            } catch (error) {
                console.error('Error sending final audio chunk:', error);
            }

            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                await audioContextRef.current.close();
            }

            audioChunks.current = [];
            finalAudioChunks.current = [];

            setIsSendingFinal(false);
        } catch (error) {
            console.error('Error in handleStopRecording:', error);
            setIsSendingFinal(false);
        }
    };

    const sendAudioChunk = async (isFinal = false) => {
        const chunksToSend = audioChunks.current;

        if (chunksToSend.length === 0) return;

        const chunk = flattenBuffers(chunksToSend);
        const wavBlob = encodeWAV(chunk, 8000, 1);

        const formData = new FormData();
        formData.append("file", wavBlob, `chunk-${Date.now()}.wav`);
        formData.append("UserID", "91227");
        formData.append("CaseStudyID", currentCaseStudyId);
        formData.append("ElapsedTime", allowedTime - remainingTime);
        formData.append("IsSpeechEnded", isFinal.toString());

        if(isFinal) {
            const finalChunk = flattenBuffers(finalAudioChunks.current);
            const wavBlob = encodeWAV(finalChunk, 8000, 1);
            formData.append("Finalfile", wavBlob, `finalchunk-${Date.now()}.wav`);
        }

        try {
            const response = await axios({
                method: 'post',
                url: 'https://qainternalmatrixapi.policybazaar.com/api/WebSiteService/AnalyseAgentSpeech',
                data: formData,
                headers: {
                    'source': 'matrix',
                    'authKey': 'LGsaWLYmF6YWNav',
                    'clientKey': 'L6YWNav',
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000
            });
            if (response.data?.Status && response.data?.Data?.IsSuccess && response.data.Data.Data) {
                if(!isFinal) {
                    const analysisData = response.data.Data.Data;
                    onAnalysisUpdate({
                        overallScore: analysisData.OverallScore,
                        confidenceScore: analysisData.ConfidenceScore,
                        nextMinuteTips: analysisData.NextMinuteTips,
                        sentimentTips: analysisData.SentimentTips,
                        keywordsToUse: analysisData.KeywordsToUse
                    });
                }
            }

            if (!isFinal) {
                audioChunks.current = [];
            }
        } catch (error) {
            console.error('Error analysing speech:', error);
        }
    };

    function flattenBuffers(buffers) {
        const length = buffers.reduce((acc, cur) => acc + cur.length, 0);
        const result = new Float32Array(length);
        let offset = 0;
        for (let buf of buffers) {
            result.set(buf, offset);
            offset += buf.length;
        }
        return result;
    }

    function encodeWAV(samples, sampleRate, numChannels) {
        function floatTo16BitPCM(output, offset, input) {
            for (let i = 0; i < input.length; i++, offset += 2) {
                let s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        }
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        view.setUint32(0, 0x52494646, false);
        view.setUint32(4, 36 + samples.length * 2, true);
        view.setUint32(8, 0x57415645, false);
        view.setUint32(12, 0x666d7420, false);
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        view.setUint32(36, 0x64617461, false);
        view.setUint32(40, samples.length * 2, true);
        floatTo16BitPCM(view, 44, samples);
        return new Blob([view], { type: 'audio/wav' });
    }

    return (
        isRecording || isRecordingDone ? (
            <div className="recording-controls">
                <div className="waveform-container">
                    <div className="audio-waveform">
                        {Array.from({ length: 100 }, (_, i) => (
                            <div
                                key={i}
                                className={`waveform-bar ${isRecordingDone ? 'static-wave' : ''}`}
                            />
                        ))}
                    </div>
                    <Typography className="recording-time">
                        {dayjs().startOf('day').add(remainingTime, 'second').format('m:ss')}
                    </Typography>
                </div>

                <div className="control-buttons">
                    <Button
                        variant="contained"
                        className={`control-button done-button`}
                        onClick={isRecording ? handleStopRecording : onSubmit}
                        disabled={isSendingFinal}
                    >
                        {isRecording ? 'Done' : 'Submit'}
                    </Button>
                </div>
            </div>
        ) : (
            <div className="start-answer-container">
                <Button
                    variant="contained"
                    className="start-answer-button"
                    onClick={startRecording}
                    startIcon={<MicIcon />}
                >
                    Start answer
                </Button>
            </div>
        )
    );
};

export default AudioRecorder;
