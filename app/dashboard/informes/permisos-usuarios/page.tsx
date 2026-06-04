"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Permiso = {
  UserId: string;
  FullName: string;
  ModuleName: string | null;
  SubModuleName: string | null;
};

export default function InformePermisosUsuarios() {
  const [data, setData] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const res = await fetch("/api/informes/permisos-usuarios");

      const json = await res.json();

      setData(json);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Informe de Permisos de Usuarios
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-3 text-left">
                      Usuario
                    </th>

                    <th className="border p-3 text-left">
                      Módulo Asignado
                    </th>

                    <th className="border p-3 text-left">
                      Submódulo Asignado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((item, index) => (
                    <tr
                      key={`${item.UserId}-${index}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="border p-3">
                        {item.FullName}
                      </td>

                      <td className="border p-3">
                        {item.ModuleName || "-"}
                      </td>

                      <td className="border p-3">
                        {item.SubModuleName || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}