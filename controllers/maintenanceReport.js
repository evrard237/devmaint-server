import express from "express";
import Device from "../db/models/device.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import MaintenanceReport from "../db/models/maintenanceReport.js";
import MaintenanceCall from "../db/models/maintenanceCall.js";
import PDFDocument from 'pdfkit';
import moment from 'moment';

const app = express();
app.use(express.json());

// --- HELPER FUNCTIONS (UNCHANGED) ---
export const createMaintenanceReport = asyncErrorHandler(async (req, res, next) => {
    const { device, type, working_status, nature_of_problem, report, recommendations, maintenanceCallId } = req.body;
    if (!maintenanceCallId) { return res.status(400).json({ message: "Maintenance Call ID is required to file a report." }); }
    const newMaintenanceReport = new MaintenanceReport({ device, user: req.user._id, maintenanceCall: maintenanceCallId, type, working_status, nature_of_problem, report, recommendations });
    await newMaintenanceReport.save();
    await Device.findByIdAndUpdate(device, { $set: { status: working_status } });
    await MaintenanceCall.findByIdAndUpdate(maintenanceCallId, { $set: { call_status: "completed" } });
    res.status(201).json(newMaintenanceReport);
});

export const getListMaintenanceReport = asyncErrorHandler(async (req, res, next) => {
    const list = await MaintenanceReport.find({}).populate({ path: 'device', select: 'name' }).populate({ path: 'user', select: 'name' }).sort({ report_number: -1 });
    res.status(200).json(list);
});

const getFullReportDetails = async (reportId) => {
    const report = await MaintenanceReport.findById(reportId)
        .populate({ path: 'device', populate: { path: 'department', select: 'name' } })
        .populate('user')
        .populate({ path: 'maintenanceCall', populate: { path: 'user', select: 'name' } });
    return report;
};

export const getSingleMaintenanceReport = asyncErrorHandler(async (req, res) => {
    const maintenanceReport = await getFullReportDetails(req.params.id);
    if (!maintenanceReport) { return res.status(404).json({ message: "Report not found" }); }
    res.status(200).json(maintenanceReport);
});
// --- END OF UNCHANGED HELPER FUNCTIONS ---


