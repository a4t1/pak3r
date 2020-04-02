#!/usr/bin/env node

// require modules
const process = require('process')
const fs = require('fs')
const archiver = require('archiver')
const path = require('path')

require('yargs')
  .scriptName('pak3r')
  .usage('$0 <cmd> [args]')
  .command('pack', 'Turns the current npm package into a pk3 and puts it in the dist folder', (yargs) => {
    // yargs.positional('path', {
    //   type: 'string',
    //   describe: 'Path to the package root'
    // })
  }, pack)
  .help()
  .argv

function pack() {

  return new Promise((resolve, reject) => {

    const cwd = process.cwd()

    console.log('CWD:', cwd)

    const manifestPath = path.join(cwd, 'package.json')
    const srcPath = path.join(cwd, 'src')
  
    if (!fs.existsSync(manifestPath)) throw new Error('package.json not found')
    if (!fs.existsSync(srcPath)) throw new Error(`src folder not found`)
  
    const { name } = require(manifestPath)
  
    const distPath = path.join(cwd, 'dist')

    if (fs.existsSync(distPath)) fs.rmdirSync(distPath, { recursive: true })
    fs.mkdirSync(distPath)
  
    // create a file to stream archive data to.
    const output = fs.createWriteStream(path.join(distPath, `A4T1-${name}.pk3`))
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    })
    
    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes')
      console.log('archiver has been finalized and the output file descriptor has closed.')
      resolve()
    })
    
    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function () {
      console.log('Data has been drained')
    })
    
    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        reject(err)
      }
    })
    
    // good practice to catch this error explicitly
    archive.on('error', function (err) {
      reject(err)
    })
    
    // pipe archive data to the file
    archive.pipe(output)
    
    // append a file from stream
    archive.append(fs.createReadStream(manifestPath), { name: 'manifest.json' })
    
    // append a file from string
    // archive.append('string cheese!', { name: 'file2.txt' })
    
    // append a file from buffer
    // const buffer3 = Buffer.from('buff it!')
    // archive.append(buffer3, { name: 'file3.txt' })
    
    // append a file
    // archive.file('file1.txt', { name: 'file4.txt' })
    
    // append files from a sub-directory and naming it `new-subdir` within the archive
    // archive.directory('subdir/', 'new-subdir')
    
    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(srcPath, false)
    
    // append files from a glob pattern
    // archive.glob('subdir/*.txt')
    
    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize()

  })

}