

export const canViewUser = (user,device) => {
    return (
        user.role === "admin" || user.department?.name === device.department.name
    )
}

export const accessPermission = (permissions) =>{
    return(req,res,next) =>{
       console.log("permissions",permissions);
       
        const userRole = req.user.role
        if(permissions.includes(userRole)){
            next()
        }else{
            res.status(401).json("you do not have the permission")
        }
    }
}