/* 
  examples: 
  
  drawPoint({x: 0, y: 1}, 'yellow')
  drawLine({x: 0, y: 0}, {x: 1, y: 1}, 'blue')
  drawCircle(point, radius, 'red')
  rotate(shape, 90)
*/

const makeExampleFn = (name) => (...args) => {
  console.log(`fn ${name} called with: ${JSON.stringify(args, null, 2)}`);
  return ["js", name, ...args];
};

const drawPoint = makeExampleFn("drawPoint");
const drawLine = makeExampleFn("drawLine");
const drawCircle = makeExampleFn("drawCircle");
const rotate = makeExampleFn("rotate");

// v1

function onMessageV0(data) {
  eval(data);
}

console.log("v0 ->");
eval(onMessageV0(`drawLine({x: 0, y: 0}, {x: 1, y: 1}, 'blue')`));

// v1

function onMessageV1(data) {
  const fns = {
    drawLine: drawLine,
  };
  data.instructions.forEach((ins) => fns[ins.functionName](...ins.args));
}

console.log("v1 ->");
eval(
  onMessageV1({
    instructions: [
      {
        functionName: "drawLine",
        args: [{ x: 0, y: 0 }, { x: 1, y: 1 }, "blue"],
      },
    ],
  })
);

// v2

function onMessageV2(data) {
  const fns = {
    drawLine: drawLine,
  };
  data.instructions.forEach(([fnName, ...args]) => fns[fnName](...args));
}

console.log("v2 ->");
eval(
  onMessageV2({
    instructions: [["drawLine", { x: 0, y: 0 }, { x: 1, y: 1 }]],
  })
);

// v3

function onMessageV3(data) {
  const fns = {
    drawLine: drawLine,
    rotate: rotate,
  };
  const parseInstruction = (ins) => {
    if (!Array.isArray(ins)) {
      // this must be a primitive argument, like {x: 0 y: 0}
      return ins;
    }
    const [fName, ...args] = ins;
    return fns[fName](...args.map(parseInstruction));
  };
  data.instructions.forEach(parseInstruction);
}

console.log("v3 ->");
eval(
  onMessageV3({
    instructions: [
      ["rotate", ["drawLine", { x: 0, y: 0 }, { x: 1, y: 1 }], 90],
    ],
  })
);

// v4

function onMessageV4(instruction) {
  const fns = {
    drawLine: drawLine,
    drawPoint: drawPoint,
    do: (...args) => args[args.length - 1],
  };
  const parseInstruction = (ins) => {
    if (!Array.isArray(ins)) {
      // this must be a primitive argument, like {x: 0 y: 0}
      return ins;
    }
    const [fName, ...args] = ins;
    return fns[fName](...args.map(parseInstruction));
  };
  parseInstruction(instruction);
}

console.log("v4 ->");
eval(
  onMessageV4([
    "do",
    ["drawPoint", { x: 0, y: 0 }],
    ["drawLine", { x: 0, y: 0 }, { x: 1, y: 1 }],
  ])
);

// v5

function onMessageV5(instruction) {
  const variables = {};
  const fns = {
    drawLine: drawLine,
    drawPoint: drawPoint,
    rotate: rotate,
    do: (...args) => args[args.length - 1],
    def: (name, v) => {
      variables[name] = v;
    },
  };
  const parseInstruction = (ins) => {
    if (variables[ins]) {
      // this must be some kind of variable
      return variables[ins];
    }
    if (!Array.isArray(ins)) {
      // this must be a primitive argument, like {x: 0 y: 0}
      return ins;
    }
    const [fName, ...args] = ins;
    return fns[fName](...args.map(parseInstruction));
  };
  parseInstruction(instruction);
}

console.log("v5 ->");
eval(
  onMessageV5([
    "do",
    ["def", "shape", ["drawLine", { x: 0, y: 0 }, { x: 1, y: 1 }]],
    ["rotate", "shape", 90],
  ])
);

// v6

function onMessageV6(instruction) {
  const variables = {};
  const fns = {
    drawLine: drawLine,
    drawPoint: drawPoint,
    rotate: rotate,
    do: (...args) => args[args.length - 1],
    def: (name, v) => {
      variables[name] = v;
    },
  };
  const makeFn = (args, body, variables) => {
    return (...argValues) => {
      const argDefs = args.reduce((res, k, idx) => {
        res[k] = argValues[idx];
        return res;
      }, {});
      return parseInstruction(body, { ...variables, ...argDefs });
    };
  };
  const parseInstruction = (ins, variables) => {
    if (variables[ins]) {
      // this must be some kind of variable
      return variables[ins];
    }
    if (!Array.isArray(ins)) {
      // this must be a primitive argument, like {x: 0 y: 0}
      return ins;
    }
    const [fName, ...args] = ins;
    if (fName == "fn") {
      return makeFn(...args, variables);
    }
    const fn = fns[fName] || variables[fName];
    return fn(...args.map((arg) => parseInstruction(arg, variables)));
  };
  parseInstruction(instruction, variables);
}

console.log("v6 ->");
eval(
  onMessageV6([
    "do",
    [
      "def",
      "drawTriangle",
      [
        "fn",
        ["left", "top", "right", "color"],
        [
          "do",
          ["drawLine", "left", "top", "color"],
          ["drawLine", "top", "right", "color"],
          ["drawLine", "left", "right", "color"],
        ],
      ],
    ],
    ["drawTriangle", { x: 0, y: 0 }, { x: 3, y: 3 }, { x: 6, y: 0 }, "blue"],
    ["drawTriangle", { x: 6, y: 6 }, { x: 10, y: 10 }, { x: 6, y: 16 }, "purple"],
  ])
);

["defn", "drawTriangle", ["left", "top", "right"] ["do" ...]]
["def", "drawTriangle", ["fn", ["left", "top", "right"] ["do" ...]]]