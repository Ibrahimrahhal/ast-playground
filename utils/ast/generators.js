class Generator {
  supportedStatements = {
    importDeclaration: {
      requiredFields: ["source", "name"],
      generator: this.importDeclaration,
    },
    functionDeclaration: {
      requiredFields: ["name", "parameters", "body"],
      generator: this.functionDeclaration,
    },
  };

  functionDeclaration({ name, parameters, body }) {
    return "";
  }

  importDeclaration({ source, name }) {
    // abstract
    return "";
  }

  generate(type, parameters) {
    if (!this.supportedStatements[type]) {
      throw new Error("Unsupported statement type");
    }
    const statement = this.supportedStatements[type];
    const missingFields = statement.requiredFields.filter(
      (field) => !parameters[field],
    );
    if (missingFields.length) {
      throw new Error(`Missing fields: ${missingFields.join(", ")}`);
    }
    return this[type](parameters);
  }
}

class PythonGenerator extends Generator {
  constructor() {
    super();
    this.supportedStatements.functionDeclaration.requiredFields.push("node");
  }

  calculateNumberOfParentBlocks(node) {
    let parent = node.parent;
    let count = 0;
    while (parent) {
      if (parent.type === "block") count++;
      parent = parent.parent;
    }
    return count;
  }

  importDeclaration({ source, name }) {
    return `from ${source} import ${name}`;
  }
  functionDeclaration({ name, parameters, body, node }) {
    return `def ${name}(${parameters.join(", ")}):\n${Array(
      this.calculateNumberOfParentBlocks(node) + 1,
    )
      .fill("\t")
      .join("")}${body}`;
  }
}

class JavaScriptGenerator extends Generator {
  importDeclaration({ source, name }) {
    return `import ${name} from ${source}`;
  }
  functionDeclaration({ name, parameters, body }) {
    return `function ${name}(${parameters.join(", ")}) {\n${body}\n}`;
  }
}

class TypeScriptGenerator extends Generator {
  constructor() {
    super();
    this.supportedStatements.functionDeclaration.requiredFields.push(
      "returnType",
    );
  }

  importDeclaration({ source, name }) {
    return `import ${name} from "${source}"`;
  }
  functionDeclaration({ name, parameters, body, returnType }) {
    return `function ${name}(${parameters.join(", ")}): ${returnType} {\n${body}\n}`;
  }
}

class GoGenerator extends Generator {
  importDeclaration({ source, name }) {
    return `import ${name} from ${source}`;
  }
  functionDeclaration({ name, parameters, body }) {
    return `func ${name}(${parameters.map((p) => `${p.name} ${p.type}`).join(", ")}) {\n${body}\n}`;
  }
}

module.exports = {
  ts: new TypeScriptGenerator(),
  js: new JavaScriptGenerator(),
  py: new PythonGenerator(),
  go: new GoGenerator(),
};
