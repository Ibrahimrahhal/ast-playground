const Parser = require("tree-sitter");
const JavaScript = require("tree-sitter-javascript");
const TypeScript = require("tree-sitter-typescript");
const Python = require("tree-sitter-python");
const Go = require("tree-sitter-go");

const walker = require("./utils/ast/walker");
const replacer = require("./utils/ast/replacer");
const generators = require("./utils/ast/generators");

const fs = require("fs");

Parsers = {
  js: JavaScript,
  ts: TypeScript.typescript,
  py: Python,
  go: Go,
};

const files = ["example.py", "example.ts", "example.go"];
const sourceCodes = files.map((file) =>
  fs.readFileSync(`./source/${file}`, "utf8"),
);
const nodeTypes = {
  imports: {
    importFromNode: "import_from_statement",
    importStatement: "import_statement",
    importDeclaration: "import_declaration",
  },
  functionDeclaration: {
    functionDefinition: "function_definition",
    functionDeclaration: "function_declaration",
  },
};
sourceCodes.forEach((sourceCode, index) => {
  const parser = new Parser();
  const fileType = files[index].split(".")[1];
  parser.setLanguage(Parsers[fileType]);
  const tree = parser.parse(sourceCode);
  // finding all import statements
  const nodes = walker(tree.rootNode, nodeTypes.imports);
  console.log(
    `Number of import statements in ${files[index]}: ${nodes.length}, they are:`,
  );
  nodes.forEach((node) => {
    console.log(node.text);
  });
  // appending a new import statement
  const nodeToReplace = nodes[nodes.length - 1];
  const replacement = generators[fileType].generate("importDeclaration", {
    source: "foo",
    name: "bar",
  });
  let newTree = replacer(
    tree,
    nodeToReplace,
    `${nodeToReplace.text}\n${replacement}`,
    (source) => parser.parse(source),
  );
  fs.writeFileSync(`./source/out.${files[index]}`, newTree.getText(0));

  //finding a function and printing it
  const functionNodes = walker(newTree.rootNode, nodeTypes.functionDeclaration);
  if (functionNodes.length > 0)
    console.log(`first function in ${files[index]}:\n${functionNodes[0].text}`);

  //replacing the first function with a new function
  const functionNodeToReplace = functionNodes[0];
  const functionName = walker(functionNodeToReplace, "identifier")[0].text;
  // this doesn't cover all cases of function parameters
  let functionParametersIdentifier = [];
  const functionParameterNode = walker(
    functionNodeToReplace,
    ["parameters", "formal_parameters"],
    1,
  )[0];
  if (functionParameterNode) {
    const functionParametersRequiredParams = walker(
      functionParameterNode,
      "required_parameter",
    ).map((node) => node.text);
    const functionParametersOptionalParams = walker(
      functionParameterNode,
      "optional_parameter",
    ).map((node) => node.text);
    functionParametersIdentifier = walker(
      functionParameterNode,
      "identifier",
    ).map((node) => node.text);
    if (
      functionParametersRequiredParams.length > 0 ||
      functionParametersOptionalParams.length > 0
    ) {
      functionParametersIdentifier = functionParametersRequiredParams.concat(
        functionParametersOptionalParams,
      );
    }
  }
  const functionReplacement = generators[fileType].generate(
    "functionDeclaration",
    {
      name: functionName,
      parameters: functionParametersIdentifier,
      body: fileType == "py" ? "pass" : "// comment",
      returnType: "void",
      node: functionNodeToReplace,
    },
  );
  newTree = replacer(
    newTree,
    functionNodeToReplace,
    functionReplacement,
    (source) => parser.parse(source),
  );
  fs.writeFileSync(`./source/out.${files[index]}`, newTree.getText(0));
});
