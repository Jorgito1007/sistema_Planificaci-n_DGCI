import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
          au.AuditId, 
          au.CreatedAt AS fecha, 
          au.ActorUserId, 
          us.FullName AS Usuario, 
          CASE WHEN (au.Action='CREATE_USER') THEN 'Crear Usuario'
		  WHEN (au.Action='CREATE_DOCUMENT') THEN 'Subir Documento'
		  WHEN (au.Action='UPDATE_DOCUMENT_FILE') THEN 'Actualizando Documento'
		  WHEN (au.Action='UPDATE_IMPLEMENTADO') THEN 'Actualizando Implementado'
		  WHEN (au.Action='DELETE_DOCUMENT') THEN 'Eliminar Documento'
		  ELSE  au.Action
		  end
		  AS accion, 
          au.Entity AS tabla, 
          au.EntityId, 
          au.Details AS detalles 
      FROM dbo.Auditoria_Datos_Dgci au 
      INNER JOIN dbo.Usuarios_Dgci us 
          ON au.ActorUserId = us.UserId 
      ORDER BY au.CreatedAt DESC
    `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error obteniendo auditoría:", error);

    return NextResponse.json(
      {
        error: "Error al obtener los registros de auditoría",
      },
      { status: 500 }
    );
  }
}