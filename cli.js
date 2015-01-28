#!/usr/bin/env node
'use strict';

/*
 * Dependencies.
 */

var path,
    spawn,
    pack;

path = require('path');
spawn = require('win-fork');
pack = require('./package.json');

/*
 * Resolve.
 */

var mdast,
    usage;

mdast = require.resolve('mdast/cli.js');
usage = require.resolve('./index.js');

/*
 * Arguments.
 */

var argv;

argv = process.argv.slice(2);

/*
 * Command.
 */

var command;

command = Object.keys(pack.bin)[0];

/*
 * Program.
 */

if (argv[0] === '--version' || argv[0] === '-v') {
    /*
     * Version.
     */

    console.log(pack.version);
} else if (argv[0] === '--help' || argv[0] === '-h') {
    /*
     * Help.
     */

    console.log([
        '',
        'Usage: ' + command + ' [options] [mdast options]',
        '',
        pack.description,
        '',
        'Options:',
        '',
        '  -h, --help            output usage information',
        '  -v, --version         output version number',
        '',
        'A wrapper around `mdast --use ' + command + '`',
        '',
        'Help for mdast:',
        '',
        '  https://github.com/wooorm/mdast',
        '',
        'Usage:',
        '',
        '# Pass `Readme.md` through ' + command,
        '$ ' + command + ' Readme.md -o Readme.md',
        '',
        '# Pass `Readme.md` through ' + command + ', with a custom name',
        '$ ' + command + ' Readme.md -o Readme.md --option name:42',
        '',
        '# Pass stdin through ' + command + ', with mdast options, ' +
            'and write to stdout',
        '$ cat Readme.md | ' + command + ' --option setext > Readme-new.md',
        '',
        '# Use other plugins',
        '$ npm install some-plugin',
        '$ cat Readme.md | ' + command + ' --use some-plugin'
    ].join('\n  ') + '\n');
} else {
    /*
     * Spawn.
     */

    var proc;

    proc = spawn(mdast, ['--use', usage].concat(argv), {
        'stdio': 'inherit'
    });

    /*
     * Exit.
     */

    proc.on('exit', function (code) {
        process.exit(code);
    });
}
