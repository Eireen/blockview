const fs = require('fs')
const path = require('path')
const espree = require('espree')
const estraverse = require('estraverse')


class FileASTParser {

    constructor() {
        this.traverseOnEnter = this.traverseOnEnter.bind(this)
        this.traverseOnLeave = this.traverseOnLeave.bind(this)
    }

    get blockHandlerTypes() {
        return ['$_GET', '$_DRAW', '$_DO']
    }

    /**
     * @public
     * @param {String} filePath
     */
    parseFile(filePath) {
        const fileContents = this.readFile(filePath)
        const ast = this.parseFileAST(fileContents)

        this.blockHandlersByType = this.blockHandlerTypes.reduce((acc, handlerType) => {
            acc[handlerType] = {}
            return acc
        }, {})
        this.blockDepTreeNodes = []

        this.traverseFileAST(ast)

        return {
            blockHandlersByType: this.blockHandlersByType,
            blockDepTreeNodes: this.blockDepTreeNodes,
        }
    }

    /**
     * @protected
     * @param {String} filePath
     * @returns {String}
     */
    readFile(filePath) {
        return fs.readFileSync(filePath, 'utf8')
    }

    /**
     * @protected
     * @param {String} fileContents
     * @returns {Object}
     */
    parseFileAST(fileContents) {
        const ast = espree.parse(fileContents, { ecmaVersion: 11, loc: true })
        // let fileBaseName = path.parse(path.basename(filePath)).name
        return ast
    }

    traverseFileAST(ast) {

        this.parentNodes = []  // chain of parents of current node

        /**
         * $_GET / $_DRAW / $_DO function data
         * @type {Object}
         */
        this.currentBlockHandler = null

        estraverse.traverse(ast, {
            enter: this.traverseOnEnter,
            leave: this.traverseOnLeave,
        })
    }

    traverseOnEnter(node, parent) {
        const { blockDepTreeNodes } = this

        if (this.is_DRAW_GET_or_DO_handler_assignment(node)) {
            const blockHandlerType = this.get_DRAW_GET_or_DO_handler_type(node)
            const blockHandlerName = node.left.property.name

            if (!blockHandlerType || !blockHandlerName) {
                console.error(`Cannot parse block hanlder name: "${blockHandlerType}.${blockHandlerName}"`)
            } else {
                const isBlockHandlerAlreadyFound = !!this.blockHandlersByType[blockHandlerType]?.[blockHandlerName]
                if (isBlockHandlerAlreadyFound) {
                    console.warn(`WARNING: Probably, this block handler is declared more than once: "${blockHandlerType}.${blockHandlerName}"`)
                } else {
                    this.blockHandlersByType[blockHandlerType][blockHandlerName] = {
                        // node
                    }
                }

                this.currentBlockHandler = {
                    node,
                    type: blockHandlerType,
                    name: blockHandlerName,
                }
            }
        } else {
            if (this.is_show_block_call(node)) {

                const parentBlockHandlerType = this.currentBlockHandler?.type

                // TODO: `show_block` can be called not only from  $_DRAW handler
                const parentBlockHandlerName = this.currentBlockHandler && this.currentBlockHandler.name || null
                // if (no_parent_handlers) console.log(`WARNING: show_block call is outside $_DRAW, $_DO or $_GET handlers`)

                const renderedBlockNameNode = node.arguments && node.arguments[0] || null
                const renderedBlockName = renderedBlockNameNode && renderedBlockNameNode.type === 'Literal'
                    ? renderedBlockNameNode.value : null
                // TODO: если имя блока не Literal, вытаскивать какие-то другие данные о нем

                const newDepNode = {
                    parentBlockHandlerType,
                    parentBlockHandlerName,
                    renderedBlockName,
                    // ast: {
                    //     show_block: node,
                    //     block_handler: this.currentBlockHandler,
                    //     renderedBlockNameNode,
                    // },
                }

                const isAlreadyInDepTree = blockDepTreeNodes.some(blockTreeNode =>
                    blockTreeNode.parentBlockHandlerName === parentBlockHandlerName &&
                    blockTreeNode.renderedBlockName === renderedBlockName
                )
                if (!isAlreadyInDepTree) blockDepTreeNodes.push(newDepNode)
            }
        }

        this.parentNodes.push(node)
    }

    traverseOnLeave(node, parent) {

        if (this.currentBlockHandler && node === this.currentBlockHandler.node) {
            this.currentBlockHandler = null
        }

        this.parentNodes.pop()
    }

    is_DRAW_GET_or_DO_handler_assignment(node) {
        return (
            node &&
            node.type === 'AssignmentExpression' &&
            node.operator === '=' &&
                node.left &&
                node.left.type === 'MemberExpression' &&
                    node.left.object &&
                    ((
                        // Присваивание в $_DRAW без префикса window
                        node.left.object.type === 'Identifier' &&
                        this.blockHandlerTypes.includes(node.left.object.name)
                    )
                        ||
                    (
                        // Присваивание в $_DRAW с префиксом window (`window.$_DRAW = ...`)
                        node.left.object.type === 'MemberExpression' &&
                            node.left.object.object &&
                            node.left.object.object.type === 'Identifier' &&
                            node.left.object.object.name === 'window' &&
                            node.left.object.property.type === 'Identifier' &&
                            this.blockHandlerTypes.includes(node.left.object.property.name)
                    )) &&
                    node.left.property &&
                    node.left.property.type === 'Identifier' &&
                    node.left.property.name
        )
    }

    get_DRAW_GET_or_DO_handler_type(node) {
        return (
            node.left.object.type === 'Identifier'
                ? node.left.object.name
                : (node.left.object.type === 'MemberExpression'
                    ? node.left.object.property.name
                    : null
                )
        )
    }

    is_show_block_call(node) {
        return !!(
            node &&
            node.type === 'CallExpression' &&
            node.callee &&
                node.callee.type === 'Identifier' &&
                node.callee.name === 'show_block'
        )
    }
}


module.exports = FileASTParser


// const fileName = '/var/projects/kh/slices/accounting/front/root/_/app/js/view/tb_metering_device.js'
// const blockDepTreeNodes = (new FileASTParser()).parseFile(fileName)

// console.log('// ---- blockDepTreeNodes ----')
// console.log(`;(${JSON.stringify(blockDepTreeNodes, null, '\t')});\n`)

