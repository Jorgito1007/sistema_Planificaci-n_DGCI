"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type Notificacion = {
  tipo: string;
  titulo: string;
  mensaje: string;
  href: string;
};

type NotificationContextType = {
  notificaciones: Notificacion[];
  cargarNotificaciones: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const cargarNotificaciones = useCallback(async () => {
    try {
      const res = await fetch("/api/notificaciones/plan-accion", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.ok) {
        setNotificaciones(data.notificaciones || []);
      } else {
        setNotificaciones([]);
      }
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
      setNotificaciones([]);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notificaciones,
        cargarNotificaciones,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications debe utilizarse dentro de NotificationProvider"
    );
  }

  return context;
}