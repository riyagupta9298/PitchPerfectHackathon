import React, { useEffect, useRef, useState } from "react";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState("Idle");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const audioChunks = useRef([]);
  const fullRecordingChunks = useRef([]);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
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
    streamRef.current = stream;

    // Create AudioContext at 8000 Hz
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 8000 });
    audioContextRef.current = audioContext;

    // Source and processor
    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      // Save current chunk and also for full recording
      audioChunks.current.push(new Float32Array(input));
      fullRecordingChunks.current.push(new Float32Array(input));
    };
    
    setIsRecording(true);
    setStatus("Recording...");
    setTimer(0);
  };

  const stopRecording = () => {
    processorRef.current && processorRef.current.disconnect();
    sourceRef.current && sourceRef.current.disconnect();
    audioContextRef.current && audioContextRef.current.close();
    streamRef.current && streamRef.current.getTracks().forEach(track => track.stop());

    // Combine all buffers for full recording and encode to .wav
    const all = flattenBuffers(fullRecordingChunks.current);
    const wavBlob = encodeWAV(all, 8000, 1);

    setDownloadUrl(URL.createObjectURL(wavBlob));

    setIsRecording(false);
    setStatus("Stopped");
    setTimer(0);
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


  const sendAudioChunk = async (onStop = false) => {
    if (audioChunks.current.length === 0) return;

    setStatus("Uploading...");
    const chunk = flattenBuffers(audioChunks.current);
    const wavBlob = encodeWAV(chunk, 8000, 1);

    const formData = new FormData();
    formData.append("file", wavBlob, `chunk-${Date.now()}.wav`);
    formData.append("elapsedTime", timer.toString());

    try {
      const response = await fetch("https://localhost:44318/api/WebSiteService/UploadAgentSpeech", {
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


// Utility: Encode Float32 PCM samples to 16-bit WAV
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
    <div style={styles.container}>
      <h2 style={styles.title}>🎙️ Real-time Audio Recorder12</h2>
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
          <a href={downloadUrl} download="full-recording.wav" style={styles.downloadBtn}>
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

