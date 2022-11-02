import * as path from 'path'
import * as Mocha from 'mocha'
import fastGlob from 'fast-glob'

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	})

	const testsRoot = path.resolve(__dirname, '..')

	return new Promise((resolve, reject) => {
		fastGlob('**/**.test.js', { cwd: testsRoot }).then(
			(files) => {
				// Add files to the test suite
				files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))

				try {
					// Run the mocha test
					mocha.run((failures) => {
						if (failures > 0) {
							reject(new Error(`${failures} tests failed.`))
						} else {
							resolve()
						}
					})
				} catch (err) {
					console.error(err)
					reject(err)
				}
			},
			(err) => {
				if (err) {
					return reject(err)
				}
			}
		)
	})
}
