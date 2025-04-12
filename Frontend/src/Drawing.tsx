import React, { useEffect, useRef, useState } from 'react';
import './canvas.css';
import 'katex/dist/katex.min.css';
import LatexOutputWindow from './latex-window';

import { PencilIcon, EraserIcon, SelectionIcon, LassoIcon, PanIcon, ZoomInIcon, ZoomOutIcon, UndoIcon, RedoIcon, ClearIcon, DownloadIcon, ConvertIcon } from './icons/icons'; // Import your icons here
declare const fabric: any;
import { sendLassoSelectionImage } from './services/api';
import { cleanGeminiResponse } from './utils/cleanLatexResponse'; // Import the cleaning function


const DrawingApp: React.FC = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<any>(null);
  const [drawingMode, setDrawingMode] = useState<'pencil' | 'eraser' | 'selection' | 'lasso' | 'pan'>('pencil');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [brushColor] = useState<string>('#FFFFFF'); // Changed default brush color to white
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const MAX_HISTORY_SIZE = 5; // Store maximum 5 states (current + 2 back + 2 forward)
  const [lassoCompleted, setLassoCompleted] = useState<boolean>(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewportTransform, setViewportTransform] = useState<number[]>([1, 0, 0, 1, 0, 0]);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const lastPosRef = useRef<{x: number, y: number} | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<string>("");
  const [showLatexOutput, setShowLatexOutput] = useState<boolean>(false);
  const [cleanedLatex, setCleanedLatex] = useState<string>("");
  const [latexError, setLatexError] = useState<string | null>(null);
  
  // State for managing multiple LaTeX windows
  const [latexWindows, setLatexWindows] = useState<Array<{
    id: string;
    latex: string;
    error: string | null;
    position: { x: number, y: number };
  }>>([]);
  const nextWindowIdRef = useRef<number>(1);

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
  
    // Prepare canvas - hide lasso elements
    const bounds = lassoPath.current.getBoundingRect();
    const lassoElements = canvas.getObjects().filter((obj: any) => {
      return (obj.type === 'circle' && obj.fill === 'red') || 
             (obj.type === 'line' && obj.strokeDashArray?.length === 2) ||
             obj === lassoPath.current;
    });
  
    lassoElements.forEach((obj: any) => {
      obj.visible = false;
    });
    canvas.renderAll();
  
    // Get image data
    const dataUrl = canvas.toDataURL({
      format: "png",
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    });
  
    // Show lasso elements again
    lassoElements.forEach((obj: any) => {
      obj.visible = true;
    });
    canvas.renderAll();
  
    // Use the service function
    const response = await sendLassoSelectionImage(dataUrl);
    
    // Handle response in component
    setGeminiResponse(response.geminiResponse);
  
    if (response.success) {
      try {
        const cleaned = cleanGeminiResponse(response.geminiResponse);
        setCleanedLatex(cleaned);
        setLatexError(null);
      } catch (error) {
        console.error("Error processing LaTeX:", error);
        setLatexError("Error processing LaTeX.");
      }
      setShowLatexOutput(true);
    } else {
      setLatexError("Error processing the request.");
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
      canvas.defaultCursor = 'crosshair';
      
      let isErasing = false;
      let lastPoint: { x: number, y: number } | null = null;
      
      canvas.on('mouse:down', (options: any) => {
        isErasing = true;
        const pointer = canvas.getPointer(options.e);
        lastPoint = pointer;
        
        // Check if clicked directly on an object
        const target = options.target;
        if (target) {
          canvas.remove(target);
          canvas.renderAll();
          
          const newState = JSON.stringify({
            objects: canvas.toJSON().objects,
            viewportTransform: canvas.viewportTransform
          });
          
          setHistory(prev => [...prev.slice(0, historyIndex + 1), newState]);
          setHistoryIndex(prev => prev + 1);
        }
      });
      
      canvas.on('mouse:move', (options: any) => {
        if (!isErasing || !lastPoint) return;
        
        const pointer = canvas.getPointer(options.e);
        const objects = canvas.getObjects();
        
        // Set a threshold for eraser size
        const eraserSize = brushSize * 2;
        
        // Check each object on the canvas
        for (let i = objects.length - 1; i >= 0; i--) {
          const obj = objects[i];
          
          // Skip non-drawing objects (like lasso elements)
          if (obj.type === 'circle' && obj.fill === 'red') continue;
          if (obj.type === 'line' && obj.strokeDashArray?.length === 2) continue;
          if (obj === lassoPath.current) continue;
          
          // Better hit detection implementation
          let shouldErase = false;
          
          // First check: direct hit using containsPoint
          if (obj.containsPoint && obj.containsPoint(pointer)) {
            shouldErase = true;
          } 
          // Second check: for line objects with isNear method
          else if (obj.isNear && obj.isNear(pointer.x, pointer.y, eraserSize)) {
            shouldErase = true;
          } 
          // Third check: distance-based detection for other objects using bounding box
          else {
            const objBounds = obj.getBoundingRect();
            const objCenter = {
              x: objBounds.left + objBounds.width / 2,
              y: objBounds.top + objBounds.height / 2
            };
            
            // Calculate distance from pointer to object center
            const dx = pointer.x - objCenter.x;
            const dy = pointer.y - objCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If distance is within eraser size + half of object's size, erase it
            const objSize = Math.max(objBounds.width, objBounds.height) / 2;
            if (distance < eraserSize + objSize) {
              shouldErase = true;
            }
          }
          
          if (shouldErase) {
            canvas.remove(obj);
          }
        }
        
        canvas.renderAll();
        lastPoint = pointer;
      });
      
      canvas.on('mouse:up', () => {
        if (isErasing) {
          isErasing = false;
          lastPoint = null;
          
          const newState = JSON.stringify({
            objects: canvas.toJSON().objects,
            viewportTransform: canvas.viewportTransform
          });
          
          setHistory(prev => [...prev.slice(0, historyIndex + 1), newState]);
          setHistoryIndex(prev => prev + 1);
        }
      });
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
      setHistory(prev => {
        const newHistory = [...prev, canvasState];
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift(); // Remove the oldest state if history exceeds max size
        }
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
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
    
    const newIndex = Math.max(historyIndex - 1, 0);
    
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
    
    const newIndex = Math.min(historyIndex + 1, history.length - 1);
    
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

  // Function to add a new LaTeX window
  const addLatexWindow = (latex: string, error: string | null = null) => {
    // Generate random position slightly offset from center
    const randomOffset = () => Math.random() * 100 - 50;
    const centerX = window.innerWidth / 2 - 200 + randomOffset();
    const centerY = window.innerHeight / 2 - 150 + randomOffset();
    
    const newId = nextWindowIdRef.current.toString();
    nextWindowIdRef.current += 1;
    
    setLatexWindows(prev => [
      ...prev,
      {
        id: newId,
        latex,
        error,
        position: { x: centerX, y: centerY }
      }
    ]);
    
    return newId;
  };

  // Function to close a LaTeX window by id
  const closeLatexWindow = (id: string) => {
    setLatexWindows(prev => prev.filter(window => window.id !== id));
  };

  // Updated function to handle LaTeX conversion from lasso selection
  const sendLassoSelectionToBackendMultiWindow = async () => {
    if (!canvas || !lassoPath.current) return;
  
    // Prepare canvas - hide lasso elements
    const bounds = lassoPath.current.getBoundingRect();
    const lassoElements = canvas.getObjects().filter((obj: any) => {
      return (obj.type === 'circle' && obj.fill === 'red') || 
             (obj.type === 'line' && obj.strokeDashArray?.length === 2) ||
             obj === lassoPath.current;
    });
  
    lassoElements.forEach((obj: any) => {
      obj.visible = false;
    });
    canvas.renderAll();
  
    // Get image data
    const dataUrl = canvas.toDataURL({
      format: "png",
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    });
  
    // Show lasso elements again
    lassoElements.forEach((obj: any) => {
      obj.visible = true;
    });
    canvas.renderAll();
  
    // Use the service function
    const response = await sendLassoSelectionImage(dataUrl);
    
    if (response.success) {
      try {
        const cleaned = cleanGeminiResponse(response.geminiResponse);
        addLatexWindow(cleaned);
      } catch (error) {
        console.error("Error processing LaTeX:", error);
        addLatexWindow("", "Error processing LaTeX.");
      }
    } else {
      addLatexWindow("", "Error processing the request.");
    }

    // Remove lasso selection elements and reset lasso state after conversion
    removeAllLassoElements();
    // Switch back to pencil mode
    handleSetDrawingMode('pencil');
  };

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
            <button 
              className="btn btn-compact" 
              onClick={sendLassoSelectionToBackendMultiWindow} 
              title="Convert to LaTeX"
            >
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

      {/* Legacy LaTeX window - keeping for backward compatibility */}
      {showLatexOutput && (
        <LatexOutputWindow
          id="default"
          latexError={latexError}
          cleanedLatex={cleanedLatex}
          onClose={() => setShowLatexOutput(false)}
        />
      )}

      {/* Render multiple LaTeX windows */}
      {latexWindows.map(window => (
        <LatexOutputWindow
          key={window.id}
          id={window.id}
          latexError={window.error}
          cleanedLatex={window.latex}
          initialPosition={window.position}
          onClose={() => closeLatexWindow(window.id)}
        />
      ))}

      <div className="shortcuts">
        Keyboard shortcuts: <kbd className='text-blue-200'>Ctrl</kbd> + <kbd>Z</kbd> for Undo, <kbd>Ctrl</kbd> + <kbd>Y</kbd> for Redo, <kbd>Space</kbd> (hold) for Pan
      </div>
    </div>
    </>
  );
};

export default DrawingApp;