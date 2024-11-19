const fs = require('fs')
const path = require('path')
const FsWalker = require('./FsWalker')


/**
 * Получение списков скриптов в модулях проекта для составления карты связей.
 */
class SliceFileReader {

    constructor({ moduleConfig }) {
        const defaultModelsPath = path.join('back', 'lib', 'Model', 'oltp')
        const defaultModelAclsPath = path.join('back', 'lib', 'Model', 'acls')
        const defaultControllersPath = path.join('back', 'lib', 'Content')
        const defaultFrontHtmlPath = path.join('front', 'root', '_', 'app', 'html')
        const defaultFrontDataPath = path.join('front', 'root', '_', 'app', 'js', 'data')
        const defaultFrontViewPath = path.join('front', 'root', '_', 'app', 'js', 'view')

        this.moduleConfig = {
            ...moduleConfig,
            modelsPath: moduleConfig.modelsPath || defaultModelsPath,
            modelAclsPath: moduleConfig.modelAclsPath || defaultModelAclsPath,
            controllersPath: moduleConfig.controllersPath || defaultControllersPath,
            frontHtmlPath: moduleConfig.frontHtmlPath || defaultFrontHtmlPath,
            frontDataPath: moduleConfig.frontDataPath || defaultFrontDataPath,
            frontViewPath: moduleConfig.frontViewPath || defaultFrontViewPath,
        }
    }

    /**
     * @public
     * @returns {Object}
     */
    async read() {
        const { rootPath, modelsPath, modelAclsPath, controllersPath, frontHtmlPath, frontDataPath, frontViewPath } = this.moduleConfig

        const [ models, modelAcls, controllers, frontHtml, frontData, frontView ] = await Promise.all([
            this.readDir(path.join(rootPath, modelsPath), ['.js']),
            [], // this.readDir(path.join(rootPath, modelAclsPath), ['.js']),  // acls нам пока не нужны, поэтому отключим их парсинг
            this.readDir(path.join(rootPath, controllersPath), ['.js']),
            this.readDir(path.join(rootPath, frontHtmlPath), ['.html']),
            this.readDir(path.join(rootPath, frontDataPath), ['.js']),
            this.readDir(path.join(rootPath, frontViewPath), ['.js']),
        ])

        return { models, modelAcls, controllers, frontHtml, frontData, frontView }
    }

    /**
     * @protected
     * @param {String} dir Full path to directory
     * @param {String[]} extensions
     * @returns {String[]}
     */
    async readDir(dir, extensions = []) {

        if (!fs.existsSync(dir)) return []

        const files = []

        return new Promise((resolve, reject) => {
            new FsWalker(dir)
                // `stat` is `fs.Stats` - https://nodejs.org/docs/latest-v16.x/api/fs.html#class-fsstats
                .on('file', function (fullFilePath, stat) {
                    const fileExt = path.extname(fullFilePath)
                    if (extensions && extensions.includes(fileExt)) {
                        // const fileBaseName = path.basename(fullFilePath).slice(0, -fileExt.length)
                        // files.push(fileBaseName)
                        files.push({ fullFilePath })
                    }
                })
                .on('error', function (error, entry) {
                    console.log('Got error ' + error + ' on entry ' + entry)
                    reject(error)
                })
                .on('end', function () {
                    resolve(files)
                })
        })
    }

}

module.exports = SliceFileReader
