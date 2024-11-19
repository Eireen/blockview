const path = require('path')
const ConfigManager = require('./ConfigManager')
const SliceFileReader = require('./SliceFileReader')
const FileASTParser = require('./FileASTParser')

class App {

    async run() {
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

        // blockviewLog(slicesWithFiles)


        // ==== TMP FOR DEBUG ====
        const testFrontViewFiles = [
            {
                "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/view/tb_metering_device.js"
            },
            {
                "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/view/tb_oki.js"
            },
            {
                "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/view/voc_territory_types.js"
            },
            {
                // тут нет show_block-ов
                "fullFilePath": "/var/projects/kh/slices/accounting/front/root/_/app/js/view/tb_uspd_roster.js"
            },
        ]
        slicesWithFiles[0].files.models = [] // скрываем на период дебага
        slicesWithFiles[0].files.controllers = []
        slicesWithFiles[0].files.frontHtml = []
        slicesWithFiles[0].files.frontData = []
        slicesWithFiles[0].files.frontView = testFrontViewFiles
        blockviewLog(slicesWithFiles, 'slicesWithFiles with test data')

        this.buildBlockDepTrees(slicesWithFiles)
    }

    readConfigFile() {
        return ConfigManager.requireConfigFile(
            // TODO: read config file name from cli args
            path.resolve(path.dirname(__filename), 'config.js')
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
            for (let handlersType of ['frontData', 'frontView']) {
                for (let { fullFilePath } of sliceConfig.files[handlersType]) {
                    const { blockHandlersByType, blockDepTreeNodes } = (new FileASTParser()).parseFile(fullFilePath)
                    Object.assign(sliceConfig, { blockHandlersByType, blockDepTreeNodes })
                    blockviewLog(sliceConfig.blockHandlersByType, `blockHandlersByType of ${fullFilePath}`)
                    blockviewLog(sliceConfig.blockDepTreeNodes, `blockDepTreeNodes of ${fullFilePath}`)
                }
            }
        }
    }
}

module.exports = App
