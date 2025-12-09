import type {
  ProcessedEvent,
  CodeLocation,
  FileLocationDetails,
} from './types';

/**
 * TypeScript SyntaxKind mapping for common AST node types
 * Based on TypeScript's SyntaxKind enum
 */
const SYNTAX_KIND_NAMES: Record<number, string> = {
  // Expressions
  79: 'Identifier',
  80: 'PrivateIdentifier',
  106: 'ThisKeyword',
  108: 'SuperKeyword',
  110: 'TrueKeyword',
  95: 'FalseKeyword',
  104: 'NullKeyword',

  // Literals
  9: 'NumericLiteral',
  10: 'BigIntLiteral',
  11: 'StringLiteral',
  14: 'RegularExpressionLiteral',
  15: 'NoSubstitutionTemplateLiteral',

  // Template expressions
  228: 'TemplateExpression',

  // Array/Object
  209: 'ArrayLiteralExpression',
  210: 'ObjectLiteralExpression',

  // Property access
  211: 'PropertyAccessExpression',
  212: 'ElementAccessExpression',

  // Call expressions
  213: 'CallExpression',
  214: 'NewExpression',

  // Operators
  216: 'TypeAssertionExpression',
  217: 'ParenthesizedExpression',
  218: 'FunctionExpression',
  219: 'ArrowFunction',
  220: 'DeleteExpression',
  221: 'TypeOfExpression',
  222: 'VoidExpression',
  223: 'AwaitExpression',
  224: 'PrefixUnaryExpression',
  225: 'PostfixUnaryExpression',
  226: 'BinaryExpression',
  227: 'ConditionalExpression',
  229: 'YieldExpression',
  230: 'SpreadElement',
  231: 'ClassExpression',
  233: 'OmittedExpression',
  234: 'ExpressionWithTypeArguments',
  235: 'AsExpression',
  236: 'NonNullExpression',
  237: 'MetaProperty',
  238: 'TaggedTemplateExpression',
  239: 'SatisfiesExpression',

  // Declarations
  262: 'FunctionDeclaration',
  263: 'ClassDeclaration',
  264: 'InterfaceDeclaration',
  265: 'TypeAliasDeclaration',
  266: 'EnumDeclaration',
  267: 'ModuleDeclaration',

  // Statements
  243: 'Block',
  244: 'EmptyStatement',
  245: 'VariableStatement',
  246: 'ExpressionStatement',
  247: 'IfStatement',
  248: 'DoStatement',
  249: 'WhileStatement',
  250: 'ForStatement',
  251: 'ForInStatement',
  252: 'ForOfStatement',
  253: 'ContinueStatement',
  254: 'BreakStatement',
  255: 'ReturnStatement',
  256: 'WithStatement',
  257: 'SwitchStatement',
  258: 'LabeledStatement',
  259: 'ThrowStatement',
  260: 'TryStatement',

  // Types
  182: 'TypeReference',
  183: 'FunctionType',
  184: 'ConstructorType',
  185: 'TypeQuery',
  186: 'TypeLiteral',
  187: 'ArrayType',
  188: 'TupleType',
  189: 'OptionalType',
  190: 'RestType',
  191: 'UnionType',
  192: 'IntersectionType',
  193: 'ConditionalType',
  194: 'InferType',
  195: 'ParenthesizedType',
  196: 'ThisType',
  197: 'TypeOperator',
  198: 'IndexedAccessType',
  199: 'MappedType',
  200: 'LiteralType',
  201: 'NamedTupleMember',
  202: 'TemplateLiteralType',

  // JSX
  283: 'JsxElement',
  284: 'JsxSelfClosingElement',
  285: 'JsxOpeningElement',
  286: 'JsxClosingElement',
  287: 'JsxFragment',
  290: 'JsxAttribute',
  291: 'JsxSpreadAttribute',
  292: 'JsxExpression',

  // Other
  303: 'SourceFile',
  308: 'JSDocComment',
};

/**
 * Get human-readable name for TypeScript SyntaxKind
 */
function getSyntaxKindName(kind: number): string {
  return SYNTAX_KIND_NAMES[kind] || `SyntaxKind(${kind})`;
}

/**
 * Extract code locations with timing from a file's events
 * Aggregates multiple events at the same position
 */
export function extractLocationsFromFile(
  events: ProcessedEvent[],
  filePath: string,
  shortPath: string
): FileLocationDetails {
  // Map to aggregate events by position
  const locationMap = new Map<string, CodeLocation>();

  for (const event of events) {
    // Only process check events with position info
    if (!event.args) continue;

    const pos = event.args.pos as number | undefined;
    const end = event.args.end as number | undefined;
    const kind = event.args.kind as number | undefined;

    if (pos === undefined || end === undefined) continue;

    const key = `${pos}:${end}`;
    const existing = locationMap.get(key);

    // Extract type IDs if present
    const typeIds: number[] = [];
    if (event.args.sourceId !== undefined) {
      typeIds.push(event.args.sourceId as number);
    }
    if (event.args.targetId !== undefined) {
      typeIds.push(event.args.targetId as number);
    }

    // Extract snippet info from event args (populated by analyze command)
    const codeSnippet = event.args.codeSnippet as string | undefined;
    const lineNumber = event.args.lineNumber as number | undefined;
    const columnNumber = event.args.columnNumber as number | undefined;

    if (existing) {
      // Aggregate duration for same location
      existing.duration += event.duration;
      if (typeIds.length > 0) {
        existing.typeIds = [...(existing.typeIds || []), ...typeIds];
      }
      // Keep snippet info if not already set
      if (!existing.codeSnippet && codeSnippet) {
        existing.codeSnippet = codeSnippet;
        existing.lineNumber = lineNumber;
        existing.columnNumber = columnNumber;
      }
    } else {
      locationMap.set(key, {
        pos,
        end,
        kind: kind ?? 0,
        kindName: getSyntaxKindName(kind ?? 0),
        duration: event.duration,
        eventName: event.name,
        typeIds: typeIds.length > 0 ? typeIds : undefined,
        codeSnippet,
        lineNumber,
        columnNumber,
      });
    }
  }

  // Convert to array and sort by duration (slowest first)
  const locations = Array.from(locationMap.values())
    .filter((loc) => loc.duration > 0.1) // Filter out very fast locations
    .sort((a, b) => b.duration - a.duration);

  const totalTime = locations.reduce((sum, loc) => sum + loc.duration, 0);

  return {
    filePath,
    shortPath,
    totalTime,
    locations,
  };
}

/**
 * Extract locations from FileEvents
 */
export function getFileLocationDetails(
  events: ProcessedEvent[],
  filePath: string,
  shortPath: string
): FileLocationDetails {
  // Filter events for this file that have position info
  const fileEvents = events.filter((e) => {
    if (e.filePath !== filePath) return false;
    if (!e.args) return false;
    return e.args.pos !== undefined && e.args.end !== undefined;
  });

  return extractLocationsFromFile(fileEvents, filePath, shortPath);
}
