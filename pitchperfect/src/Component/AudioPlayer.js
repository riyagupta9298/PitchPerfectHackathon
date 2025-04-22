import React, { useState, useEffect, useRef } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import './style/audio-player.scss';

const AudioPlayer = ({ audioSrc, duration = "2:45", showPlaybackRate = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Update progress bar as audio plays
  useEffect(() => {
    if (!audioRef.current) return;

    const updateProgress = () => {
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration || 1;
        setCurrentTime(currentTime);
        setProgress((currentTime / duration) * 100);
      }
    };

    // If no actual audio source, simulate progress
    if (!audioSrc) {
      let interval;
      if (isPlaying) {
        interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              setIsPlaying(false);
              clearInterval(interval);
              return 0;
            }
            return prev + 0.5;
          });
        }, 100);
      }
      return () => clearInterval(interval);
    } else {
      // Real audio handling
      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      });

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', updateProgress);
          audioRef.current.removeEventListener('ended', () => {
            setIsPlaying(false);
          });
        }
      };
    }
  }, [isPlaying, audioSrc]);

  // Format time (seconds) to MM:SS
  const formatTime = (time) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // Handle click on progress bar to seek
  const handleProgressClick = (e) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const progressBarWidth = rect.width;
    const seekPercentage = (clickPosition / progressBarWidth) * 100;

    setProgress(seekPercentage);

    if (audioRef.current) {
      const seekTime = (seekPercentage / 100) * (audioRef.current.duration || 100);
      audioRef.current.currentTime = seekTime;
    }
  };

  return (
    <div className="simple-audio-player">
      <div
        className="play-button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </div>

      <div className="playback-controls">
      {showPlaybackRate && (
          <div className="playback-rate">1x</div>
        )}
        <div
          className="progress-bar"
          ref={progressBarRef}
          onClick={handleProgressClick}
        >
          
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="time-display">
          {audioSrc ? formatTime(currentTime) : duration}
        </div>

       
      </div>

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="metadata" />
      )}
    </div>
  );
};

export default AudioPlayer;
