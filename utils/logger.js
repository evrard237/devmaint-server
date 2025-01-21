import { format} from 'date-fns'
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as promises from 'fs/promises';

import * as path from 'path';


const logEvents = async (message, logFileName) => {
    const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss')
    const logItem = `${dateTime}\t${uuidv4()}\t${message}\n`

    try {
        if (!fs.fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await promises.promises.mkdir(path.join(__dirname, '..', 'logs'))
        }
        await promises.promises.appendFile(path.join(__dirname, '..', 'logs', logFileName), logItem)
    } catch (err) {
        console.log(err)
    }
}

const logger = (req, res, next) => {
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log')
    console.log(`${req.method} ${req.path}`)
    next()
}

// module.exports = { logEvents, logger }
export { logEvents, logger };