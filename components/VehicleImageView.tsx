import React, { useState, useRef, MouseEvent } from 'react';
import type { VehicleSide } from '../types';
import { useInspection } from '../context/InspectionContext';
import { Modal } from './Modal';
import { PlusIcon } from './icons';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';


interface VehicleImageViewProps {
  side: VehicleSide;
  imageUrl: string;
}

interface NewMarkerPosition {
  x: number;
  y: number;
}

export const VehicleImageView: React.FC<VehicleImageViewProps> = ({ side, imageUrl }) => {
  const { defects, addDefect } = useInspection();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMarkerPos, setNewMarkerPos] = useState<NewMarkerPosition | null>(null);
  const [defectTitle, setDefectTitle] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [imageNaturalSize, setImageNaturalSize] = useState<{width: number, height: number} | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);

  const sideDefects = defects.filter(d => d.side === side);

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const contentNode = imageContainerRef.current;
    if (!contentNode || !imageNaturalSize) return;

    // Use nativeEvent.offsetX/Y which are relative to the target element (the div).
    // These coordinates are on the unscaled content, which is exactly what we need for precision.
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;

    // Account for 'object-contain' letterboxing
    const containerWidth = contentNode.offsetWidth;
    const containerHeight = contentNode.offsetHeight;
    const { width: naturalWidth, height: naturalHeight } = imageNaturalSize;

    const containerRatio = containerWidth / containerHeight;
    const imageRatio = naturalWidth / naturalHeight;

    let renderedWidth, renderedHeight, offsetX, offsetY;
    if (imageRatio > containerRatio) {
        renderedWidth = containerWidth;
        renderedHeight = containerWidth / imageRatio;
        offsetX = 0;
        offsetY = (containerHeight - renderedHeight) / 2;
    } else {
        renderedHeight = containerHeight;
        renderedWidth = containerHeight * imageRatio;
        offsetY = 0;
        offsetX = (containerWidth - renderedWidth) / 2;
    }

    // Check if the click is on the letterbox bars
    if (x < offsetX || x > offsetX + renderedWidth || y < offsetY || y > offsetY + renderedHeight) {
        return; // Clicked on black bars
    }
    
    // Calculate position relative to the image itself
    const xOnImage = x - offsetX;
    const yOnImage = y - offsetY;

    // Calculate percentage position on the image
    const xPercent = (xOnImage / renderedWidth) * 100;
    const yPercent = (yOnImage / renderedHeight) * 100;
    
    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) return;

    setNewMarkerPos({ x: xPercent, y: yPercent });
    setIsModalOpen(true);
  };


  const handleAddDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMarkerPos && defectTitle) {
      addDefect({
        side,
        x: newMarkerPos.x,
        y: newMarkerPos.y,
        title: defectTitle,
        description: defectDescription,
      });
      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewMarkerPos(null);
    setDefectTitle('');
    setDefectDescription('');
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg h-full flex flex-col">
        <p className="text-center text-gray-400 mb-4">Pincez pour zoomer. Double-cliquez sur l'image pour ajouter un repère de défaut.</p>
        <div className="relative flex-grow w-full bg-black rounded-md overflow-hidden border-2 border-gray-700">
            <TransformWrapper
              ref={transformRef}
              doubleClick={{ disabled: true }}
              initialScale={1}
              minScale={1}
              maxScale={8}
              limitToBounds={true}
              velocityAnimation={{ equalToMove: true }}
              wheel={{ step: 0.2 }}
            >
              <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                <div ref={imageContainerRef} onDoubleClick={handleDoubleClick} className="w-full h-full cursor-crosshair">
                    <img 
                      src={imageUrl} 
                      alt={`Vue ${side} du véhicule`} 
                      className="w-full h-full object-contain"
                      style={{ pointerEvents: 'none' }}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                      }}
                    />
                    {sideDefects.map((defect, index) => (
                        <div
                            key={defect.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6"
                            style={{ left: `${defect.x}%`, top: `${defect.y}%` }}
                        >
                            <div className="relative w-full h-full group">
                                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                                <div className="relative w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg">
                                    {index + 1}
                                </div>
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-gray-800 text-white text-sm rounded-md p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-600">
                                    <p className="font-bold">{defect.title}</p>
                                    <p>{defect.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              </TransformComponent>
            </TransformWrapper>
        </div>
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Ajouter un défaut">
        <form onSubmit={handleAddDefect}>
            <div className="mb-4">
                <label htmlFor="defectTitle" className="block text-sm font-medium text-gray-300">Titre du défaut</label>
                <input
                    id="defectTitle"
                    type="text"
                    value={defectTitle}
                    onChange={e => setDefectTitle(e.target.value)}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
            <div className="mb-6">
                <label htmlFor="defectDescription" className="block text-sm font-medium text-gray-300">Description (optionnel)</label>
                <textarea
                    id="defectDescription"
                    value={defectDescription}
                    onChange={e => setDefectDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex justify-end">
                <button type="submit" className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Ajouter le repère
                </button>
            </div>
        </form>
      </Modal>
    </div>
  );
};
