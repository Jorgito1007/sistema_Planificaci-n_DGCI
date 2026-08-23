import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
  SELECT
        u.UserId,
        u.FullName,
        m.ModuleName,
        s.SubModuleName,
		rl.RoleName
      FROM dbo.Usuarios_Dgci u
      LEFT JOIN dbo.usuariosModulosPermisos ump
        ON u.UserId = ump.UserId
LEFT JOIN dbo.UserRoles_Dgci ur
ON u.UserId=ur.UserId
INNER JOIN dbo.Roles_Dgci rl
ON ur.RoleId=rl.RoleId
      INNER JOIN dbo.Modulos_Dgci m
        ON m.ModuleId = ump.ModuleId
      INNER JOIN dbo.usuariosSubmodulospermisos usp
        ON u.UserId = usp.UserId
      INNER JOIN dbo.submodulos_dgci s
        ON s.SubModuleId = usp.SubModuleId AND s.ModuleId=m.ModuleId
      WHERE u.IsActive = 1 AND u.Email NOT IN ('jorge.leiva@uncsm.edu.ni')
      ORDER BY u.FullName, m.ModuleName, s.SubModuleName
    `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error al cargar informe" },
      { status: 500 }
    );
  }
}