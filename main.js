const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const vm = require('vm');
const fs = require('fs');

const firstObfuscatorFinder = require('./transformers/firstObfuscatorFinder');
const {iifeFinder, getAllPossibleFunctions, executeInOrder} = require('./transformers/iifeFinder');
const callsReplacer = require('./transformers/callsReplacer');


// The provided JavaScript code
function deobfuscate(path, output) {
    const code = fs.readFileSync(path, 'utf8');

    const sandbox = {};
    vm.createContext(sandbox);
    // Parse the code to get AST
    let ast = parse(code, {
        sourceType: "script",
        plugins: ["jsx"]
    });
    let functionMatch;
    result = firstObfuscatorFinder(ast, sandbox);
    ast = result.ast;
    functionName = result.functionName;
    console.log("Found first obfuscator function: " + functionName);
    ast = callsReplacer(
        functionName,
        ast,
        sandbox
    )


    let possibleFunctions;

    result = getAllPossibleFunctions(ast);
    ast = result.ast;
    possibleFunctions = result.goodFunctions;
    let matches = [];
    // Traverse to find all the list declarations 
    traverse(ast, {
        VariableDeclarator(path) {
            if (path.node.init && path.node.init.type === 'ArrayExpression' && possibleFunctions[path.node.id.name]) {
                result = iifeFinder(path, possibleFunctions[path.node.id.name], ast, sandbox);
                ast = result.ast;
                functionMatch = result.functionName;
                finalCode = result.finalCode;
                if (!functionMatch) return;
                matches.push([functionMatch, finalCode])
            }
        }
    });
    console.log("Found " + matches.length + " matches");

    ast = executeInOrder(matches, ast, sandbox);

    // Traverse to get any list declaration of strings
    let stringList = {};
    traverse(ast, {
        VariableDeclarator(path) {
            if (path.node.init && path.node.init.type === 'ArrayExpression') {
                stringList[path.node.id.name] = path.node.init.elements.map(element => element.value);
            }
        }
    });

    let usedLists = [];

    // now we need to find any list call like list[0] and replace it with the string
    traverse(ast, {
        MemberExpression(path) {
            if (path.node.property.type === 'NumericLiteral' && stringList[path.node.object.name]) {
                const index = path.node.property.value;
                const name = path.node.object.name;
                const output = stringList[path.node.object.name][index];
                if ((path.parent.type === 'AssignmentExpression' && path.parent.left === path.node) || output === null || output === undefined || typeof output !== 'string') {
                    return;  // Skip replacement
                }
                path.replaceWith({
                    type: 'StringLiteral',
                    value: output
                });
                usedLists.push(name);
                console.log("Replaced " + name + "[" + index + "] with " + output);
            }
        }
    });

    traverse(ast, {
        // remove the list declarations that were used
        VariableDeclarator(path) {
            if (usedLists.includes(path.node.id.name)) {
                path.remove();
            }
        },
        // Replace numbers from format 0x1234 with the actual number
        NumericLiteral(path) {
            if (path.node.extra && path.node.extra.raw.startsWith('0x')) {
                path.replaceWith({
                    type: 'NumericLiteral',
                    value: parseInt(path.node.extra.raw)
                });
            }
        },
        // Remove comments
        enter(path) {
            if (path.node.type === 'CommentLine' || path.node.type === 'CommentBlock') {
                path.remove();
            }
        }
    });

    // Generate the modified code from the updated AST
    const modifiedCode = generate(ast).code;
    fs.writeFileSync(output, modifiedCode, 'utf8');
}

deobfuscate(process.argv[2] || "./script.js" , process.argv[3] || "./modified.js");