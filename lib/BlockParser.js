const path = require('path')
const ConfigManager = require('./ConfigManager')
const SliceFileReader = require('./SliceFileReader')
const FileASTParser = require('./FileASTParser')
const { logMemoryUsage } = require('./utils')

class BlockParser {

    constructor(options) {
        // TODO: specify options: callStackFor, config
        Object.assign(this, options)
    }

    async run() {

        logMemoryUsage('start')

        let configObject
        try {
            configObject = this.readConfigFile()
        } catch (err) {
            // TODO: create custom `ConfigFileNotExists` error type and check it
            if (err.message.includes('does not exist')) {
                console.log(err.message)
            }
            return
        }

        const configManager = new ConfigManager(configObject)
        this.config = configManager.getNormalized()

        const slicesWithFiles = await this.readSlicesFiles(this.config.slices)

        logMemoryUsage('after readSlicesFiles')

        // blockviewLog(slicesWithFiles)


        // ==== TMP FOR DEBUG ====
        // const testFrontDataFiles = [
        //     {
        //         "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/data/tb_metering_device.js"
        //     },
        //     {
        //         "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/data/tb_oki.js"
        //     },
        //     {
        //         "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/data/voc_territory_types.js"
        //     },
        //     {
        //         "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/data/tb_uspd_roster.js"
        //     },
        // ]
        // const testFrontViewFiles = [
        //     {
        //         "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/view/tb_metering_device.js"
        //     },
        //     {
        //         "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/view/tb_oki.js"
        //     },
        //     {
        //         "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/view/voc_territory_types.js"
        //     },
        //     {
        //         // тут нет show_block-ов
        //         "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/view/tb_uspd_roster.js"
        //     },
        //     {
        //         "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/view/tb_tko_areas.js"
        //     },
        // ]
        // slicesWithFiles[0].files.models = [] // скрываем на период дебага
        // slicesWithFiles[0].files.controllers = []
        // slicesWithFiles[0].files.frontHtml = []
        // slicesWithFiles[0].files.frontData = testFrontDataFiles
        // slicesWithFiles[0].files.frontView = testFrontViewFiles
        // blockviewLog(slicesWithFiles, 'slicesWithFiles with test data')

        this.buildBlockDepTrees(slicesWithFiles)
        // blockviewLog(slicesWithFiles, `slicesWithFiles`)

        const fullBlockDepTreeNodes = this.mergeBlockDepTrees(slicesWithFiles)

        logMemoryUsage('after fullBlockDepTreeNodes')

        // blockviewLog(fullBlockDepTreeNodes, `fullBlockDepTreeNodes`)
        blockviewLog(fullBlockDepTreeNodes.length, `fullBlockDepTreeNodes length`)

        if (this.callStackFor) {
            const blockOrFunctionNames = this.callStackFor.split(',')
            const callStacks = this.findCallStacks({
                fullBlockDepTreeNodes,
                blockOrFunctionNames,
            })
            blockviewLog(callStacks, `callStacks`)

            const conciseCallStacks = this.formatConcisely(callStacks)
            blockviewLog(conciseCallStacks, `conciseCallStacks`)

            return { callStacks: conciseCallStacks }
        }

        // return fullBlockDepTreeNodes  // not used for now
    }

    readConfigFile() {
        return ConfigManager.requireConfigFile(
            // TODO: read config file name from cli args
            path.resolve(path.dirname(__filename), '../config.js')
        )
    }

    async readSlicesFiles(sliceConfigs) {
        const result = []
        for (let sliceConfig of sliceConfigs) {
            const sliceFiles = await (new SliceFileReader({ moduleConfig: sliceConfig }).read())
            result.push({
                ...sliceConfig,
                files: sliceFiles,
            })
        }
        return result
    }

