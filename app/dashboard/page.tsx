import DashboardStatsClient from "./DashboardStatsClient";

/**
 * El panel principal es 100% client (portada con fecha/hora).
 *
 * Nota: antes esta página ejecutaba 4 consultas a SQL Server cuyo
 * resultado se pasaba a DashboardStatsClient como `stats` /
 * `documentosPorSubmodulo`, pero el componente nunca los usó
 * (props ignoradas en runtime). Esas consultas se eliminaron
 * como código muerto.
 */
export default function DashboardPage() {
  return <DashboardStatsClient />;
}
