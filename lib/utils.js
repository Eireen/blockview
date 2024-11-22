
if (global.blockviewLog) {
    console.error('Global name conflict: `blockviewLog` already exists')
    return
}
global.blockviewLog = function(variable, varName = null) {
    if (varName) console.log(`// ---- ${varName} ----`)
    console.log(`;(${
        JSON.stringify(variable, null, '\t')
    });\n`)
}


/**
 * Thanks to https://stackoverflow.com/questions/20018588/how-to-monitor-the-memory-usage-of-node-js/64550489#64550489
 * @param {String} title
 */
function logMemoryUsage(title) {
    const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`

    const memoryData = process.memoryUsage()

    const memoryUsage = {
        rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
        heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
        heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
        external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
    }

    blockviewLog(memoryUsage, title)
}


module.exports = {
    logMemoryUsage,
}
