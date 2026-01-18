/**
 * WOUAKA ROI Impact Report Generator
 * Generates professional multi-page PDF reports for the ROI simulator
 */

import jsPDF from 'jspdf';
import { WOUAKA_LOGO_BASE64, COMPANY_INFO, SITE_CONFIG, PRODUCTION_DOMAIN } from '@/lib/app-config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// WOUAKA Brand Colors (RGB for jsPDF)
const COLORS = {
  greenDeep: { r: 10, g: 61, b: 44 },      // #0A3D2C
  greenDark: { r: 7, g: 42, b: 30 },       // #072A1E
  goldPrimary: { r: 212, g: 160, b: 23 },  // #D4A017
  goldLight: { r: 251, g: 223, b: 7 },     // #FBDF07
  white: { r: 255, g: 255, b: 255 },
  grayLight: { r: 240, g: 240, b: 240 },
  grayMedium: { r: 150, g: 150, b: 150 },
  grayDark: { r: 80, g: 80, b: 80 },
};

// Page layout constants
const PAGE_MARGIN = 15;
const HEADER_HEIGHT = 22;
const FOOTER_HEIGHT = 12;
const CONTENT_START_Y = HEADER_HEIGHT + 10;

interface ROIReportData {
  volume: number;
  npl: number;
  clients: number;
  cac: number;
  savingsNPL: number;
  savingsOPS: number;
  totalROI: number;
  percentageGain: number;
  projectedNPL: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

const setColor = (doc: jsPDF, color: { r: number; g: number; b: number }) => {
  doc.setTextColor(color.r, color.g, color.b);
};

const setFillColor = (doc: jsPDF, color: { r: number; g: number; b: number }) => {
  doc.setFillColor(color.r, color.g, color.b);
};

const addHeader = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  setFillColor(doc, COLORS.greenDeep);
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');
  
  // Gold accent line
  setFillColor(doc, COLORS.goldPrimary);
  doc.rect(0, HEADER_HEIGHT, pageWidth, 1.5, 'F');
  
  // Logo (left side)
  try {
    doc.addImage(WOUAKA_LOGO_BASE64, 'PNG', 10, 4, 30, 14);
  } catch {
    setColor(doc, COLORS.goldPrimary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('WOUAKA', 10, 13);
  }
  
  // Page number (right side)
  setColor(doc, COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - 10, 13, { align: 'right' });
};

const addFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Footer background
  setFillColor(doc, COLORS.greenDeep);
  doc.rect(0, pageHeight - FOOTER_HEIGHT, pageWidth, FOOTER_HEIGHT, 'F');
  
  // Footer text
  setColor(doc, COLORS.white);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${COMPANY_INFO.legalName} | ${PRODUCTION_DOMAIN}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );
};

