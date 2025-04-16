import React, { useEffect, useRef, useState } from "react";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState("Idle");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const fullRecordingChunks = useRef([]);
  const intervalRef = useRef(null);
  const [transcripts, setTranscripts] = useState([]);

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
    setDownloadUrl(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
        fullRecordingChunks.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      sendAudioChunk(true);
      const fullBlob = new Blob(fullRecordingChunks.current, {
        type: "audio/webm",
      });
      const url = URL.createObjectURL(fullBlob);
      setDownloadUrl(url);
    };

    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setStatus("Recording...");
    setTimer(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
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
    <div style={styles.container}>
      <h2 style={styles.title}>🎙️ Real-time Audio Recorder</h2>
      <p style={styles.timer}>
        {isRecording ? `Recording... ${timer}s` : "Not recording"}
      </p>
      <p style={styles.status}>{status}</p>

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
      {transcripts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Full Transcript</h3>
          <div className="bg-white p-4 border rounded-lg shadow max-h-60 overflow-y-auto">
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {transcripts.join(' ')}
            </p>
          </div>
          </div>
        )}
    </div>
  );
};

const styles = {
  container: {
    padding: 20,
    margin: "50px auto",
    width: 380,
    
    background: "#fff",
    borderRadius: 12,
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
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
};

export default AudioRecorder;
