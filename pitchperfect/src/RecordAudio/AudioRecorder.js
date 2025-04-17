// Import necessary React hooks
import React, { useEffect, useRef, useState } from "react";

// Define voice frequency ranges for different voice types (in Hertz)
const VOICE_RANGES = {
  BASS: { min: 85, max: 155, label: 'Bass' },      // Deep male voice range
  TENOR: { min: 156, max: 180, label: 'Tenor' },   // High male voice range
  ALTO: { min: 181, max: 215, label: 'Alto' },     // Low female voice range
  SOPRANO: { min: 216, max: 255, label: 'Soprano' } // High female voice range
};

// Minimum decibel level to consider as valid sound (below this is considered noise)
const NOISE_THRESHOLD = 50; // dBFS (decibels relative to full scale)

// Valid frequency range for human voice detection
const MIN_VALID_FREQUENCY = 85;   // Lowest detectable frequency
const MAX_VALID_FREQUENCY = 255;  // Highest detectable frequency

// Size of buffer for smoothing pitch measurements
const PITCH_BUFFER_SIZE = 5;      // Higher values = smoother but more latency

const RESTART_DELAY = 50; // milliseconds delay for recognition restart

const AudioRecorder = () => {
  // State for recording control
  const [isRecording, setIsRecording] = useState(false);  // Controls recording state
  const [timer, setTimer] = useState(0);                  // Tracks recording duration
  const [status, setStatus] = useState("Idle");          // Shows current recorder status
  const [downloadUrl, setDownloadUrl] = useState(null);   // URL for downloaded audio file

  // State for pitch detection
  const [pitch, setPitch] = useState(0);                  // Current detected pitch
  const [pitchBuffer, setPitchBuffer] = useState(Array(PITCH_BUFFER_SIZE).fill(0));  // Buffer for pitch smoothing

  // State for transcription
  const [realtimeTranscript, setRealtimeTranscript] = useState("");  // Current speech-to-text
  const [finalTranscript, setFinalTranscript] = useState("");        // Completed transcription
  const [transcripts, setTranscripts] = useState([]);                // Array of all transcripts
  const [interimResult, setInterimResult] = useState('');

  // Refs for maintaining values between renders
  const transcriptBufferRef = useRef("");                // Stores ongoing transcription
  const mediaRecorderRef = useRef(null);                 // Reference to MediaRecorder instance
  const audioContextRef = useRef(null);                  // Reference to AudioContext
  const analyserRef = useRef(null);                      // Reference to AnalyserNode
  const audioChunks = useRef([]);                        // Stores audio chunks for current segment
  const fullRecordingChunks = useRef([]);               // Stores all audio chunks
  const intervalRef = useRef(null);                      // Reference for timer interval
  const recognitionRef = useRef(null);                   // Reference to speech recognition
  const isFirstTranscriptRef = useRef(true);            // Flag for first transcript
  const accumulatedTextRef = useRef('');                 // Stores accumulated interim results
  const previousInterimRef = useRef('');

  // Effect for Web Speech API initialization
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();

      // Improved recognition settings
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 3;  // Get more alternatives
      recognitionRef.current.lang = 'en-IN';

      // Add watchdog timer to detect and recover from hangs
      let watchdogTimer = null;
      const WATCHDOG_TIMEOUT = 3000; // 3 seconds

      const resetWatchdog = () => {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        watchdogTimer = setTimeout(() => {
          if (isRecording) {
            console.log("Watchdog: Restarting recognition due to inactivity");
            restartRecognition();
          }
        }, WATCHDOG_TIMEOUT);
      };

      recognitionRef.current.onstart = () => {
        console.log("Recognition started");
        resetWatchdog();
      };

      recognitionRef.current.onaudiostart = () => {
        console.log("Audio capturing started");
        resetWatchdog();
      };

      recognitionRef.current.onresult = (event) => {
        resetWatchdog();
        let currentInterim = '';
        let finalText = '';

        try {
          // Process all results with improved accuracy
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;

            if (result.isFinal) {
              // Handle final results
              if (isFirstTranscriptRef.current) {
                finalText = transcript;
                isFirstTranscriptRef.current = false;
              } else {
                // Ensure smooth connection with previous text
                const prevText = accumulatedTextRef.current;
                const overlap = findOverlap(prevText, transcript);
                finalText = prevText + transcript.slice(overlap);
              }

              accumulatedTextRef.current = finalText;
              previousInterimRef.current = '';

              // Split into sentences more accurately
              const sentences = finalText.match(/[^.!?]+[.!?]+/g) || [];
              if (sentences.length > 0) {
                sentences.forEach(sentence => {
                  const cleanSentence = sentence.trim();
                  if (cleanSentence && cleanSentence.length > 5) { // Minimum length check
                    setTranscripts(prev => [...prev, cleanSentence]);
                  }
                });
                
                // Keep remaining text that's not a complete sentence
                const remainingText = finalText.replace(/[^.!?]+[.!?]+/g, '').trim();
                accumulatedTextRef.current = remainingText + ' ';
              }

              setFinalTranscript(finalText);
            } else {
              // Handle interim results
              const confidence = result[0].confidence;
              if (confidence > 0.7) { // Only use high-confidence interim results
                currentInterim = transcript;
                
                // Smooth connection with previous interim
                if (previousInterimRef.current) {
                  const overlap = findOverlap(previousInterimRef.current, currentInterim);
                  currentInterim = currentInterim.slice(overlap);
                }
                
                previousInterimRef.current = currentInterim;
              }
            }
          }

          setRealtimeTranscript(currentInterim);
          setInterimResult(currentInterim);

        } catch (error) {
          console.error("Error processing speech result:", error);
          restartRecognition();
        }
      };

      // Enhanced error handling
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'network':
            setStatus("Network error - retrying...");
            setTimeout(restartRecognition, RESTART_DELAY);
            break;
          case 'audio-capture':
            setStatus("Audio capture error - retrying...");
            setTimeout(restartRecognition, RESTART_DELAY);
            break;
          case 'no-speech':
            setStatus("No speech detected - continuing...");
            restartRecognition();
            break;
          case 'aborted':
            if (isRecording) {
              setStatus("Recognition aborted - restarting...");
              restartRecognition();
            }
            break;
          default:
            if (isRecording) {
              setStatus("Error occurred - restarting...");
              restartRecognition();
            }
        }
      };

      // Improved restart handling
      recognitionRef.current.onend = () => {
        if (isRecording) {
          setTimeout(() => {
            if (isRecording) {
              recognitionRef.current.start();
            }
          }, RESTART_DELAY);
        }
      };

      return () => {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, [isRecording]);

  // Helper function to find overlap between strings
  const findOverlap = (str1, str2) => {
    if (!str1 || !str2) return 0;
    
    const words1 = str1.trim().split(' ');
    const words2 = str2.trim().split(' ');
    
    let overlap = 0;
    const minLength = Math.min(words1.length, words2.length);
    
    for (let i = 1; i <= minLength; i++) {
      const end1 = words1.slice(-i).join(' ');
      const start2 = words2.slice(0, i).join(' ');
      if (end1 === start2) {
        overlap = start2.length;
      }
    }
    
    return overlap;
  };

  // Enhanced clear function
  const clearTranscripts = () => {
    setFinalTranscript('');
    setRealtimeTranscript('');
    setInterimResult('');
    setTranscripts([]);
    accumulatedTextRef.current = '';
    previousInterimRef.current = '';
    isFirstTranscriptRef.current = true;
  };

  // Restart recognition function with error handling
  const restartRecognition = () => {
    if (!recognitionRef.current || !isRecording) return;

    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.log("Error stopping recognition:", e);
    }

    try {
      setTimeout(() => {
        if (isRecording) {
          recognitionRef.current.start();
        }
      }, 100);
    } catch (e) {
      console.log("Error starting recognition:", e);
      // If start fails, try one more time after a longer delay
      setTimeout(() => {
        if (isRecording) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error("Final attempt to restart recognition failed:", error);
            setStatus("Recognition failed - please stop and start again");
          }
        }
      }, 1000);
    }
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

    const detectPitch = () => {
      if (!isRecording) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      analyserRef.current.getFloatFrequencyData(dataArray);

      // Find peaks in the frequency data
      const peaks = findPeaks(dataArray);

      // Get the most prominent frequency
      const dominantFreq = getDominantFrequency(peaks, dataArray, audioContextRef.current.sampleRate);

      if (dominantFreq) {
        // Update pitch buffer with new value
        setPitchBuffer(prev => {
          const newBuffer = [...prev.slice(1), dominantFreq];

          // Calculate median from buffer to reduce jitter
          const medianPitch = calculateMedian(newBuffer);

          // Only update pitch if it's a significant change
          if (Math.abs(medianPitch - pitch) > 5) {
            setPitch(medianPitch);
          }

          return newBuffer;
        });
      }

      requestAnimationFrame(detectPitch);
    };

    detectPitch();
  };

  // Helper function to find peaks in frequency data
  const findPeaks = (dataArray) => {
    const peaks = [];
    const sampleRate = audioContextRef.current.sampleRate;
    const binSize = sampleRate / (dataArray.length * 2);

    for (let i = 1; i < dataArray.length - 1; i++) {
      const freq = i * binSize;

      // Only consider frequencies in human voice range
      if (freq < MIN_VALID_FREQUENCY || freq > MAX_VALID_FREQUENCY) continue;

      // Check if this point is a peak
      if (dataArray[i] > NOISE_THRESHOLD &&
        dataArray[i] > dataArray[i - 1] &&
        dataArray[i] > dataArray[i + 1]) {
        peaks.push({
          index: i,
          magnitude: dataArray[i],
          frequency: freq
        });
      }
    }

    return peaks;
  };

  // Helper function to get the dominant frequency
  const getDominantFrequency = (peaks, dataArray, sampleRate) => {
    if (peaks.length === 0) return null;

    // Sort peaks by magnitude
    peaks.sort((a, b) => b.magnitude - a.magnitude);

    // Get the strongest peak
    const dominantPeak = peaks[0];

    // Perform quadratic interpolation for more accurate frequency
    const alpha = dataArray[dominantPeak.index - 1];
    const beta = dataArray[dominantPeak.index];
    const gamma = dataArray[dominantPeak.index + 1];
    const correction = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);

    const interpolatedIndex = dominantPeak.index + correction;
    const frequency = Math.round(interpolatedIndex * sampleRate / (dataArray.length * 2));

    // Validate frequency
    if (frequency >= MIN_VALID_FREQUENCY && frequency <= MAX_VALID_FREQUENCY) {
      return frequency;
    }

    return null;
  };

  // Helper function to calculate median
  const calculateMedian = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
    }

    return Math.round(sorted[middle]);
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

  useEffect(() => {
    if (timer > 0 && timer % 30 === 0) {
      sendAudioChunk();
    }
  }, [timer]);

  const startRecording = async () => {
    try {
      setDownloadUrl(null);
      clearTranscripts();
      fullRecordingChunks.current = [];
      audioChunks.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      setupPitchDetection(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
          fullRecordingChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        sendAudioChunk(true);
        const fullBlob = new Blob(fullRecordingChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(fullBlob);
        setDownloadUrl(url);

        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.log("Error stopping recognition on recorder stop:", e);
          }
        }
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setStatus("Recording...");
      setTimer(0);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Error starting initial recognition:", e);
          setTimeout(() => {
            if (isRecording) {
              recognitionRef.current.start();
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatus("Error starting recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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

          {isRecording && (
            <div style={styles.voiceMeter}>
              <div style={styles.voiceInfo}>
                <span style={styles.pitchValue}>{pitch} Hz</span>
                <span style={{
                  ...styles.voiceRange,
                  color: getVoiceColor(pitch)
                }}>
                  {getVoiceRange(pitch).label}
                </span>
              </div>

              <div style={styles.meterContainer}>
                <div style={styles.meterScale}>
                  {Object.entries(VOICE_RANGES).map(([range, { min, max, label }]) => (
                    <div
                      key={range}
                      style={{
                        ...styles.rangeSection,
                        backgroundColor: pitch >= min && pitch <= max ? getVoiceColor(pitch) : '#E0E0E0',
                        width: `${((max - min) / (255 - 85)) * 100}%`
                      }}
                    >
                      <span style={styles.rangeLabel}>{label}</span>
                      <span style={styles.rangeHz}>{min}-{max}Hz</span>
                    </div>
                  ))}
                </div>

                <div style={styles.meterPointer}>
                  <div
                    style={{
                      ...styles.pointer,
                      left: `${((pitch - 85) / (255 - 85)) * 100}%`,
                      backgroundColor: getVoiceColor(pitch)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

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
          {transcripts.map((text, index) => (
            <p key={index} style={styles.transcriptLine}>{text}</p>
          ))}
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
  // ... (keep all existing styles)
  
  // Update existing transcriptLine style
  transcriptLine: {
    margin: '8px 0',
    padding: '8px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  
  // Update existing container style to remove the margin
  container: {
    padding: 20,
    background: "#fff",
    borderRadius: 12,
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
  },
};

export default AudioRecorder;