const addCoverPage = (doc: jsPDF, data: ROIReportData) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Full green background
  setFillColor(doc, COLORS.greenDeep);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative gold elements
  setFillColor(doc, COLORS.goldPrimary);
  doc.rect(0, 95, pageWidth, 2, 'F');
  doc.rect(0, pageHeight - 60, pageWidth, 1, 'F');
  
  // Logo centered
  try {
    doc.addImage(WOUAKA_LOGO_BASE64, 'PNG', (pageWidth - 50) / 2, 30, 50, 22);
  } catch {
    setColor(doc, COLORS.goldPrimary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('WOUAKA', pageWidth / 2, 45, { align: 'center' });
  }
  
  // Main title
  setColor(doc, COLORS.white);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text("RAPPORT D'IMPACT", pageWidth / 2, 75, { align: 'center' });
  
  // Subtitle
  setColor(doc, COLORS.goldPrimary);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Analyse de Rentabilité Personnalisée', pageWidth / 2, 88, { align: 'center' });
  
  // Key figure highlight box
  setFillColor(doc, COLORS.white);
  doc.roundedRect(25, 110, pageWidth - 50, 45, 4, 4, 'F');
  
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ÉCONOMIE ANNUELLE POTENTIELLE', pageWidth / 2, 122, { align: 'center' });
  
  setColor(doc, COLORS.goldPrimary);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatCurrency(data.totalROI)} FCFA`, pageWidth / 2, 142, { align: 'center' });
  
  // Details section - 2 columns
  const detailsY = 175;
  const col1X = 30;
  const col2X = pageWidth / 2 + 10;
  
  setColor(doc, COLORS.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Left column
  doc.text('Volume de Crédit:', col1X, detailsY);
  setColor(doc, COLORS.goldPrimary);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatCurrency(data.volume)} FCFA`, col1X, detailsY + 7);
  
  setColor(doc, COLORS.white);
  doc.setFont('helvetica', 'normal');
  doc.text('Taux NPL Actuel:', col1X, detailsY + 20);
  setColor(doc, COLORS.goldPrimary);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.npl}%`, col1X, detailsY + 27);
  
  // Right column
  setColor(doc, COLORS.white);
  doc.setFont('helvetica', 'normal');
  doc.text('Nombre de Clients:', col2X, detailsY);
  setColor(doc, COLORS.goldPrimary);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatCurrency(data.clients)}`, col2X, detailsY + 7);
  
  setColor(doc, COLORS.white);
  doc.setFont('helvetica', 'normal');
  doc.text('Coût Acquisition (CAC):', col2X, detailsY + 20);
  setColor(doc, COLORS.goldPrimary);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatCurrency(data.cac)} FCFA`, col2X, detailsY + 27);
  
  // Date at bottom
  setColor(doc, COLORS.grayMedium);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = format(new Date(), "d MMMM yyyy", { locale: fr });
  doc.text(`Rapport généré le ${dateStr}`, pageWidth / 2, pageHeight - 35, { align: 'center' });
  
  // Compliance mention
  doc.setFontSize(7);
  doc.text('Conforme aux standards BCEAO/BEAC', pageWidth / 2, pageHeight - 25, { align: 'center' });
};

const addExecutiveSummary = (doc: jsPDF, data: ROIReportData) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxY = pageHeight - FOOTER_HEIGHT - 10;
  let y = CONTENT_START_Y;
  
  // Title
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé Exécutif', PAGE_MARGIN, y);
  
  // Underline
  setFillColor(doc, COLORS.goldPrimary);
  doc.rect(PAGE_MARGIN, y + 2, 50, 1.5, 'F');
  
  y += 18;
  
  // Main insight box
  setFillColor(doc, COLORS.grayLight);
  doc.roundedRect(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN * 2, 38, 3, 3, 'F');
  
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("L'analyse de votre portefeuille révèle un potentiel d'optimisation significatif.", PAGE_MARGIN + 8, y + 12);
  doc.text("En intégrant les solutions WOUAKA, vous pouvez réaliser :", PAGE_MARGIN + 8, y + 20);
  
  setColor(doc, COLORS.goldPrimary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${formatCurrency(data.totalROI)} FCFA d'économies annuelles`, PAGE_MARGIN + 8, y + 32);
  
  y += 50;
  
  // Breakdown section
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Répartition des Économies', PAGE_MARGIN, y);
  
  y += 12;
  
  // NPL Savings bar
  const barWidth = pageWidth - PAGE_MARGIN * 2 - 70;
  const nplRatio = data.totalROI > 0 ? data.savingsNPL / data.totalROI : 0;
  const opsRatio = data.totalROI > 0 ? data.savingsOPS / data.totalROI : 0;
  
  // NPL bar
  setColor(doc, COLORS.grayDark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Réduction des Impayés (NPL)', PAGE_MARGIN, y);
  
  setFillColor(doc, COLORS.grayLight);
  doc.roundedRect(PAGE_MARGIN, y + 3, barWidth, 12, 2, 2, 'F');
  
  if (nplRatio > 0) {
    setFillColor(doc, { r: 34, g: 197, b: 94 });
    doc.roundedRect(PAGE_MARGIN, y + 3, barWidth * nplRatio, 12, 2, 2, 'F');
  }
  
  setColor(doc, COLORS.greenDeep);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${formatCurrency(data.savingsNPL)} F`, PAGE_MARGIN + barWidth + 5, y + 11);
  
  y += 22;
  
  // OPS bar
  setColor(doc, COLORS.grayDark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Gains Opérationnels', PAGE_MARGIN, y);
  
  setFillColor(doc, COLORS.grayLight);
  doc.roundedRect(PAGE_MARGIN, y + 3, barWidth, 12, 2, 2, 'F');
  
  if (opsRatio > 0) {
    setFillColor(doc, { r: 59, g: 130, b: 246 });
    doc.roundedRect(PAGE_MARGIN, y + 3, barWidth * opsRatio, 12, 2, 2, 'F');
  }
  
  setColor(doc, COLORS.greenDeep);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${formatCurrency(data.savingsOPS)} F`, PAGE_MARGIN + barWidth + 5, y + 11);
  
  y += 28;
  
  // Key metrics grid
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicateurs Clés', PAGE_MARGIN, y);
  
  y += 10;
  
  const cardWidth = (pageWidth - PAGE_MARGIN * 2 - 16) / 3;
  const cards = [
    { label: 'Gain / Volume', value: `${data.percentageGain.toFixed(2)}%`, color: COLORS.goldPrimary },
    { label: 'NPL Projeté', value: `${data.projectedNPL.toFixed(1)}%`, color: { r: 34, g: 197, b: 94 } },
    { label: 'Réduction NPL', value: '-25%', color: { r: 59, g: 130, b: 246 } },
  ];
  
  cards.forEach((card, i) => {
    const x = PAGE_MARGIN + i * (cardWidth + 8);
    
    setFillColor(doc, COLORS.greenDeep);
    doc.roundedRect(x, y, cardWidth, 35, 3, 3, 'F');
    
    setColor(doc, COLORS.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + cardWidth / 2, y + 10, { align: 'center' });
    
    setColor(doc, card.color);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardWidth / 2, y + 25, { align: 'center' });
  });
};

