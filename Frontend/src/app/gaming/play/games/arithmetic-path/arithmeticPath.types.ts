export interface ArithmeticPathCell {
  op: string;
  val: number;
}

export interface ArithmeticPathLevel {
  grid: ArithmeticPathCell[];
  size: number;
  startValue: number;
  targetValue: number;
  timeLimit: number;
}
