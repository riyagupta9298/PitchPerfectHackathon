
// Import necessary React hooks
import React, { useEffect, useRef, useState, useCallback } from "react";

// Define constants for fine-tuning speech recognition behavior
const RECOGNITION_SETTINGS = {
  PAUSE_THRESHOLD: 1000,      // Time in ms to wait before considering a pause in speech
  RESTART_DELAY: 300,         // Time in ms to wait before restarting recognition after an error
  MIN_CONFIDENCE: 0.5,        // Minimum confidence score to accept a recognition result
  MAX_SEGMENT_LENGTH: 200,    // Maximum length of a text segment before forcing a break
  MIN_PAUSE_DURATION: 500     // Minimum duration in ms to consider as an intentional pause
};

// Voice frequency ranges
const MIN_VALID_FREQUENCY = 50;   // Hz
const MAX_VALID_FREQUENCY = 1500; // Hz

const VOICE_RANGES = {
  BASS: { min: 80, max: 240, label: 'Bass' },
  TENOR: { min: 130, max: 400, label: 'Tenor' },
  ALTO: { min: 220, max: 660, label: 'Alto' },
  SOPRANO: { min: 260, max: 1000, label: 'Soprano' }
};

const AudioRecorder = () => {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [transcripts, setTranscripts] = useState([]);
  const [status, setStatus] = useState("");
  const [timer, setTimer] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  
  // Refs
  const recognitionRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const lastProcessedRef = useRef('');
  const accumulatedTextRef = useRef('');
  const isProcessingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const intervalRef = useRef(null);
  const audioChunks = useRef([]);
  const fullRecordingChunks = useRef([]);
  const isFirstTranscriptRef = useRef(true);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Add new refs for watchdog
  const lastResultTimestampRef = useRef(Date.now());
  const watchdogTimerRef = useRef(null);
  
  // Add watchdog constants
  const WATCHDOG_SETTINGS = {
    MAX_SILENCE_DURATION: 5000,    // Max time (ms) without results before restart
    CHECK_INTERVAL: 2000,          // How often to check for stuck recognition
  };

  // Define restartRecognition first
  const restartRecognition = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return;

    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.warn('Error stopping recognition:', e);
    }

    setTimeout(() => {
      if (isRecording && recognitionRef.current) {
        try {
          if (recognitionRef.current.state === 'ended') {
            recognitionRef.current.start();
            setStatus('Recording resumed');
          } else {
            console.log('Recognition already running, skipping restart');
          }
        } catch (e) {
          console.error('Error restarting recognition:', e);
          if (e.name === 'InvalidStateError') {
            try {
              recognitionRef.current.stop();
              setTimeout(() => {
                recognitionRef.current.start();
                console.log('Recognition restarted after force stop');
              }, 100);
            } catch (stopError) {
              console.error('Error during force restart:', stopError);
            }
          }
          setStatus('Trying to reconnect...');
        }
      }
    }, RECOGNITION_SETTINGS.RESTART_DELAY);
  }, [isRecording]);

  // Then define startWatchdogTimer
  const startWatchdogTimer = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current);
    }

    watchdogTimerRef.current = setInterval(() => {
      const timeSinceLastResult = Date.now() - lastResultTimestampRef.current;
      
      if (timeSinceLastResult > WATCHDOG_SETTINGS.MAX_SILENCE_DURATION && isRecording) {
        console.log('Recognition appears stuck, forcing restart...', new Date());
        restartRecognition();
      }
    }, WATCHDOG_SETTINGS.CHECK_INTERVAL);
  }, [isRecording, restartRecognition]);

  // Then define processTranscript
  const processTranscript = useCallback((transcript, isFinal, confidence = 0) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      // Clean transcript
      let cleanTranscript = transcript
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/^\s+|\s+$/g, '')
        .replace(/[^\w\s.,!?-]/g, '')
        .replace(/(\s*[.,!?]+\s*)/g, '$1');

      // Check for overlap with previous text
      const overlap = findSmartOverlap(lastProcessedRef.current, cleanTranscript);
      cleanTranscript = cleanTranscript.slice(overlap);

      if (isFinal) {
        // Update final transcript
        setFinalTranscript(prev => {
          const newTranscript = prev + cleanTranscript + ' ';
          lastProcessedRef.current = newTranscript;
          return newTranscript;
        });

        // Add to transcripts array with metadata
        setTranscripts(prev => [
          ...prev,
          {
            text: formatSentence(cleanTranscript),
            timestamp: Date.now(),
            confidence: confidence
          }
        ]);
      } else {
        setRealtimeTranscript(formatRealtimeText(cleanTranscript));
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // Then define handleRecognitionResult
  const handleRecognitionResult = useCallback((event) => {
    lastResultTimestampRef.current = Date.now();

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    const result = event.results[event.resultIndex];
    const transcript = result[0].transcript;
    const confidence = result[0].confidence;

    processTranscript(transcript, result.isFinal, confidence);

    pauseTimerRef.current = setTimeout(() => {
      if (realtimeTranscript) {
        processTranscript(realtimeTranscript, true, 1);
        setRealtimeTranscript('');
      }
    }, RECOGNITION_SETTINGS.PAUSE_THRESHOLD);
  }, [realtimeTranscript, processTranscript]);

  // Setup speech recognition when component mounts or recording state changes
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      setStatus('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = 'en-IN';

    let restartTimeout = null;

    recognition.onstart = () => {
      console.log('Recognition started', new Date());
      setStatus('बोलना शुरू करें... (Start speaking...)');
      lastResultTimestampRef.current = Date.now();
      startWatchdogTimer();
    };

    recognition.onresult = handleRecognitionResult;
    recognition.onerror = (event) => {
      console.error('Recognition error:', new Date(), event.error);
      setStatus(`Error: ${event.error}. कृपया पुनः प्रयास करें (Please try again)`);
      
      if (isRecording) {
        restartTimeout = setTimeout(() => restartRecognition(), RECOGNITION_SETTINGS.RESTART_DELAY);
      }
    };

    recognition.onend = () => {
      console.log('Recognition ended', new Date());
      if (isRecording) {
        restartTimeout = setTimeout(() => restartRecognition(), RECOGNITION_SETTINGS.RESTART_DELAY);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeout) clearTimeout(restartTimeout);
      if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      try {
        recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    };
  }, [isRecording, handleRecognitionResult, startWatchdogTimer, restartRecognition]);

  // Smart overlap detection
  const findSmartOverlap = (prev, current) => {
    if (!prev || !current) return 0;
    
    const words1 = prev.trim().split(' ');
    const words2 = current.trim().split(' ');
    
    let maxOverlap = 0;
    const minLength = Math.min(words1.length, words2.length);
    
    for (let i = 1; i <= minLength; i++) {
      const end1 = words1.slice(-i).join(' ');
      const start2 = words2.slice(0, i).join(' ');
      if (end1 === start2) {
        maxOverlap = start2.length;
      }
    }
    
    return maxOverlap;
  };

  // Enhanced text segmentation
  const segmentText = (text) => {
    const segments = [];
    let currentSegment = '';
    
    // Split into potential segments
    const words = text.split(/\s+/);
    
    for (const word of words) {
      currentSegment += (currentSegment ? ' ' : '') + word;
      
      // Check for natural break points
      if (
        /[.!?]+$/.test(word) ||                    // End of sentence
        currentSegment.length >= 100 ||            // Length limit
        /[,;:]$/.test(word) ||                     // Natural pause
        /^(and|but|or|so|because)$/i.test(word)    // Conjunctions
      ) {
        if (currentSegment.trim()) {
          segments.push(currentSegment.trim());
          currentSegment = '';
        }
      }
    }
    
    // Add any remaining text
    if (currentSegment.trim()) {
      segments.push(currentSegment.trim());
    }
    
    return segments;
  };

  // Format sentence with proper capitalization and spacing
  const formatSentence = (sentence) => {
    return sentence
      .trim()
      .replace(/^\w/, c => c.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Format realtime text for display
  const formatRealtimeText = (text) => {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^\w/, c => c.toUpperCase());
  };

  // Enhanced clear function
  const clearTranscripts = () => {
    setFinalTranscript('');
    setRealtimeTranscript('');
    setTranscripts([]);
    accumulatedTextRef.current = '';
    lastProcessedRef.current = '';
    isFirstTranscriptRef.current = true;
  };

  // Pitch detection setup
  const setupPitchDetection = (stream) => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);

    // Optimize analyzer settings
    analyserRef.current.fftSize = 2048; // Increased for better resolution
    analyserRef.current.smoothingTimeConstant = 0.9; // Increased smoothing
    analyserRef.current.minDecibels = -100;
    analyserRef.current.maxDecibels = -10;

    source.connect(analyserRef.current);
  };

  // Add this helper function to get voice range
  const getVoiceRange = (pitch) => {
    // Ignore rapid fluctuations
    if (pitch === 0 || pitch < MIN_VALID_FREQUENCY || pitch > MAX_VALID_FREQUENCY) {
      return { range: 'TOO_LOW', label: 'Too Low' };
    }

    // Add hysteresis to prevent rapid switching between ranges
    const hysteresis = 3; // Hz

    for (const [range, { min, max, label }] of Object.entries(VOICE_RANGES)) {
      if (pitch >= (min - hysteresis) && pitch <= (max + hysteresis)) {
        return { range, label };
      }
    }

    return pitch < VOICE_RANGES.BASS.min
      ? { range: 'TOO_LOW', label: 'Too Low' }
      : { range: 'TOO_HIGH', label: 'Too High' };
  };

  // Add this helper function for the meter color
  const getVoiceColor = (pitch) => {
    const { range } = getVoiceRange(pitch);
    const colors = {
      BASS: '#4A90E2',    // Blue
      TENOR: '#50E3C2',   // Teal
      ALTO: '#F5A623',    // Orange
      SOPRANO: '#E2495A', // Red
      TOO_LOW: '#B8B8B8', // Gray
      TOO_HIGH: '#B8B8B8' // Gray
    };
    return colors[range] || colors.TOO_LOW;
  };

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRecording]);

  // useEffect(() => {
  //   if (timer > 0 && timer % 30 === 0) {
  //     sendAudioChunk();
  //   }
  // }, [timer]);

  // Function to start recording with noise cancellation
  const startRecording = async () => {
    try {
      // Request microphone access with advanced audio settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,         // Remove echo
          noiseSuppression: true,         // Basic noise suppression
          autoGainControl: true,          // Automatic volume adjustment
          channelCount: 1,                // Mono audio for better processing
          sampleRate: 48000,              // High quality sample rate
          advanced: [{
            // Advanced noise reduction settings
            noiseSuppression: {
              ideal: true
            },
            echoCancellation: {
              ideal: true
            },
            autoGainControl: {
              ideal: true
            },
            suppressLocalAudioPlayback: true,  // Prevent feedback
            // Google Chrome specific optimizations
            googNoiseSuppression: true,
            googEchoCancellation: true,
            googAutoGainControl: true,
            googHighpassFilter: true,
            googNoiseSuppression2: true,
            googEchoCancellation2: true,
            googAutoGainControl2: true
          }]
        }
      });

      // Create audio context for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create lowpass filter to remove high frequency noise
      const lowpassFilter = audioContext.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.value = 8000;  // Cut off frequencies above 8kHz
      
      // Create highpass filter to remove low frequency noise
      const highpassFilter = audioContext.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.value = 80;   // Cut off frequencies below 80Hz

      // Create compressor to normalize volume
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -50;    // Start compression at -50dB
      compressor.knee.value = 40;          // Smooth compression curve
      compressor.ratio.value = 12;         // Compression ratio
      compressor.attack.value = 0;         // Immediate attack
      compressor.release.value = 0.25;     // Quick release

      // Connect audio processing nodes - Remove destination connection
      source
        .connect(highpassFilter)           // First remove low frequencies
        .connect(lowpassFilter)            // Then remove high frequencies
        .connect(compressor);              // Then normalize volume
        // Removed .connect(audioContext.destination) to prevent playback

      // Create media recorder with optimized settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',  // Use Opus codec for better quality
        audioBitsPerSecond: 128000           // 128kbps bitrate
      });

      // Store recorder reference
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle recorded audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000);  // Create new chunk every second
      setIsRecording(true);
      setStatus('Recording with noise cancellation enabled...');

      // Start speech recognition after short delay
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to start recognition:', e);
            setStatus('Please refresh the page and try again');
          }
        }
      }, 500);  // 500ms delay to ensure audio setup is complete

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setStatus('Microphone access error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current);
    }
    setIsRecording(false);
    setStatus("Stopped");
    setTimer(0);
  };

  const sendAudioChunk = async (onStop = false) => {
    if (audioChunks.current.length === 0) return;

    setStatus("Uploading...");
    const blob = new Blob(audioChunks.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, `chunk-${Date.now()}.webm`);

    try {
      const response = await fetch("https://localhost:44318/api/WebSiteService/UploadAudio", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setStatus(onStop ? "Final chunk uploaded ✅" : "Chunk sent ✔️");
        const result = await response.json();
        if (result.transcript) {
          setTranscripts(prev => [...prev, result.transcript]);
        }
      } else {
        setStatus("Upload failed ❌");
      }

      audioChunks.current = [];
    } catch (error) {
      console.error(error);
      setStatus("Error uploading chunk ❌");
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.mainContainer}>
        <div style={styles.recorderContainer}>
          <h2 style={styles.title}>🎙️ Real-time Audio Recorder</h2>
          <p style={styles.timer}>
            {isRecording ? `Recording... ${timer}s` : "Not recording"}
          </p>
          <p style={styles.status}>{status}</p>

        
          <div style={styles.transcriptionContainer}>
            <div style={styles.realtimeTranscript}>
              <p style={styles.transcriptTitle}>Real-time Transcript:</p>
              <div style={styles.transcriptBox}>
                <div style={styles.finalTranscript}>{finalTranscript}</div>
                <div style={styles.interimTranscript}>{realtimeTranscript}</div>
              </div>
            </div>
          </div>

          <div style={styles.buttonWrapper}>
            {!isRecording ? (
              <button style={styles.startBtn} onClick={startRecording}>
                ▶️ Start Recording
              </button>
            ) : (
              <button style={styles.stopBtn} onClick={stopRecording}>
                ⏹️ Stop & Save
              </button>
            )}
          </div>

          {downloadUrl && (
            <div style={{ marginTop: 20 }}>
              <audio controls src={downloadUrl} style={{ width: "100%" }} />
              <a href={downloadUrl} download="full-recording.webm" style={styles.downloadBtn}>
                ⬇️ Download Full Recording
              </a>
            </div>
          )}
        </div>
      </div>

      <div style={styles.fullTranscriptContainer}>
        <h3 style={styles.transcriptTitle}>Full Transcript</h3>
        <div style={styles.fullTranscriptBox}>
          {transcripts.map((transcript, index) => {
            // Handle both string and object formats for backward compatibility
            const text = typeof transcript === 'string' ? transcript : transcript.text;
            return (
              <p key={index} style={styles.transcriptLine}>
                {text}
                {typeof transcript === 'object' && (
                  <span style={styles.transcriptMeta}>
                    {new Date(transcript.timestamp).toLocaleTimeString()} 
                    {transcript.confidence > 0 && 
                      ` (${Math.round(transcript.confidence * 100)}% confidence)`
                    }
                  </span>
                )}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  mainContainer: {
    flex: '1',
    maxWidth: '600px',
  },
  recorderContainer: {
    padding: 20,
    background: "#fff",
    borderRadius: 12,
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
  },
  fullTranscriptContainer: {
    position: 'sticky',
    top: '20px',
    width: '400px',
    height: 'calc(100vh - 40px)',
    padding: '20px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  fullTranscriptBox: {
    flex: '1',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    overflowY: 'auto',
    fontSize: '14px',
    lineHeight: '1.6',
    textAlign: 'left',
    border: '1px solid #dee2e6',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 10,
  },
  timer: {
    color: "#6c757d",
    fontSize: 14,
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    color: "#0d6efd",
    marginBottom: 20,
  },
  buttonWrapper: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
  },
  startBtn: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  stopBtn: {
    backgroundColor: "#dc3545",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  downloadBtn: {
    textDecoration: "none",
    padding: "10px 20px",
    display: "inline-block",
    marginTop: 10,
    backgroundColor: "#007bff",
    color: "#fff",
    borderRadius: 6,
  },
  voiceMeter: {
    marginTop: 20,
    marginBottom: 20,
    padding: '15px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  voiceInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  pitchValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  voiceRange: {
    fontSize: '18px',
    fontWeight: '500',
    transition: 'color 0.3s ease',
  },
  meterContainer: {
    position: 'relative',
    width: '100%',
    height: '60px',
  },
  meterScale: {
    display: 'flex',
    width: '100%',
    height: '40px',
    borderRadius: '20px',
    overflow: 'hidden',
  },
  rangeSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s ease',
    position: 'relative',
    padding: '4px',
  },
  rangeLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#FFF',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
  rangeHz: {
    fontSize: '10px',
    color: '#FFF',
    opacity: 0.8,
  },
  meterPointer: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    height: '20px',
  },
  pointer: {
    position: 'absolute',
    width: '4px',
    height: '20px',
    backgroundColor: '#333',
    transform: 'translateX(-50%)',
    transition: 'left 0.2s ease, background-color 0.3s ease',
  },
  transcriptionContainer: {
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
  },
  realtimeTranscript: {
    marginBottom: 20,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 10,
    color: '#333',
  },
  transcriptBox: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    minHeight: 60,
    maxHeight: 200,
    overflowY: 'auto',
    fontSize: 14,
    lineHeight: 1.6,
    textAlign: 'left',
    border: '1px solid #dee2e6',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
  },
  finalTranscript: {
    color: '#000',
    marginBottom: 8,
  },
  interimTranscript: {
    color: '#666',
    fontStyle: 'italic',
  },
  transcriptLine: {
    margin: '8px 0',
    padding: '8px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  transcriptMeta: {
    fontSize: '12px',
    color: '#666',
    marginLeft: '8px',
    fontStyle: 'italic',
  },
};

export default AudioRecorder;
