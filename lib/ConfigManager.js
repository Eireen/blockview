
const { glob, globSync } = require('glob')
const fs = require('fs')
const path = require('path')

class ConfigManager {

    static get defaultConfig() {
        return {
            slices: [],
        }
    }

    static requireConfigFile(configFilePathArg) {
        const configFilePath = configFilePathArg || path.resolve(path.dirname(__filename), '../config.js')

        if (!fs.existsSync(configFilePath)) throw Error(`Config file ${configFilePath} does not exist`)

        return require(configFilePath)
    }

    constructor(rawConfig) {
        this.rawConfig = rawConfig
        this.config = this.normalizeConfig()
    }

    normalizeConfig() {
        return {
            ...this.constructor.defaultConfig,
            ...this.rawConfig,
            slices: this.expandSlicesConfig(this.rawConfig.slices),
        }
    }

    expandSlicesConfig(slicesConfig) {
        const resultSlicesConfig = []

        for (let sliceConfig of slicesConfig) {
            if (sliceConfig.rootPathPattern) {
                globSync(sliceConfig.rootPathPattern)
                    .forEach(newRootPath => {
                        const newConfig = {
                            ...sliceConfig,
                            rootPath: newRootPath,
                        }
                        delete newConfig.rootPathPattern
                        resultSlicesConfig.push(newConfig)
                    })
            } else {
                resultSlicesConfig.push(sliceConfig)
            }
        }

        return resultSlicesConfig
    }

    getNormalized() {
        return JSON.parse(JSON.stringify(this.config))
    }
}

module.exports = ConfigManager
