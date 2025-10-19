import User from "../db/models/user.js";
import Schedule from "../db/models/schedule.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customErrors.js";
import PDFDocument from 'pdfkit';

/**
 * @desc    Generate the night shift schedule with the FINAL corrected Sunday logic.
 * @route   POST /api/schedule/generate
 * @access  Private (Admin)
 */
export const generateSchedule = asyncErrorHandler(async (req, res, next) => {
    const { year, month } = req.body;

    if (!year || !month) {
        return next(new CustomError("Year and month are required.", 400));
    }
    
    // Anchor Point: 'TANGMO' starts on Monday, October 13, 2025.
    const ANCHOR_STAFF_NAME = "TANGMO";
    const ANCHOR_DATE = new Date(Date.UTC(2025, 9, 13));

    const staffOnRotation = await User.find({ isOnRotation: true, role: 'technician' }).sort({ rotationOrder: 1 });
    
    if (staffOnRotation.length < 1) {
        return next(new CustomError("No staff members are assigned to rotation.", 404));
    }

    const anchorStaffIndex = staffOnRotation.findIndex(user => user.name.toLowerCase() === ANCHOR_STAFF_NAME.toLowerCase());

    if (anchorStaffIndex === -1) {
        return next(new CustomError(`Anchor staff member '${ANCHOR_STAFF_NAME}' not found in the rotation list.`, 404));
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const scheduleEntries = [];
    
    // --- FINAL CORRECTED SUNDAY LOGIC ---
    let mondayStaffForCurrentWeek = null; // Variable to hold the assignment for the current week's Monday

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 1 = Monday

        let assignedStaff;

        // Calculate the daily rotation for Monday through Saturday
        const dayDifference = Math.round((currentDate.getTime() - ANCHOR_DATE.getTime()) / (1000 * 60 * 60 * 24));
        const staffIndexRaw = anchorStaffIndex + dayDifference;
        const staffIndex = ((staffIndexRaw % staffOnRotation.length) + staffOnRotation.length) % staffOnRotation.length;
        const dailyRotationStaff = staffOnRotation[staffIndex];

        if (dayOfWeek === 1) { // If it's a Monday
            assignedStaff = dailyRotationStaff;
            mondayStaffForCurrentWeek = assignedStaff; // Store this assignment
        } else if (dayOfWeek === 0) { // If it's a Sunday
            assignedStaff = mondayStaffForCurrentWeek; // Use the stored assignment from Monday
        } else { // For Tuesday to Saturday
            assignedStaff = dailyRotationStaff;
        }

        if (assignedStaff) {
            scheduleEntries.push({
                updateOne: {
                    filter: { date: currentDate },
                    update: {
                        $set: {
                            date: currentDate,
                            dayOfWeek: currentDate.toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' }),
                            onDutyStaff: assignedStaff._id,
                        },
                    },
                    upsert: true,
                },
            });
        }
    }

    await Schedule.bulkWrite(scheduleEntries);
    
    res.status(201).json({ status: "success", message: `Schedule for ${month}/${year} generated successfully with corrected logic.` });
});


/**
 * @desc    Get the schedule for a given month and year
 * @route   GET /api/schedule/:year/:month
 * @access  Private
 */
export const getSchedule = asyncErrorHandler(async (req, res, next) => { 
    const { year, month } = req.params;
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const schedule = await Schedule.find({
        date: { $gte: startDate, $lt: endDate },
    }).populate('onDutyStaff', 'name phone_number');

    res.status(200).json({
        status: 'success',
        results: schedule.length,
        data: schedule,
    });
});


/**
 * @desc    Download the schedule PDF - Final version with boxed title
 * @route   GET /api/schedule/download/:year/:month
 * @access  Private
 */
