import React from 'react';
import { FileDown, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { useTranslation } from '../../lib/i18n';

interface ExportButtonsProps {
  data: any[];
  filename: string;
  headers?: string[];
}

export function ExportButtons({ data, filename, headers }: ExportButtonsProps) {
  const { t } = useTranslation();

  const exportToPDF = () => {
    toast.info(t('export.pdfGenerating'));
    
    // Simuler la génération du PDF
    setTimeout(() => {
      toast.success(t('export.pdfSuccess'));
      console.log('Export PDF:', { data, filename, headers });
    }, 1000);
  };

  const exportToExcel = () => {
    toast.info(t('export.excelGenerating'));
    
    // Simuler la génération de l'Excel
    setTimeout(() => {
      toast.success(t('export.excelSuccess'));
      console.log('Export Excel:', { data, filename, headers });
    }, 1000);
  };

  const exportToCSV = () => {
    try {
      // Générer le CSV
      let csvContent = '';
      
      // Ajouter les en-têtes si fournis
      if (headers && headers.length > 0) {
        csvContent += headers.join(',') + '\n';
      } else if (data.length > 0) {
        // Utiliser les clés de l'objet comme en-têtes
        csvContent += Object.keys(data[0]).join(',') + '\n';
      }
      
      // Ajouter les données
      data.forEach(row => {
        const values = Object.values(row).map(value => {
          // Échapper les virgules et guillemets
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvContent += values.join(',') + '\n';
      });

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t('export.csvSuccess'));
    } catch (error) {
      toast.error(t('export.error'));
      console.error('Export CSV error:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          {t('common.export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          Exporter en PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4" />
          Exporter en Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <FileDown className="w-4 h-4" />
          Exporter en CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
