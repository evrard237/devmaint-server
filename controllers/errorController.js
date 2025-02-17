import CustomError from '../utils/customErrors.js'

const devErrors = (res, error) => {
    res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
        stackTrace: error.stack,
        error: error
    });
}

const castErrorHandler = (err) => {
    const msg = `Invalid value for ${err.path}: ${err.value}!`
    return new CustomError(msg, 400);
}

const duplicateKeyErrorHandler = (err) => {
    
    const keyName = Object.keys(err.keyValue)[0];
    
 const name = err.keyValue.name;
 
 const msg = `The entered ${keyName} already exists. Please use another ${keyName}!`;
 
 return  new CustomError(msg, 400);
}

const validationErrorHandler = (err) => {
    const errors = Object.values(err.errors).map(val => val.message);
    const errorMessages = errors.join('. ');
    const msg = `Invalid input data: ${errorMessages}`;

    return new CustomError(msg, 400);
}

const handleExpiredJWT = (err) =>{
    console.log("expired token")
    return  new CustomError('JWT expired. Please login again!',401)
}

const prodErrors = (res, error) => {

   

    if(error.isOperational){
       
        res.status(error.statusCode).json({
            status: error.statusCode,
            message: error.message
        });
    }else {
        
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong! Please try again later.'
        })
    }
}

export default (error, req, res, next) => {

    

    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';
    

    
    if(process.env.NODE_ENV === 'development'){
       
       

        devErrors(res, error);
    } else if(process.env.NODE_ENV === 'production'){
        
        if(error.name === 'CastError') error = castErrorHandler(error);
        if(error.code === 11000) error = duplicateKeyErrorHandler(error);
        if(error.name === 'ValidationError') error = validationErrorHandler(error);
        if(error.name === 'TokenExpiredError') error = handleExpiredJWT(error);

        prodErrors(res, error);
    }
}