export const downloadSchedulePDF = asyncErrorHandler(async (req, res, next) => {
    const { year, month } = req.params;
    const monthName = new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long' }).toUpperCase();

    // Fetch data
    const scheduleData = await Schedule.find({ date: { $gte: new Date(Date.UTC(year, month - 1, 1)), $lt: new Date(Date.UTC(year, month, 1)) } }).populate('onDutyStaff', 'name phone_number').sort({ date: 'asc' });
    const onRotationUsers = await User.find({ isOnRotation: true, role: 'technician' }).sort({ name: 1 });
    const supervisor = await User.findOne({ name: "kodji yolande" });

    // Create PDF in PORTRAIT mode
    const doc = new PDFDocument({ size: 'A4', margin: 30 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="planning-gardes-${month}-${year}.pdf"`);
    doc.pipe(res);

    // --- PDF Content Generation (NO CHANGES HERE) ---
    const pageMargin = 60;

    // HEADER
    doc.fontSize(9).font('Helvetica').text('REPUBLIQUE DU CAMEROUN\nPaix-Travail-Patrie', pageMargin, 40, { align: 'center', width: 150 });
    doc.fontSize(9).font('Helvetica').text('REPUBLIC OF CAMEROON\nPeace-Work-Fatherland', doc.page.width - pageMargin - 150, 40, { align: 'center', width: 150 });
    
    try {
        doc.image('assets/chu-logo.png', 95, 95, { width: 50 });
    } catch (error) { console.error("Could not load left chu-logo.png."); }
    try {
        doc.image('assets/chu-logo.png', 445, 95, { width: 50 });
    } catch (error) { console.error("Could not load right chu-logo.png."); }

    doc.fontSize(8).font('Helvetica-Bold').text('YAOUNDE', 95, 150, { align: 'center', width: 50 });
    doc.fontSize(8).font('Helvetica-Bold').text('YAOUNDE', 445, 150, { align: 'center', width: 50 });

    doc.fontSize(11).font('Helvetica-Bold').text('CENTRE HOSPITALIER UNIVERSITAIRE DE YAOUNDE', 25, 105, { align: 'center' });
    doc.fontSize(9).font('Helvetica').text('YAOUNDE UNIVERSITY AND TEACHING HOSPITAL', 25, 120, { align: 'center' });
    doc.fontSize(8).text('DIRECTION GENERALE / DIRECTORATE', 25, 135, { align: 'center' });
    doc.fontSize(8).text('SERVICE DES EQUIPEMENTS ET INFRASTRUCTURES GENERAUX', 25, 145, { align: 'center' });

    // MAIN TITLE
    const title = `PLANNING DES GARDES DU MOI D'${monthName} ${year} POUR LE SERVICE TECHNIQUE.`;
    const titleY = 185;
    doc.font('Helvetica-Bold').fontSize(10);
    const textWidth = doc.widthOfString(title);
    const textHeight = doc.heightOfString(title);
    const padding = 8;
    const boxWidth = textWidth + (padding * 2);
    const boxHeight = textHeight + (padding * 2);
    const boxX = (doc.page.width - boxWidth) / 2;
    doc.rect(boxX, titleY, boxWidth, boxHeight).stroke();
    doc.text(title, boxX, titleY + padding, { width: boxWidth, align: 'center' });

    // Table Drawing
    const dayInitialMap = { "Monday": "L", "Tuesday": "M", "Wednesday": "M", "Thursday": "J", "Friday": "V", "Saturday": "S", "Sunday": "D" };
    
    const drawWeekBlock = (weekData, startX, startY) => {
        if (!weekData || weekData.length === 0) return;
        const colWidthDay = 25, colWidthName = 100, rowHeight = 15, blockWidth = colWidthDay + colWidthName;
        const firstDay = weekData[0].date.getUTCDate().toString().padStart(2, '0');
        const lastDay = weekData[weekData.length - 1].date.getUTCDate().toString().padStart(2, '0');
        doc.font('Helvetica-Bold').fontSize(8).text(`DU ${firstDay} AU ${lastDay}`, startX, startY - 12, { width: blockWidth, align: 'center' });
        let currentY = startY;
        weekData.forEach(day => {
            const dayInitial = dayInitialMap[day.dayOfWeek];
            doc.rect(startX, currentY, blockWidth, rowHeight).stroke();
            doc.rect(startX, currentY, colWidthDay, rowHeight).stroke();
            doc.font('Helvetica').fontSize(8).text(dayInitial, startX, currentY + 4, { width: colWidthDay, align: 'center' });
            doc.text(day.onDutyStaff ? day.onDutyStaff.name.toUpperCase() : 'N/A', startX + colWidthDay + 5, currentY + 4);
            currentY += rowHeight;
        });
    };

    const weeks = [
        scheduleData.filter(d => d.date.getUTCDate() >= 6 && d.date.getUTCDate() <= 12),
        scheduleData.filter(d => d.date.getUTCDate() >= 13 && d.date.getUTCDate() <= 19),
        scheduleData.filter(d => d.date.getUTCDate() >= 20 && d.date.getUTCDate() <= 26),
        scheduleData.filter(d => d.date.getUTCDate() >= 27 && d.date.getUTCDate() <= 31),
    ];

    drawWeekBlock(weeks[0], 60, 240);
    drawWeekBlock(weeks[1], 235, 240);
    drawWeekBlock(weeks[2], 410, 240);
    drawWeekBlock(weeks[3], 60, 370);

    // FOOTER
    const footerY = 500;
    doc.fontSize(9).font('Helvetica-Bold').text('Contact téléphonique:', pageMargin, footerY);
    let contactY = footerY + 15;
    onRotationUsers.forEach(user => {
        doc.fontSize(9).font('Helvetica').text(`${user.name.toUpperCase()}: ${user.phone_number}`, pageMargin, contactY);
        contactY += 12;
    });
    doc.fontSize(9).font('Helvetica-Bold').text('NB: Les intéressés auront droit à 24 heures de récupération', pageMargin, contactY + 20);

    const supervisionX = 235;
    doc.fontSize(9).font('Helvetica-Bold').text('Supervision:', supervisionX, footerY);
    if (supervisor) {
        doc.fontSize(9).font('Helvetica').text(`${supervisor.name.toUpperCase()}`, supervisionX, footerY + 15);
        doc.fontSize(9).font('Helvetica').text(`${supervisor.phone_number}`, supervisionX, footerY + 27);
    }

    doc.fontSize(9).font('Helvetica-Bold').text('LE DIRECTEUR GENERAL', doc.page.width - pageMargin - 150, footerY + 100, { align: 'center', width: 150 });

    doc.end();
});