import { useEffect, useState } from "react";
import Matter from "matter-js";

export const useMatterLoader = (): boolean => {
  const [isMatterLoaded, setIsMatterLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Si ya está cargado, retornar inmediatamente
    if (window.Matter) {
      setIsMatterLoaded(true);
      return;
    }

    // Exponer Matter.js en window para compatibilidad con el código existente
    window.Matter = Matter as any;
    setIsMatterLoaded(true);
  }, []);

  return isMatterLoaded;
};
