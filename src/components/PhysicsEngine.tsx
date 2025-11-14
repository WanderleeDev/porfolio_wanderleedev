import React from "react";
import { ListItem } from "../types/physics";
import { usePhysicsEngine } from "../hooks/usePhysicsEngine";

interface PhysicsEngineProps {
  items: ListItem[];
  title: string;
  gradient: string;
  isActive: boolean;
}

export const PhysicsEngine: React.FC<PhysicsEngineProps> = ({
  items,
  title,
  gradient,
  isActive,
}) => {
  const { containerRef, itemPositions, isReady } = usePhysicsEngine({
    items,
    isActive,
  });

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-center py-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {title}
        </h2>
        <p className="text-white/60 text-sm md:text-base">
          {isActive ? "Arrastra las tecnologías 🎯" : "Desliza para activar ➡️"}
        </p>
      </div>

      <div ref={containerRef} className={`flex-1 relative ${gradient}`}>
        {!isReady && isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-lg">Inicializando física... ⚡</div>
          </div>
        )}

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/40 text-xl">Desliza para ver la animación 👉</div>
          </div>
        )}

        {Array.from(itemPositions.entries()).map(
          ([itemId, pos]: [number, { x: number; y: number; rotation: number }]) => {
            const item: ListItem | undefined = items.find(
              (i: ListItem) => i.id === itemId
            );
            if (!item) return null;

            return (
              <div
                key={itemId}
                style={{
                  position: "absolute",
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: `translate(-50%, -50%) rotate(${pos.rotation}rad)`,
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                <div
                  className="inline-flex items-center gap-2 md:gap-3 rounded-full px-3 md:px-5 py-2 md:py-3 shadow-lg border-2 backdrop-blur-sm"
                  style={{
                    backgroundColor: `${item.color}33`,
                    borderColor: `${item.color}99`,
                    boxShadow: `0 4px 20px ${item.color}44`,
                  }}
                >
                  <span className="text-lg md:text-2xl">{item.icon}</span>
                  <span className="text-xs md:text-sm font-semibold text-white hidden sm:inline">
                    {item.text}
                  </span>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

