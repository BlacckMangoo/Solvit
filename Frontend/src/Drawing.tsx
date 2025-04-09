import React, { useEffect, useRef, useState } from 'react';
import './canvas.css';

import axios from 'axios';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

declare const fabric: any;

//#region svg Icon conts  
// SVG Icons as components
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
  </svg>
);

const EraserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l6.879-6.879zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414l-3.879-3.879zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z"/>
  </svg>
);

const SelectionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M7.21.8C7.69.295 8 0 8 0c.109.363.234.708.371 1.038.812 1.946 2.073 3.35 3.197 4.6C12.878 7.096 14 8.345 14 10a6 6 0 0 1-12 0C2 6.668 5.58 2.517 7.21.8zm.413 1.021A31.25 31.25 0 0 0 5.794 3.99c-.726.95-1.436 2.008-1.96 3.07C3.304 8.133 3 9.138 3 10c0 0 2.5 1.5 5 .5s5-.5 5-.5c0-1.201-.796-2.157-2.181-3.7l-.03-.032C9.75 5.11 8.5 3.72 7.623 1.82z"/>
    <path d="M4.553 7.776c.82-1.641 1.717-2.753 2.093-3.13l.708.708c-.29.29-1.128 1.311-1.907 2.87l-.894-.448z"/>
  </svg>
);

const LassoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
  <path d="M8 9.5c3.5 0 6.5-1.5 6.5-3.5S11.5 2.5 8 2.5 1.5 4 1.5 6s3 3.5 6.5 3.5zm0 0c2 2 1.5 4.5-1.5 4.5H2.5" 
        fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="8" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.2" />
  <path d="M2.5 13.5h4c2.5 0 3-2.5 1.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
</svg>
);

const UndoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
    <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
  </svg>
);

const RedoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
  </svg>
);

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
  </svg>
);

const ConvertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
  </svg>
);

const PanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
    <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
  </svg>
);

const ZoomInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
    <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
    <path fillRule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>
  </svg>
);

const ZoomOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
    <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
    <path fillRule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
  </svg>
);

//#endregion

const cleanGeminiResponse = (response: string): string => {
  // Remove latex code block markers
  let cleaned = response.replace(/```latex|```/g, '');
  
  // Remove dollar sign delimiters (both single $ and double $$)
  cleaned = cleaned.replace(/\${1,2}(.*?)\${1,2}/g, '$1');
  
  // If the entire string is wrapped in dollar signs, remove them
  cleaned = cleaned.replace(/^\$\$(.*)\$\$$/s, '$1');
  cleaned = cleaned.replace(/^\$(.*)\$$/s, '$1');
  
  return cleaned.trim();
};

const DrawingApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<any>(null);
  const [drawingMode, setDrawingMode] = useState<'pencil' | 'eraser' | 'selection' | 'lasso' | 'pan'>('pencil');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [brushColor] = useState<string>('#FFFFFF'); // Changed default brush color to white
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [lassoCompleted, setLassoCompleted] = useState<boolean>(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewportTransform, setViewportTransform] = useState<number[]>([1, 0, 0, 1, 0, 0]);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const lastPosRef = useRef<{x: number, y: number} | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<string>("");
  const [showLatexOutput, setShowLatexOutput] = useState<boolean>(false);
  const [cleanedLatex, setCleanedLatex] = useState<string>("");
  const [latexError, setLatexError] = useState<string>("");

  const CANVAS_SIZE = 10000; // Large canvas size to simulate "infinite" space

  interface Point {
    x: number;
    y: number;
  }


  const calculateCanvasDimensions = () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  };

  const handleResize = () => {
    if (!canvas) return;
    
    const newDimensions = calculateCanvasDimensions();
    
    // Always update dimensions on resize for full-screen experience
    canvas.setDimensions({
      width: newDimensions.width,
      height: newDimensions.height
    });
    
    setCanvasDimensions(newDimensions);
    canvas.renderAll();
  };

  //Select Tool To use 
  const handleSetDrawingMode = (mode: 'pencil' | 'eraser' | 'selection' | 'lasso' | 'pan') => {
    if (mode !== 'lasso' && lassoCompleted) {
      removeAllLassoElements();
    }
    setDrawingMode(mode);
  };

  const handleZoomIn = () => {
    if (!canvas) return;
    const newZoom = Math.min(zoomLevel * 1.2, 5);
    zoomCanvas(newZoom);
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const newZoom = Math.max(zoomLevel / 1.2, 0.2);
    zoomCanvas(newZoom);
  };

  const zoomCanvas = (zoom: number) => {
    if (!canvas) return;
    
    const center = {
      x: canvas.getWidth() / 2,
      y: canvas.getHeight() / 2
    };

    canvas.zoomToPoint(center, zoom);
    setZoomLevel(zoom);
    
    // Save the viewport transform for history
    if (canvas.viewportTransform) {
      setViewportTransform([...canvas.viewportTransform]);
    }
    
    // Update history with the new transform
    const canvasState = JSON.stringify({
      objects: canvas.toJSON().objects,
      viewportTransform: canvas.viewportTransform
    });
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), canvasState]);
    setHistoryIndex(prev => prev + 1);
    
    canvas.renderAll();
  };

  const handlePngDownload = () => {
    if (!canvas || !lassoPath.current) return;
    
    const bounds = lassoPath.current.getBoundingRect();
    
    const dataUrl = canvas.toDataURL({
      format: 'png',
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height
    });
    
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = 'selection.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const lassoPointsRef = useRef<Point[]>([]);
  let lassoPath: any = useRef(null);
  const lassoThreshold = 15;
  const isPointInPath = (point: { x: number, y: number }, path: any): boolean => {
    return path.containsPoint(point);
  };

  const removeAllLassoElements = () => {
    if (!canvas || !lassoPath.current) return;
    
    canvas.remove(lassoPath.current);
    lassoPath.current = null;
    
    canvas.getObjects().forEach((obj: any) => {
      if ((obj.type === 'circle' && obj.fill === 'red') || 
          (obj.type === 'line' && obj.strokeDashArray?.length === 2)) {
        canvas.remove(obj);
      }
    });
    
    lassoPointsRef.current = [];
    setLassoCompleted(false);
  };

  const sendLassoSelectionToBackend = async () => {
    if (!canvas || !lassoPath.current) return;

    const bounds = lassoPath.current.getBoundingRect();
    const lassoElements = canvas.getObjects().filter((obj: any) => {
      return (obj.type === 'circle' && obj.fill === 'red') || 
             (obj.type === 'line' && obj.strokeDashArray?.length === 2) ||
             obj === lassoPath.current;
    });
  
    // Temporarily hide lasso elements
    lassoElements.forEach((obj: any) => {
      obj.visible = false;
    });
    canvas.renderAll();

    const dataUrl = canvas.toDataURL({
      format: "png",
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    });

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-lasso-selection/",
        { image_data: dataUrl },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Response:", response.data);
      setGeminiResponse(response.data.gemini_response || "No response from Gemini");

      // Process LaTeX response
      const latex = response.data.gemini_response || "";
      try {
        setCleanedLatex(latex);
        setLatexError("");
      } catch (error) {
        console.error("Error processing LaTeX:", error);
        setLatexError("Error processing LaTeX.");
      }
      setShowLatexOutput(true);
    } catch (error) {
      console.error("Error sending lasso selection:", error);
      setGeminiResponse("Error processing the request.");
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !fabric) return;
    
    const dimensions = calculateCanvasDimensions();
    setCanvasDimensions(dimensions);
    
    const fabricCanvas = new fabric.Canvas('canvas', {
      isDrawingMode: true,
      width: dimensions.width,
      height: dimensions.height,
      selection: false, // Disable group selection by default
      preserveObjectStacking: true,
      backgroundColor: '#000000' // Changed background color to black
    });
    
    // Set up the virtual canvas size
    fabricCanvas.setWidth(CANVAS_SIZE);
    fabricCanvas.setHeight(CANVAS_SIZE);
    
    // Center the initial viewport
    const centerX = (CANVAS_SIZE - dimensions.width) / 2;
    const centerY = (CANVAS_SIZE - dimensions.height) / 2;
    fabricCanvas.viewportTransform = [1, 0, 0, 1, -centerX, -centerY];
    setViewportTransform([1, 0, 0, 1, -centerX, -centerY]);
    
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.width = brushSize;
    fabricCanvas.freeDrawingBrush.color = brushColor;
    
    
    
    // Add mouse wheel handling for zooming with proper typing
    fabricCanvas.on('mouse:wheel', function(opt: { e: WheelEvent }) {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.2) zoom = 0.2;
      
      fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      setZoomLevel(zoom);
      
      if (fabricCanvas.viewportTransform) {
        setViewportTransform([...fabricCanvas.viewportTransform]);
      }
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
    
    setCanvas(fabricCanvas);
    
    const initialState = JSON.stringify({
      objects: fabricCanvas.toJSON().objects,
      viewportTransform: fabricCanvas.viewportTransform
    });
    
    setHistory([initialState]);
    setHistoryIndex(0);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === ' ' && !e.repeat) {
        // Spacebar for temporary panning
        e.preventDefault();
        setDrawingMode('pan');
        setIsPanning(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && isPanning) {
        // Return to previous mode when space is released
        e.preventDefault();
        setDrawingMode('pencil');
        setIsPanning(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      fabricCanvas.dispose();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);



  useEffect(() => {
    if (!canvas) return;

    // Clear all mouse event handlers
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    if (drawingMode === 'pencil') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.defaultCursor = 'grab';
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    } else if (drawingMode === 'eraser') {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      
      const handleMouseDown = (options: any) => {
        const target = options.target;
        if (target && target.type === 'path') {
          canvas.remove(target);
          canvas.renderAll();
          
          const newState = JSON.stringify({
            objects: canvas.toJSON().objects,
            viewportTransform: canvas.viewportTransform
          });
          
          setHistory(prev => [...prev.slice(0, historyIndex + 1), newState]);
          setHistoryIndex(prev => prev + 1);
        }
      };
      canvas.on('mouse:down', handleMouseDown);
    } else if (drawingMode === 'selection') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
    } else if (drawingMode === 'pan') {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'grab';
      
      canvas.on('mouse:down', (opt: any) => {
        const evt = opt.e;
        canvas.defaultCursor = 'grabbing';
        canvas.isDragging = true;
        lastPosRef.current = {
          x: evt.clientX,
          y: evt.clientY
        };
        canvas.selection = false;
        canvas.requestRenderAll();
      });
      
      canvas.on('mouse:move', (opt: any) => {
        if (canvas.isDragging && lastPosRef.current) {
          const evt = opt.e;
          const vpt = canvas.viewportTransform;
          if (!vpt) return;
          
          const dx = evt.clientX - lastPosRef.current.x;
          const dy = evt.clientY - lastPosRef.current.y;
          
          // Apply the pan translation
          vpt[4] += dx;
          vpt[5] += dy;
          
          canvas.requestRenderAll();
          lastPosRef.current = {
            x: evt.clientX,
            y: evt.clientY
          };
          
          setViewportTransform([...vpt]);
        }
      });
      
      canvas.on('mouse:up', () => {
        canvas.isDragging = false;
        canvas.defaultCursor = 'grab';
        lastPosRef.current = null;
        
        // Save the viewport transform in history
        const newState = JSON.stringify({
          objects: canvas.toJSON().objects,
          viewportTransform: canvas.viewportTransform
        });
        
        setHistory(prev => [...prev.slice(0, historyIndex + 1), newState]);
        setHistoryIndex(prev => prev + 1);
      });
    } else if (drawingMode === 'lasso') {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.skipTargetFind = true;
    
      const handleMouseDown = (options: fabric.IEvent) => {
        const pointer = canvas.getPointer(options.e);
        
        if (lassoCompleted && lassoPath.current) {
          if (!isPointInPath(pointer, lassoPath.current)) {
            removeAllLassoElements();
            canvas.renderAll();
            return;
          }
        }
    
        if (lassoCompleted) return;
    
        const circle = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 3,
          fill: 'red',
          opacity: 0.5,
          selectable: false,
          evented: false,
        });
        canvas.add(circle);
    
        lassoPointsRef.current.push({ x: pointer.x, y: pointer.y });
    
        if (
          lassoPointsRef.current.length > 2 &&
          Math.abs(lassoPointsRef.current[0].x - pointer.x) < lassoThreshold &&
          Math.abs(lassoPointsRef.current[0].y - pointer.y) < lassoThreshold
        ) {
          const secondLastPoint = lassoPointsRef.current[lassoPointsRef.current.length - 2];
          const lastPoint = lassoPointsRef.current[lassoPointsRef.current.length - 1];
          
          const regularLine = new fabric.Line(
            [secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y],
            {
              stroke: 'gray',
              strokeWidth: 1,
              opacity: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            }
          );
          canvas.add(regularLine);

          const firstPoint = lassoPointsRef.current[0];
    
          const finalLine = new fabric.Line(
            [lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y],
            {
              stroke: '#808080',
              strokeWidth: 2,
              opacity: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false
            }
          );
    
          canvas.add(finalLine);
          canvas.renderAll();
    
          lassoPath.current = new fabric.Path(
            lassoPointsRef.current
              .map((point, index) => {
                return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
              })
              .join(' ') + ' Z',
            {
              stroke: 'transparent',
              strokeWidth: 2,
              fill: 'rgba(255, 0, 0, 0)',
              selectable: false,
            }
          );
    
          canvas.add(lassoPath.current);
    
          setLassoCompleted(true);
          return;
        }
    
        if (lassoPointsRef.current.length > 1) {
          const lastPoint = lassoPointsRef.current[lassoPointsRef.current.length - 2];
          const currentPoint = lassoPointsRef.current[lassoPointsRef.current.length - 1];
    
          const line = new fabric.Line(
            [lastPoint.x, lastPoint.y, currentPoint.x, currentPoint.y],
            {
              stroke: 'gray',
              strokeWidth: 1,
              opacity: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            }
          );

          canvas.add(line);
        }
    
        canvas.renderAll(); 
      };
    
      canvas.on('mouse:down', handleMouseDown);
    }
  }, [canvas, drawingMode, brushColor, brushSize, historyIndex]);

  useEffect(() => {
    if (!canvas) return;

    const saveToHistory = () => {
      // Save objects and viewport transform
      const canvasState = JSON.stringify({
        objects: canvas.toJSON().objects,
        viewportTransform: canvas.viewportTransform
      });
      
      if (historyIndex < history.length - 1) {
        setHistory(prev => prev.slice(0, historyIndex + 1));
      }
      setHistory(prev => [...prev, canvasState]);
      setHistoryIndex(prev => prev + 1);
    };

    canvas.on('object:added', saveToHistory);
    canvas.on('object:modified', saveToHistory);

    return () => {
      canvas.off('object:added', saveToHistory);
      canvas.off('object:modified', saveToHistory);
    };
  }, [canvas, historyIndex]);

  const handleUndo = () => {
    if (!canvas || historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const previousState = JSON.parse(history[newIndex]);
    
    // Load objects
    canvas.loadFromJSON({ objects: previousState.objects }, () => {
      // Restore viewport transform
      if (previousState.viewportTransform) {
        canvas.viewportTransform = previousState.viewportTransform;
        setViewportTransform(previousState.viewportTransform);
      }
      canvas.backgroundColor = '#000000'; // Restore background color
      canvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleRedo = () => {
    if (!canvas || historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    const nextState = JSON.parse(history[newIndex]);
    
    // Load objects
    canvas.loadFromJSON({ objects: nextState.objects }, () => {
      // Restore viewport transform
      if (nextState.viewportTransform) {
        canvas.viewportTransform = nextState.viewportTransform;
        setViewportTransform(nextState.viewportTransform);
      }
      canvas.backgroundColor = '#000000'; 
      canvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleClear = () => {
    if (!canvas) return;
  
    // Store the background color before clearing
    const backgroundColor = canvas.backgroundColor;
    
    canvas.clear();
    
    // Restore the background color
    canvas.setBackgroundColor(backgroundColor, () => {});
    

    
    // Keep the current viewport transform
    const vpt = [...viewportTransform];
    if (canvas.viewportTransform) {
      canvas.viewportTransform = vpt;
    }
    
    const clearedState = JSON.stringify({
      objects: canvas.toJSON().objects,
      viewportTransform: vpt
    });
    
    lassoPointsRef.current = [];
    lassoPath.current = null;
    setLassoCompleted(false);
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), clearedState]);
    setHistoryIndex(prev => prev + 1);
    
    canvas.renderAll();
  };

  const resetView = () => {
    if (!canvas) return;
    
    const centerX = (CANVAS_SIZE - canvasDimensions.width) / 2;
    const centerY = (CANVAS_SIZE - canvasDimensions.height) / 2;
    
    canvas.setViewportTransform([1, 0, 0, 1, -centerX, -centerY]);
    setViewportTransform([1, 0, 0, 1, -centerX, -centerY]);
    setZoomLevel(1);
    
    canvas.renderAll();
    
    // Save the reset viewport in history
    const resetState = JSON.stringify({
      objects: canvas.toJSON().objects,
      viewportTransform: canvas.viewportTransform
    });
    
    setHistory(prev => [...prev.slice(0, historyIndex + 1), resetState]);
    setHistoryIndex(prev => prev + 1);
  };

  useEffect(() => {
    if (geminiResponse) {
      const cleaned = cleanGeminiResponse(geminiResponse);
      setCleanedLatex(cleaned);
    }
  }, [geminiResponse]);

  return (

    <>

    <div className="app-container">
    
      <div className="toolbar">
        {/* Drawing Tools Section */}
        <div className="toolbar-section">
          <button
            className={`btn btn-compact ${drawingMode === 'pencil' ? 'btn-active' : ''}`}
            onClick={() => handleSetDrawingMode('pencil')}
            title="Pencil"
            
          >
            <PencilIcon />
          </button>
          <button
            className={`btn btn-compact ${drawingMode === 'eraser' ? 'btn-active' : ''}`}
            onClick={() => handleSetDrawingMode('eraser')}
            title="Eraser"
          >
            <EraserIcon />
          </button>
          <button
            className={`btn btn-compact ${drawingMode === 'selection' ? 'btn-active' : ''}`}
            onClick={() => handleSetDrawingMode('selection')}
            title="Selection"
          >
            <SelectionIcon />
          </button>
          <button
            className={`btn btn-compact ${drawingMode === 'lasso' ? 'btn-active' : ''}`}
            onClick={() => handleSetDrawingMode('lasso')}
            title="Lasso"
          >
            <LassoIcon />
          </button>
          <button
            className={`btn btn-compact ${drawingMode === 'pan' ? 'btn-active' : ''}`}
            onClick={() => handleSetDrawingMode('pan')}
            title="Pan"
          >
            <PanIcon />
          </button>
        </div>

        {/* Brush Size Control */}
        <div className="toolbar-section">
          <input
            id="brush-size"
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            title="Brush Size"
          />
          <span className="size-value">{brushSize}</span>
        </div>

        {/* Zoom Controls */}
        <div className="toolbar-section">
          <button className="btn btn-compact" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOutIcon />
          </button>
          <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
          <button className="btn btn-compact" onClick={handleZoomIn} title="Zoom In">
            <ZoomInIcon />
          </button>
          <button className="btn btn-compact" onClick={resetView} title="Reset View">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
              <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
            </svg>
          </button>
        </div>

        {/* History Controls */}
        <div className="toolbar-section ">
          <button className="btn btn-compact" onClick={handleUndo} title="Undo">
            <UndoIcon />
          </button>
          <button className="btn btn-compact" onClick={handleRedo} title="Redo">
            <RedoIcon />
          </button>
          <button className="btn btn-compact btn-danger" onClick={handleClear} title="Clear">
            <ClearIcon />
          </button>
        </div>

       
      </div>

      <div className='toolbar-vertical'>
         {/* Lasso Tools (Conditional) */}
         {lassoCompleted && (
          <div className="toolbar-section-vertical ">
            <button className="btn btn-compact" onClick={handlePngDownload} title="Download PNG">
              <DownloadIcon />
            </button>
            <button className="btn btn-compact" onClick={sendLassoSelectionToBackend} title="Convert to LaTeX">
              <ConvertIcon />
            </button>
          </div>
        )}

      </div>

      <div className="canvas-container" ref={canvasContainerRef}>
        <div className="canvas-wrapper">
          <canvas ref={canvasRef} id="canvas"></canvas>
          <div className="canvas-dimensions-display">
            Zoom: {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>

      {/* LaTeX Output Window */}
      {showLatexOutput && (
        <div className="latex-output-window">
          <div className="latex-header">
            <h3>LaTeX Output</h3>
            <button 
              className="btn btn-compact"
              onClick={() => setShowLatexOutput(false)}
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
          
          <div className="latex-content">
            {latexError ? (
              <div className="error-container">
                <p className="error-message">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="error-icon">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                  </svg>
                  {latexError}
                </p>
              </div>
            ) : (
              <>
                <div className="latex-preview">
                  <BlockMath math={cleanedLatex} />
                </div>
                <div className="latex-code-container">
                  <pre className="latex-code">{cleanedLatex}</pre>
                  <button 
                    className="btn btn-compact copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(cleanedLatex);
                      // Optional: Add visual feedback for copy
                      const copyBtn = document.querySelector('.copy-btn');
                      if (copyBtn) {
                        const originalText = copyBtn.textContent;
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                          copyBtn.textContent = originalText;
                        }, 1500);
                      }
                    }}
                    title="Copy to clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                    </svg>
                    Copy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="shortcuts">
        Keyboard shortcuts: <kbd className='text-blue-200'>Ctrl</kbd> + <kbd>Z</kbd> for Undo, <kbd>Ctrl</kbd> + <kbd>Y</kbd> for Redo, <kbd>Space</kbd> (hold) for Pan
      </div>
    </div>
    </>
  );
};

export default DrawingApp;