    buildBlockDepTrees(sliceConfigs) {
        for (let sliceConfig of sliceConfigs) {
            sliceConfig.blockHandlersByType = {}
            sliceConfig.blockDepTreeNodes = []
            for (let handlersType of ['frontData', 'frontView']) {
                for (let { fullFilePath } of sliceConfig.files[handlersType]) {
                    const { blockHandlersByType, blockDepTreeNodes } = (new FileASTParser()).parseFile(fullFilePath)

                    // Отключим сбор списка всех блоков, т.к. пока не нужны
                    // this.mergeBlockHandlersByType(sliceConfig.blockHandlersByType, blockHandlersByType)

                    if (blockDepTreeNodes?.length) {
                        // blockviewLog(blockDepTreeNodes, `FILE blockDepTreeNodes`)

                        for (let node of blockDepTreeNodes) {
                            node.parentBlockSliceRootPath = sliceConfig.rootPath
                        }
                        sliceConfig.blockDepTreeNodes = [ ...sliceConfig.blockDepTreeNodes, ...blockDepTreeNodes ]
                    }
                }
            }
        }
    }

    mergeBlockHandlersByType(targetRef, ...sourceRefs) {
        for (let sourceRef of sourceRefs) {
            for (let blockHandlerType in sourceRef) {
                if (!targetRef[blockHandlerType]) targetRef[blockHandlerType] = {}
                for (let blockHandlerName in sourceRef[blockHandlerType]) {
                    if (!targetRef[blockHandlerType][blockHandlerName]) {
                        targetRef[blockHandlerType][blockHandlerName] = sourceRef[blockHandlerType][blockHandlerName]
                    } else {
                        // TODO: warn about multiple entries of same handler
                        if (!Array.isArray(targetRef[blockHandlerType][blockHandlerName])) {
                            targetRef[blockHandlerType][blockHandlerName] = [ targetRef[blockHandlerType][blockHandlerName] ]
                        }
                        targetRef[blockHandlerType][blockHandlerName].push(sourceRef[blockHandlerType][blockHandlerName])
                    }
                }
            }
        }
    }

    mergeBlockDepTrees(sliceConfigs) {
        let fullBlockDepTreeNodes = []
        for (let sliceConfig of sliceConfigs) {
            if (sliceConfig.blockDepTreeNodes?.length) {
                fullBlockDepTreeNodes = [ ...fullBlockDepTreeNodes, ...sliceConfig.blockDepTreeNodes ]
            }
        }
        return fullBlockDepTreeNodes
    }

    findCallStacks({ fullBlockDepTreeNodes, blockOrFunctionNames }) {
        const childNodes = blockOrFunctionNames.map(targetName => {
            let [ handlerTypeName, handlerName ] = targetName.split('.')
            if (!handlerName) {
                handlerName = handlerTypeName
                handlerTypeName = '$_DRAW'
            }
            return {
                parentBlockHandlerType: handlerTypeName,
                parentBlockHandlerName: handlerName,
                // TODO: заполнить из справочника блоков, если понадобится
                // "parentBlockSliceRootPath": "/var/projects/kh/slices/accounting"
            }
        })

        this.findNodesParents(fullBlockDepTreeNodes, childNodes)

        return childNodes
    }

    findNodesParents(fullBlockDepTreeNodes, childNodes) {
        for (let childNode of childNodes) {
            childNode.parents = this.findNodeParents(fullBlockDepTreeNodes, childNode)
            if (childNode.parents.length) {
                this.findNodesParents(fullBlockDepTreeNodes, childNode.parents)
            }
        }
    }

    findNodeParents(fullBlockDepTreeNodes, childNode) {
        return fullBlockDepTreeNodes.filter(node => {
            if (childNode.parentBlockHandlerType === '$_DRAW') {
                return node.renderedBlockName === childNode.parentBlockHandlerName
            }
            if (childNode.parentBlockHandlerType === '$_DO') {
                return node.DO_handlerCallName === childNode.parentBlockHandlerName
            }
            return false
        })
    }

    formatConcisely(blocksTrees) {
        const result = []
        for (let node of blocksTrees) {
            const newNode = {}

            if (node.parents?.[0]?.renderedBlockName) { // call via `show_block`
                newNode.blockName = node.parents?.[0].renderedBlockName
            } else {
                const handlerFullName = `${node.parentBlockHandlerType}.${node.parentBlockHandlerName}`
                newNode.handlerName = handlerFullName
            }

            result.push(newNode)

            if (node.parents?.length) {
                newNode.callers = this.formatConcisely(node.parents)
            }
        }
        return result
    }
}

module.exports = BlockParser
