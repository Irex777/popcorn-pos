import { FileText, FileSpreadsheet, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportFormat, exportData } from "@/lib/export";
import { useTranslation } from "react-i18next";

interface ExportButtonsProps {
  data: any[];
  filename: string;
  title: string;
}

export function ExportButtons({ data, filename, title }: ExportButtonsProps) {
  const { t } = useTranslation();

  const handleExport = (format: ExportFormat) => {
    exportData(data, format, filename, title);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('excel')}
        className="flex items-center gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        className="flex items-center gap-2"
      >
        <File className="h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}