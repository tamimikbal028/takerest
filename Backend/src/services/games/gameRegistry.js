import mathSprintLogic from "./logic/mathSprint.logic.js";
import gridHunterLogic from "./logic/gridHunter.logic.js";
import speedEquateLogic from "./logic/speedEquate.logic.js";
import logicalDeductionLogic from "./logic/logicalDeduction.logic.js";
import logicPathLogic from "./logic/logicPath.logic.js";
import operatorGridLogic from "./logic/operatorGrid.logic.js";
import arithmeticPathLogic from "./logic/arithmeticPath.logic.js";
import logicalDeduction2Logic from "./logic/logicalDeduction2.logic.js";
import sumMatrixLogic from "./logic/sumMatrix.logic.js";

const registry = {
  "math-sprint": mathSprintLogic,
  "grid-hunter": gridHunterLogic,
  "speed-equate": speedEquateLogic,
  "logical-deduction": logicalDeductionLogic,
  "logic-path": logicPathLogic,
  "operator-grid": operatorGridLogic,
  "arithmetic-path": arithmeticPathLogic,
  "logical-deduction-2": logicalDeduction2Logic,
  "sum-matrix": sumMatrixLogic,
};

export const getGameLogic = (gameKey) => {
  const logic = registry[gameKey];
  if (!logic) {
    throw new Error(`Game logic not found for game key: ${gameKey}`);
  }
  return logic;
};
