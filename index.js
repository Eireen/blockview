const App = require('./App')


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


;(new App()).run()
