import type { ImportResult } from "@acme/shared";
import { TBody, THead, Table, Td, Th, Tr } from "../../components/ui/Table";

/** The import summary (inserted/updated/failed) plus the per-row error table. */
export function ImportResultView({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Stat label="Inserted" value={result.inserted} tone="green" />
        <Stat label="Updated" value={result.updated} tone="blue" />
        <Stat label="Failed" value={result.failed} tone={result.failed > 0 ? "red" : "gray"} />
      </div>

      {result.rowErrors.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">Rows that were skipped</p>
          <Table>
            <THead>
              <Tr>
                <Th className="w-20">Row</Th>
                <Th>Errors</Th>
              </Tr>
            </THead>
            <TBody>
              {result.rowErrors.map((rowError) => (
                <Tr key={rowError.row}>
                  <Td className="tabular-nums">{rowError.row}</Td>
                  <Td className="text-red-700">{rowError.errors.join("; ")}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}

const TONES = {
  green: "bg-green-50 text-green-800",
  blue: "bg-blue-50 text-blue-800",
  red: "bg-red-50 text-red-800",
  gray: "bg-gray-100 text-gray-700",
} as const;

function Stat({ label, value, tone }: { label: string; value: number; tone: keyof typeof TONES }) {
  return (
    <div className={`rounded-md px-4 py-2 ${TONES[tone]}`}>
      <span className="text-lg font-semibold tabular-nums">{value}</span> <span className="text-sm">{label}</span>
    </div>
  );
}
