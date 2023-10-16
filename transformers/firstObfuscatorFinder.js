const vm = require('vm');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;

function firstObfuscatorFinder(ast, sandbox) {
    let variableDeclaration = null;
    let functionDeclaration = null;
    let functionExpression = null;
    let functionName = null;

    // pretty easy is on the top of the page, didn't wanted
    // to lose time on this one
    traverse(ast, {
        VariableDeclaration(path) {
            if (!variableDeclaration && path.node.declarations[0].id.name.startsWith('a2_')) {
                variableDeclaration = path.node;
                path.remove();
            }
        },
        FunctionDeclaration(path) {
            if (!functionDeclaration && path.node.id.name.startsWith('a2_')) {
                functionDeclaration = path.node;
                functionName = path.node.id.name;
                path.remove();
            }
        },
        CallExpression(path) {
            if (!functionExpression && path.node.callee.type === 'FunctionExpression') {
                functionExpression = path.node;
                path.remove();
            }
        }
    });

    // Generate code from the AST nodes
    const variableCode = generate(variableDeclaration).code;
    const functionCode = generate(functionDeclaration).code;
    const functionExprCode = generate(functionExpression).code;


    // Use VM to run the extracted code in a sandbox
    vm.runInContext(variableCode, sandbox);
    vm.runInContext(functionCode, sandbox);
    vm.runInContext("(" + functionExprCode.replace('}(', '})('), sandbox);

    return {ast, functionName};
}

module.exports = firstObfuscatorFinder;