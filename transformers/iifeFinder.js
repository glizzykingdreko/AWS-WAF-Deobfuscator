const vm = require('vm');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;

const callsReplacer = require('./callsReplacer');

function getAllPossibleFunctions(ast) {
    // Search for all the functions that return a member expression
    // and save them in a list of good functions
    let goodFunctions = {};
    traverse(ast, {
        FunctionDeclaration(path) {
            const blockStatement = path.node.body;
            if (
                blockStatement.body.length === 0 ||
                blockStatement.body[0].type !== 'ReturnStatement' ||
                blockStatement.body[0].argument.type !== 'CallExpression' ||
                blockStatement.body[0].argument.callee.type !== 'AssignmentExpression' ||
                blockStatement.body[0].argument.callee.right.type !== 'FunctionExpression' ||
                blockStatement.body[0].argument.callee.right.body.body.length === 0 ||
                blockStatement.body[0].argument.callee.right.body.body[0].type !== 'ReturnStatement' ||
                blockStatement.body[0].argument.callee.right.body.body[0].argument.type !== 'MemberExpression'
            ) return;
            goodFunctions[blockStatement.body[0].argument.callee.right.body.body[0].argument.object.name] = path;
        }
    })
    return {ast, goodFunctions};
}

function iifeFinder(iife, theFunction, ast) {
    let iffeName = iife.node.id.name;
    let finalCode = null;

    // Since we found a match, we need to extract the code from the IIFE
    // and the function and execute them in order
    // we do not execute it now since will probably depend
    // on another iife
    functionName = theFunction.node.id.name;
    finalCode += "\n" + generate(iife.node).code;
    iife.remove();
    finalCode += "\n" + generate(theFunction.node).code;
    theFunction.remove();

    traverse(ast, {
        ExpressionStatement(path) {
            const expression = path.node.expression;

            if (
                expression.type !== 'UnaryExpression' ||
                expression.argument.type !== 'CallExpression' ||
                expression.argument.callee.type !== 'FunctionExpression' ||
                expression.argument.arguments.length === 0 ||
                expression.argument.arguments[0].type !== 'Identifier' ||
                expression.argument.arguments[0].name !== iffeName
            ) return;

            // If all checks passed, we found a match
            let code = generate(path.node).code;
            finalCode += "\n" + code;
            path.remove();
        }
    })
    return {ast, functionName, finalCode};
}

function executeInOrder(matches, ast, sandbox) {
    // Okay so now we have a list of matches, but we need to execute them in order
    // my first idea was to make a good sort based on the name of each
    // function and the array/functions arguments of the other,
    // then I've just created a loop that try/catch each of the matches
    // till all of them are executed :D
    n = 0;

    while (matches.length > 0) {
        if (n >= matches.length) n = 0;

        let name = matches[n][0],
            code = matches[n][1];
        try {
            vm.runInContext(code, sandbox);
            ast = callsReplacer(
                name,
                ast,
                sandbox
            )
            // remove the match from the list
            matches.splice(n, 1);
            console.log("Executed " + name);
        } catch (error) {
            // if the match failed, try the next one
            console.log(error);
        }

        n++;
    }

    return ast; 
}

module.exports = {iifeFinder, getAllPossibleFunctions, executeInOrder};