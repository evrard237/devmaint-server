import express from "express"
import Department from "../db/models/department.js";
import Device from "../db/models/device.model.js";
import Notification from "../db/models/notification.js";




const app = express()
app.use(express.json());




export const createNotification = async (req,res,next) =>{

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
            
               next(error)
               
            }
    
    
}



export const getNotifications = async(req,res) =>{
    console.log(req.user);
    
    try {
        Department.find({}).then((departments)=>{
            res.send(departments);
        })
    } catch (error) {
        console.log(error)
    }
}

export const getSingleNotification = async(req,res) =>{
    try {
        Department.findById({_id: req.params.id}).then((department)=> {
            res.send(department);
        });
    } catch (error) {
        console.log(error);
    }
}

// export const updateDepartment = async(req,res) =>{
//     try {
//         Department.findOneAndUpdate({_id: req.params.id},{
//             $set: req.body
//         }).then(() =>{
//             res.sendStatus(200);
//         });
        
//     } catch (error) {
        
//     }
// }

export const deleteNotification = async(req,res) =>{
    try {
        Department.findOneAndDelete({_id: req.params.id}).then((deletedelm) => {
            res.send(deletedelm);
        })
    } catch (error){
        console.log(error)
    }
}






