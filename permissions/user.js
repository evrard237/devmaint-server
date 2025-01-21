

export const canViewUser = (user,device) => {
    return (
        user.role === "admin" || user.department === device.department
    )
}

export const accessPermission = (permissions) =>{
    return(req,res,next) =>{
       
        const userRole = req.user.role
        if(permissions.includes(userRole)){
            next()
        }else{
            res.status(401).json("you do not have the permission")
        }
    }
}