// --- REWRITTEN PDF GENERATION LOGIC ---
const generatePdfContent = (doc, report) => {
    // --- HEADER ---
    doc.fontSize(9).font('Helvetica').text('REPUBLIQUE DU CAMEROUN\nPaix-Travail-Patrie', 60, 40, { align: 'center', width: 150 });
    doc.fontSize(9).font('Helvetica').text('REPUBLIC OF CAMEROON\nPeace-Work-Fatherland', doc.page.width - 60 - 150, 40, { align: 'center', width: 150 });
    try { doc.image('assets/chu-logo.png', 97, 95, { width: 50 }); } catch (e) { console.error("Could not load left logo."); }
    try { doc.image('assets/chu-logo.png', 445, 95, { width: 50 }); } catch (e) { console.error("Could not load right logo."); }
    doc.fontSize(8).font('Helvetica-Bold').text('YAOUNDE', 97, 150, { align: 'center', width: 50 });
    doc.fontSize(8).font('Helvetica-Bold').text('YAOUNDE', 445, 150, { align: 'center', width: 50 });
    
    // --- CORRECTED HEADER CENTERING ---
    doc.fontSize(11).font('Helvetica-Bold').text('CENTRE HOSPITALIER UNIVERSITAIRE DE YAOUNDE', 37, 105, { align: 'center' });
    doc.fontSize(9).font('Helvetica').text('YAOUNDE UNIVERSITY AND TEACHING HOSPITAL', 37, 120, { align: 'center' });
    doc.fontSize(8).text('DIRECTION GENERALE / GENERAL DIRECTORATE', 37, 135, { align: 'center' });
    doc.fontSize(8).text('SERVICE DES EQUIPEMENTS ET INFRASTRUCTURES GENERAUX', 30, 145, { align: 'center' });

    // Main Title with Box
    const title = "RAPPORT DE MAINTENANCE";
    const titleY = 180;
    doc.font('Helvetica-Bold').fontSize(12);
    const textWidth = doc.widthOfString(title);
    const padding = 10;
    const boxWidth = textWidth + (padding * 2);
    const boxHeight = doc.currentLineHeight() + padding;
    const boxX = (doc.page.width - boxWidth) / 2;
    doc.rect(boxX, titleY, boxWidth, boxHeight).stroke();
    doc.text(title, boxX, titleY + (padding / 2), { width: boxWidth, align: 'center' });
    doc.moveDown(4);

    // --- NEW: Layout constants for perfect alignment ---
    const pageMargin = 50;
    const contentStartX = pageMargin;
    const labelColumnWidth = 180; // Width for the label column
    const valueColumnX = contentStartX + labelColumnWidth;

    // --- REWRITTEN HELPER FUNCTIONS FOR CLEAN LAYOUT ---
    const addField = (label, value) => {
        const currentY = doc.y; // Capture the starting Y position
        const valueStr = String(value || 'N/A');

        // Calculate the height of the value text, as it might wrap to multiple lines
        const valueHeight = doc.heightOfString(valueStr, {
            width: doc.page.width - valueColumnX - pageMargin,
            align: 'left'
        });

        // Write the label, vertically aligned to the top
        doc.font('Helvetica-Bold').text(label, contentStartX, currentY, { width: labelColumnWidth - 10 });
        
        // Write the value, also vertically aligned to the SAME top position
        doc.font('Helvetica').text(valueStr, valueColumnX, currentY, { width: doc.page.width - valueColumnX - pageMargin, align: 'left' });

        // Manually move the cursor down based on the height of the value text plus a margin
        doc.y = currentY + valueHeight + 12;
    };
    
    const addSection = (label) => {
        doc.moveDown(1.5);
        doc.font('Helvetica-Bold').fontSize(11).text(label, contentStartX, doc.y, { underline: true });
        doc.moveDown(1);
    };

    const addBlockText = (label, text) => {
        doc.font('Helvetica-Bold').fontSize(10).text(label, contentStartX, doc.y);
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10).text(text || 'N/A', contentStartX + 20, doc.y, {
            align: 'justify',
            width: doc.page.width - contentStartX - pageMargin - 20
        });
        doc.moveDown(1.5);
    };

    doc.fontSize(10);

    // --- PDF BODY ---
    addSection("Informations Générales");
    addField("Numéro du Rapport", report.report_number);
    addField("Date du Rapport", moment(report.createdAt).format('DD/MM/YYYY HH:mm'));
    addField("Type de Maintenance", report.type.charAt(0).toUpperCase() + report.type.slice(1));

    addSection("Informations sur l'Appel de Maintenance");
    addField("Date de l'Appel", moment(report.maintenanceCall.createdAt).format('DD/MM/YYYY HH:mm'));
    addField("Initiateur de l'Appel", report.maintenanceCall.user.name);

    addSection("Détails de l'Équipement");
    addField("Nom de l'Équipement", report.device.name);
    addField("Modèle", report.device.model);
    addField("Numéro de Série", report.device.serial_number);
    addField("Département", report.device.department?.name);
    
    addSection("Rapport d'Intervention");
    addBlockText("Problème Signalé:", report.nature_of_problem);
    addBlockText("Action Effectuée:", report.report);
    addBlockText("Interprétation et Recommandations:", report.recommendations);

    addSection("Conclusion");
    addField("Statut Final de l'Équipement", report.working_status);
    addField("Intervention Réalisée Par (Technicien)", report.user.name);
    addField("Contact du Technicien", report.user.phone_number);

    doc.end();
};


export const downloadReportPDF = asyncErrorHandler(async (req, res, next) => {
    const report = await getFullReportDetails(req.params.id);
    if (!report) { return res.status(404).json({ message: "Report not found" }); }
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-maintenance-${report.report_number}.pdf"`);
    doc.pipe(res);
    generatePdfContent(doc, report);
});

export const previewReportPDF = asyncErrorHandler(async (req, res, next) => {
    const report = await getFullReportDetails(req.params.id);
    if (!report) { return res.status(404).json({ message: "Report not found" }); }
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="rapport-maintenance-${report.report_number}.pdf"`);
    doc.pipe(res);
    generatePdfContent(doc, report);
});