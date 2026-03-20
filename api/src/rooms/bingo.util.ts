import { Prisma } from 'generated/prisma/client';

export function generateBoard(): number[][] {
  const columns = [
    shuffle(range(1, 15)),
    shuffle(range(16, 30)),
    shuffle(range(31, 45)),
    shuffle(range(46, 60)),
    shuffle(range(61, 75)),
  ];

  return Array.from({ length: 5 }, (_, row) =>
    columns.map((column, columnIndex) =>
      row === 2 && columnIndex === 2 ? 0 : column[row],
    ),
  );
}

export function getBoardHash(board: number[][]): string {
  return board.map((row) => row.join(',')).join('|');
}

export function normalizeMarkedNums(value: Prisma.JsonValue): number[] {
  return isNumberArray(value) ? value : [];
}

export function normalizeCalledNums(
  value: Prisma.JsonValue | null | undefined,
): number[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is number => typeof entry === 'number')
    : [];
}

export function normalizeBoard(value: Prisma.JsonValue): number[][] {
  if (!isBoardMatrix(value)) {
    throw new Error('Invalid bingo card board stored in database');
  }
  return value;
}

export function hasWinningPattern(
  board: number[][],
  marked: Set<number>,
  called: Set<number>,
): boolean {
  const isMarked = (row: number, column: number) => {
    const cell = board[row]?.[column];
    return (
      cell === 0 ||
      (typeof cell === 'number' && marked.has(cell) && called.has(cell))
    );
  };

  for (let row = 0; row < 5; row += 1) {
    if ([0, 1, 2, 3, 4].every((column) => isMarked(row, column))) {
      return true;
    }
  }

  for (let column = 0; column < 5; column += 1) {
    if ([0, 1, 2, 3, 4].every((row) => isMarked(row, column))) {
      return true;
    }
  }

  if ([0, 1, 2, 3, 4].every((index) => isMarked(index, index))) {
    return true;
  }

  return [0, 1, 2, 3, 4].every((index) => isMarked(index, 4 - index));
}

export function cardContainsNumber(board: number[][], number: number): boolean {
  return board.some((row) => row.includes(number));
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'number')
  );
}

function isBoardMatrix(value: unknown): value is number[][] {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    value.every(
      (row) => Array.isArray(row) && row.length === 5 && isNumberArray(row),
    )
  );
}

function range(min: number, max: number) {
  return Array.from({ length: max - min + 1 }, (_, index) => index + min);
}

function shuffle<T>(values: T[]): T[] {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}
