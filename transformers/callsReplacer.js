const traverse = require('@babel/traverse').default;

function callsReplacer(functionName, ast, sandbox) {
    // 1. Identify all the time a variable is assigned to the obfuscated function
    let variableDeclarations = [];
    traverse(ast, {
        VariableDeclarator(path) {
            if (path.node.init && path.node.init.name === functionName) {
                variableDeclarations.push(path.node.id.name);
                path.remove();
            }
        }
    });

    // Again but search for all the previous matches as well in case
    // a variable is assigned to one of the previous matches
    traverse(ast, {
        VariableDeclarator(path) {
            if (path.node.init && variableDeclarations.includes(path.node.init.name)) {
                variableDeclarations.push(path.node.id.name);
                path.remove();
            }
        }
    });


    // 3. Identify all the call expressions to these variables
    // and replace them with the result of the obfuscated function
    traverse(ast, {
        CallExpression(path) {
            if (path.node.callee.name && variableDeclarations.includes(path.node.callee.name)) {
                const argumentValue = path.node.arguments[0].value;
                const replacedFunctionName = path.node.callee.name;

                // 3. Replace each of these calls with the result of `sandbox.a2_0x2308(samePassedArg)`
                const result = sandbox[functionName](argumentValue);
                path.replaceWith({
                    type: 'StringLiteral',
                    value: result
                });
                console.log("Replaced " + replacedFunctionName + "(" + argumentValue + ") with " + result);
            }
        }
    });
    return ast;
}

module.exports = callsReplacer;