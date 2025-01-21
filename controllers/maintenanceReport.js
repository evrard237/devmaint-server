// import { Department } from '../db/models/department'
import express from "express"

// import mongoose from 'mongoose'
import {mongoose} from "../db/mongoose.js"

import Device from "../db/models/device.model.js";

import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import MaintenanceReport from "../db/models/maintenanceReport.js";




const app = express()
app.use(express.json());




export const createMaintenanceReport = asyncErrorHandler (async (req,res,next) =>{

    let maintenanceReportInput = req.body;

    
     
       
        let newMaintenanceReport = new MaintenanceReport({
            device_name: maintenanceReportInput.device_name,
            model: maintenanceReportInput.model,
            serial_number: maintenanceReportInput.serial_number,
            department: maintenanceReportInput.department,
            user_name: req.user.name,
            type: maintenanceReportInput.type,
            working_status: maintenanceReportInput.working_status,
            nature_of_problem: maintenanceReportInput.nature_of_problem,
            report: maintenanceReportInput.report
            
           
       
        });

        try {
            await Device.findOneAndUpdate({name: maintenanceReportInput.device_name},{$set:{"status": maintenanceReportInput.working_status}})
            await newMaintenanceReport.save().then((maintenanceReportDoc) =>{
                res.send(maintenanceReportDoc)
            });
            } 
            catch (error) {
            
               next(error)
               
            }
    
    
})



export const getListMaintenanceReport = asyncErrorHandler(async(req,res,next) =>{
    
    try {
        MaintenanceReport.find({}).then((list)=>{
            res.send(list);
        })
    } catch (error) {
        
        next(error)
    }
})

export const sortReportByDevice = asyncErrorHandler( async (req,res,next)=>{
    try {
        MaintenanceReport.find({device_name: req.body.deviceName}).then((report)=>{
            res.send(report)
        })
    } catch (error) {
        next(error)
    }
})

export const getSingleMaintenanceReport = async(req,res) =>{
    try {
        MaintenanceReport.findById({_id: req.params.id}).then((maintenanceReport)=> {
            res.send(maintenanceReport);
        });
    } catch (error) {
        console.log(error);
    }
}

export const updateMaintenanceReport = asyncErrorHandler(async(req,res,next) =>{
    try {
        
       await MaintenanceReport.findOneAndUpdate({_id: req.params.id},{
            $set: req.body
        }).then(() =>{
             Device.findOneAndUpdate({name: maintenanceReportInput.device_name},{$set:{"status": maintenanceReportInput.working_status}})
            res.sendStatus(200);
        });
        
    } catch (error) {
        next(error)
    }
})

// export const deleteDepartment = async(req,res) =>{
//     try {
//         Department.findOneAndDelete({_id: req.params.id}).then((deletedelm) => {
//             res.send(deletedelm);
//         })
//     } catch (error){
//         console.log(error)
//     }
// }






