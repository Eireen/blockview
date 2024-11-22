
const program = require('commander')
const BlockParser = require('../lib/BlockParser')

module.exports = function(process) {

	// Initialise CLI
	program
		.version('0.1.0')
		.option('--call-stack-for <comma_separated_block_or_function_names>', 'show call stacks of the given blocks or DO functions', stripQuotes)
		.option('--config <file_path>', 'default is config.js in the root of the project', stripQuotes)
		.parse(process.argv)

	// Show the help if no arguments were provided
	if (process.argv.length < 3) {  // argv[0] is `node` and argv[1] is `bin/blockview.js`
		program.help()
		return
	}

	const options = program.opts()

	if (!options.callStackFor) {
		output({
			status: 'error',
			message: 'The --call-stack-for argument is required for now.',
		})
		return
	}

	;(new BlockParser({
		...options,
	})).run()



	function stripQuotes (val) {
		let c1 = val.substr(0, 1)
		let c2 = val.substr(-1)
		if ((c1 === '"' && c2 === '"') || (c1 === "'" && c2 === "'")) {
			return val.substr(1, val.length - 2)
		}
		return val
	}

	// Print output in human readable format or JSON, depending on the ouput settings
	function output(info) {
		if (options.json) {
			console.log(JSON.stringify(info))
		} else if (info.message) {
			console.log(info.message)
		}
	}
};
