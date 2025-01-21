// import { Department } from '../db/models/department'
import express from "express"

// import mongoose from 'mongoose'
import {mongoose} from "../db/mongoose.js"
import Department from "../db/models/department.js"




const app = express()
app.use(express.json());




export const createDepartment = async (req,res,next) =>{

    let department = req.body;

    
     console.log('received input',department);
     
       
        let newDepartment = new Department({
            name: department.name,
            short_name: department.short_name,
            
       
        });

        try {
            await newDepartment.save().then((departmentDoc) =>{
                res.send(departmentDoc)
            });
            } 
            catch (error) {
                console.log("error",error);
                
               next(error)
               
            }
    
    
}



export const getDepartments = async(req,res) =>{
    console.log(req.user);
    
    try {
        Department.find({}).then((departments)=>{
            res.send(departments);
        })
    } catch (error) {
        console.log(error)
    }
}

export const getSingleDept = async(req,res) =>{
    try {
        Department.findById({_id: req.params.id}).then((department)=> {
            res.send(department);
        });
    } catch (error) {
        console.log(error);
    }
}

export const updateDepartment = async(req,res) =>{
    try {
        Department.findOneAndUpdate({_id: req.params.id},{
            $set: req.body
        }).then(() =>{
            res.sendStatus(200);
        });
        
    } catch (error) {
        
    }
}

export const deleteDepartment = async(req,res) =>{
    try {
        Department.findOneAndDelete({_id: req.params.id}).then((deletedelm) => {
            res.send(deletedelm);
        })
    } catch (error){
        console.log(error)
    }
}






