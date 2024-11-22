const fs = require('fs')
const path = require('path')

// TODO: REMOVE?

class FilesASTParser {

    /**
     * @public
     * @param {String} filePath
     */
    parseFile(filePath) {
        this.blockDepTreeNodes = []

        const fileContents = this.readFile(filePath)
        const ast = this.parseFileAST(fileContents)
        this.traverseFileAST(ast)

        return this.blockDepTreeNodes
    }
}


module.exports = FilesASTParser


// const fileName = '/var/projects/kh/slices/accounting/front/root/_/app/js/view/tb_metering_device.js'
// const blockDepTreeNodes = (new FileASTParser()).parseFile(fileName)

// console.log('// ---- blockDepTreeNodes ----')
// console.log(`;(${JSON.stringify(blockDepTreeNodes, null, '\t')});\n`)

