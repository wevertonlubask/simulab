"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileJson, FileText } from "lucide-react";

export function TemplateDownloader() {
  const downloadTemplate = async (format: "csv" | "excel" | "json") => {
    const link = document.createElement("a");
    link.href = `/api/templates/${format}`;
    link.click();
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadTemplate("csv")}
        className="gap-2"
      >
        <FileText className="h-4 w-4 text-green-500" />
        Baixar Template CSV
        <Download className="h-3 w-3 ml-1" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadTemplate("excel")}
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
        Baixar Template Excel
        <Download className="h-3 w-3 ml-1" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadTemplate("json")}
        className="gap-2"
      >
        <FileJson className="h-4 w-4 text-yellow-500" />
        Baixar Template JSON
        <Download className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}
