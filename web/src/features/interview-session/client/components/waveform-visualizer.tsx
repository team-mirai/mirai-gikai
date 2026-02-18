"use client";

import { useCallback, useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  analyserNode?: AnalyserNode | null;
  mediaStream?: MediaStream | null;
  color?: string;
  height?: number;
}

export function WaveformVisualizer({
  analyserNode,
  mediaStream,
  color = "#10b981",
  height = 48,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);

  const draw = useCallback(
    (analyser: AnalyserNode) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const render = () => {
        animationFrameRef.current = requestAnimationFrame(render);
        analyser.getByteFrequencyData(dataArray);

        const { width } = canvas;
        const canvasHeight = canvas.height;

        ctx.clearRect(0, 0, width, canvasHeight);

        const barCount = 32;
        const barWidth = width / barCount - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] / 255;
          const barHeight = Math.max(2, value * (canvasHeight - 4));
          const x = i * (barWidth + 2) + 1;
          const y = (canvasHeight - barHeight) / 2;

          ctx.fillStyle = color;
          ctx.globalAlpha = 0.6 + value * 0.4;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      render();
    },
    [color]
  );

  useEffect(() => {
    // Priority: use provided analyserNode, otherwise create from mediaStream
    if (analyserNode) {
      draw(analyserNode);
    } else if (mediaStream) {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      localAnalyserRef.current = analyser;

      draw(analyser);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      localAnalyserRef.current = null;
    };
  }, [analyserNode, mediaStream, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={height}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}
