import { useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface UseLassoProps {
  canvas: any;
}

const useLasso = ({ canvas }: UseLassoProps) => {
  const [lassoCompleted, setLassoCompleted] = useState<boolean>(false);
  const lassoPointsRef = useRef<Point[]>([]);
  const lassoPath = useRef<any>(null);

  const isPointInPath = (point: Point, path: any): boolean => {
    if (!path) return false;
    
    // Get bounding box of the path
    const bounds = path.getBoundingRect();
    
    if (
      point.x < bounds.left || 
      point.x > bounds.left + bounds.width || 
      point.y < bounds.top || 
      point.y > bounds.top + bounds.height
    ) {
      return false;
    }
    
    // Ray casting algorithm for point-in-polygon test
    const points = lassoPointsRef.current;
    let inside = false;
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  const removeAllLassoElements = () => {
    if (!canvas || !lassoPath.current) return;
    
    canvas.remove(lassoPath.current);
    lassoPath.current = null;
    
    canvas.getObjects().forEach((obj: any) => {
      if (
        (obj.type === 'circle' && obj.fill === 'red') || 
        (obj.type === 'line' && obj.strokeDashArray?.length === 2)
      ) {
        canvas.remove(obj);
      }
    });
    
    lassoPointsRef.current = [];
    setLassoCompleted(false);
  };

  const handlePngDownload = () => {
    if (!canvas || !lassoPath.current) return;
    
    const bounds = lassoPath.current.getBoundingRect();
    
    // Temporarily hide lasso elements
    const lassoElements = canvas.getObjects().filter((obj: any) => {
      return (obj.type === 'circle' && obj.fill === 'red') || 
             (obj.type === 'line' && obj.strokeDashArray?.length === 2) ||
             obj === lassoPath.current;
    });
    
    lassoElements.forEach((obj: any) => {
      obj.visible = false;
    });
    
    canvas.renderAll();
    
    const dataUrl = canvas.toDataURL({
      format: 'png',
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height
    });
    
    // Show lasso elements again
    lassoElements.forEach((obj: any) => {
      obj.visible = true;
    });
    
    canvas.renderAll();
    
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = 'selection.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return {
    lassoPointsRef,
    lassoPath,
    lassoCompleted,
    setLassoCompleted,
    isPointInPath,
    removeAllLassoElements,
    handlePngDownload
  };
};

export default useLasso;