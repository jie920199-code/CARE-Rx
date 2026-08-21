"use client";

export function PrintPrescriptionButton() {
  return <button className="primaryButton" type="button" onClick={() => window.print()}>打印 / 另存 PDF</button>;
}