const addProjectionPage = (doc: jsPDF, data: ROIReportData) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxY = pageHeight - FOOTER_HEIGHT - 10;
  let y = CONTENT_START_Y;
  
  // Title
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Projection sur 12 Mois', PAGE_MARGIN, y);
  
  setFillColor(doc, COLORS.goldPrimary);
  doc.rect(PAGE_MARGIN, y + 2, 55, 1.5, 'F');
  
  y += 16;
  
  // Monthly table
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthlyROI = data.totalROI / 12;
  const tableWidth = pageWidth - PAGE_MARGIN * 2;
  
  // Table header
  setFillColor(doc, COLORS.greenDeep);
  doc.rect(PAGE_MARGIN, y, tableWidth, 10, 'F');
  
  setColor(doc, COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Mois', PAGE_MARGIN + 5, y + 7);
  doc.text('Économie Mensuelle', PAGE_MARGIN + 45, y + 7);
  doc.text('Cumul', tableWidth - 10, y + 7);
  
  y += 10;
  
  // Table rows - compact
  months.forEach((month, i) => {
    const isEven = i % 2 === 0;
    if (isEven) {
      setFillColor(doc, COLORS.grayLight);
      doc.rect(PAGE_MARGIN, y, tableWidth, 8, 'F');
    }
    
    const cumul = monthlyROI * (i + 1);
    
    setColor(doc, COLORS.grayDark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(month, PAGE_MARGIN + 5, y + 5.5);
    doc.text(`${formatCurrency(Math.round(monthlyROI))} FCFA`, PAGE_MARGIN + 45, y + 5.5);
    
    setColor(doc, COLORS.greenDeep);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatCurrency(Math.round(cumul))} FCFA`, tableWidth - 10, y + 5.5);
    
    y += 8;
  });
  
  // Totals row
  setFillColor(doc, COLORS.goldPrimary);
  doc.rect(PAGE_MARGIN, y, tableWidth, 10, 'F');
  
  setColor(doc, COLORS.greenDeep);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL ANNUEL', PAGE_MARGIN + 5, y + 7);
  doc.text(`${formatCurrency(data.totalROI)} FCFA`, tableWidth - 10, y + 7);
  
  y += 20;
  
  // Visual graph area
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Courbe de Croissance', PAGE_MARGIN, y);
  
  y += 8;
  
  // Draw simplified bar chart
  const chartHeight = 40;
  const chartWidth = tableWidth;
  const barGap = 3;
  const barMaxHeight = chartHeight - 8;
  const singleBarWidth = (chartWidth - barGap * 11) / 12;
  
  setFillColor(doc, COLORS.grayLight);
  doc.roundedRect(PAGE_MARGIN, y, chartWidth, chartHeight, 3, 3, 'F');
  
  months.forEach((_, i) => {
    const barHeight = (barMaxHeight * (i + 1)) / 12;
    const x = PAGE_MARGIN + i * (singleBarWidth + barGap) + barGap / 2;
    
    setFillColor(doc, COLORS.goldPrimary);
    doc.roundedRect(x, y + chartHeight - barHeight - 4, singleBarWidth, barHeight, 1, 1, 'F');
  });
};

const addMethodologyPage = (doc: jsPDF, data: ROIReportData) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxY = pageHeight - FOOTER_HEIGHT - 10;
  let y = CONTENT_START_Y;
  
  // Title
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Méthodologie de Calcul', PAGE_MARGIN, y);
  
  setFillColor(doc, COLORS.goldPrimary);
  doc.rect(PAGE_MARGIN, y + 2, 60, 1.5, 'F');
  
  y += 18;
  
  // Formula 1
  setFillColor(doc, COLORS.grayLight);
  doc.roundedRect(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN * 2, 40, 3, 3, 'F');
  
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Économie sur les Impayés (Snpl)', PAGE_MARGIN + 8, y + 12);
  
  setColor(doc, COLORS.goldPrimary);
  doc.setFontSize(12);
  doc.text('Snpl = V × (N / 100) × 25%', PAGE_MARGIN + 8, y + 25);
  
  setColor(doc, COLORS.grayDark);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Réduction moyenne de 25% des impayés grâce au W-SCORE', PAGE_MARGIN + 8, y + 35);
  
  y += 50;
  
  // Formula 2
  setFillColor(doc, COLORS.grayLight);
  doc.roundedRect(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN * 2, 40, 3, 3, 'F');
  
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Économie Opérationnelle (Sops)', PAGE_MARGIN + 8, y + 12);
  
  setColor(doc, COLORS.goldPrimary);
  doc.setFontSize(12);
  doc.text('Sops = CAC × C × 15%', PAGE_MARGIN + 8, y + 25);
  
  setColor(doc, COLORS.grayDark);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text("Optimisation des coûts via l'automatisation KYC/Scoring", PAGE_MARGIN + 8, y + 35);
  
  y += 52;
  
  // Variables legend
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Légende des Variables', PAGE_MARGIN, y);
  
  y += 10;
  
  const variables = [
    { symbol: 'V', meaning: 'Volume de crédit annuel', value: `${formatCurrency(data.volume)} FCFA` },
    { symbol: 'N', meaning: 'Taux de NPL actuel', value: `${data.npl}%` },
    { symbol: 'CAC', meaning: "Coût d'acquisition client", value: `${formatCurrency(data.cac)} FCFA` },
    { symbol: 'C', meaning: 'Nombre de clients annuel', value: `${formatCurrency(data.clients)}` },
  ];
  
  variables.forEach((v, i) => {
    setColor(doc, COLORS.goldPrimary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(v.symbol, PAGE_MARGIN, y + i * 10);
    
    setColor(doc, COLORS.grayDark);
    doc.setFont('helvetica', 'normal');
    doc.text(`= ${v.meaning}`, PAGE_MARGIN + 18, y + i * 10);
    
    setColor(doc, COLORS.greenDeep);
    doc.setFont('helvetica', 'bold');
    doc.text(v.value, pageWidth - PAGE_MARGIN - 5, y + i * 10, { align: 'right' });
  });
  
  y += 50;
  
  // Compliance section
  if (y + 35 < maxY) {
    setFillColor(doc, COLORS.greenDeep);
    doc.roundedRect(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN * 2, 30, 3, 3, 'F');
    
    setColor(doc, COLORS.goldPrimary);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Conformité Réglementaire', PAGE_MARGIN + 8, y + 11);
    
    setColor(doc, COLORS.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Ce rapport est conforme aux standards BCEAO/BEAC pour la zone UEMOA/CEMAC.', PAGE_MARGIN + 8, y + 21);
  }
};

const addContactPage = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxY = pageHeight - FOOTER_HEIGHT - 10;
  let y = CONTENT_START_Y;
  
  // Title
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("Passez à l'Action", PAGE_MARGIN, y);
  
  setFillColor(doc, COLORS.goldPrimary);
  doc.rect(PAGE_MARGIN, y + 2, 45, 1.5, 'F');
  
  y += 18;
  
  // CTA Box
  setFillColor(doc, COLORS.goldPrimary);
  doc.roundedRect(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN * 2, 45, 4, 4, 'F');
  
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Prêt à transformer votre gestion du risque ?', pageWidth / 2, y + 14, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Nos experts sont disponibles pour une démonstration personnalisée.', pageWidth / 2, y + 26, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Contactez-nous dès maintenant', pageWidth / 2, y + 38, { align: 'center' });
  
  y += 58;
  
  // Contact details
  setColor(doc, COLORS.greenDeep);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Nos Coordonnées', PAGE_MARGIN, y);
  
  y += 12;
  
  const contacts = [
    { label: 'Email Commercial', value: COMPANY_INFO.email },
    { label: 'Support Technique', value: COMPANY_INFO.supportEmail },
    { label: 'Téléphone', value: COMPANY_INFO.phone },
    { label: 'Site Web', value: PRODUCTION_DOMAIN },
  ];
  
  contacts.forEach((c, i) => {
    setColor(doc, COLORS.grayDark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${c.label}:`, PAGE_MARGIN, y + i * 12);
    
    setColor(doc, COLORS.greenDeep);
    doc.setFont('helvetica', 'bold');
    doc.text(c.value, PAGE_MARGIN + 45, y + i * 12);
  });
  
  y += 58;
  
  // Legal entity
  if (y + 30 < maxY) {
    setFillColor(doc, COLORS.grayLight);
    doc.roundedRect(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN * 2, 28, 3, 3, 'F');
    
    setColor(doc, COLORS.grayDark);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY_INFO.legalName, PAGE_MARGIN + 8, y + 10);
    doc.text(`RCCM: ${COMPANY_INFO.rccm}`, PAGE_MARGIN + 8, y + 18);
    doc.text(COMPANY_INFO.address, PAGE_MARGIN + 8, y + 26);
  }
  
  // Disclaimer at bottom
  setColor(doc, COLORS.grayMedium);
  doc.setFontSize(6);
  doc.text(
    'Ce document est fourni à titre informatif. Les projections sont basées sur les paramètres saisis.',
    pageWidth / 2,
    maxY - 5,
    { align: 'center' }
  );
};

export const generateROIReport = async (data: ROIReportData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const totalPages = 5;
  
  // Page 1: Cover
  addCoverPage(doc, data);
  
  // Page 2: Executive Summary
  doc.addPage();
  addHeader(doc, 2, totalPages);
  addExecutiveSummary(doc, data);
  addFooter(doc);
  
  // Page 3: Projection
  doc.addPage();
  addHeader(doc, 3, totalPages);
  addProjectionPage(doc, data);
  addFooter(doc);
  
  // Page 4: Methodology
  doc.addPage();
  addHeader(doc, 4, totalPages);
  addMethodologyPage(doc, data);
  addFooter(doc);
  
  // Page 5: Contact
  doc.addPage();
  addHeader(doc, 5, totalPages);
  addContactPage(doc);
  addFooter(doc);
  
  // Generate filename with date
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const filename = `WOUAKA_Rapport_Impact_${dateStr}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};
