import { describe, it, expect } from 'vitest';
import {
  PHASE_COLORS,
  PHASE_NAMES,
  getCategoryColor,
  getKindGradient,
} from '../constants';

describe('PHASE_COLORS', () => {
  it('should have colors for all categories', () => {
    expect(PHASE_COLORS.parse).toBe('#3B82F6');
    expect(PHASE_COLORS.bind).toBe('#10B981');
    expect(PHASE_COLORS.check).toBe('#F59E0B');
    expect(PHASE_COLORS.checkTypes).toBe('#EF4444');
    expect(PHASE_COLORS.emit).toBe('#8B5CF6');
    expect(PHASE_COLORS.program).toBe('#6B7280');
    expect(PHASE_COLORS.__metadata).toBe('#9CA3AF');
  });
});

describe('PHASE_NAMES', () => {
  it('should have display names for all categories', () => {
    expect(PHASE_NAMES.parse).toBe('Parse');
    expect(PHASE_NAMES.bind).toBe('Bind');
    expect(PHASE_NAMES.check).toBe('Check');
    expect(PHASE_NAMES.checkTypes).toBe('Type Check');
    expect(PHASE_NAMES.emit).toBe('Emit');
    expect(PHASE_NAMES.program).toBe('Program');
    expect(PHASE_NAMES.__metadata).toBe('Metadata');
  });
});

describe('getCategoryColor', () => {
  it('should return correct color for parse category', () => {
    expect(getCategoryColor('parse')).toBe('#3B82F6');
  });

  it('should return correct color for bind category', () => {
    expect(getCategoryColor('bind')).toBe('#10B981');
  });

  it('should return correct color for check category', () => {
    expect(getCategoryColor('check')).toBe('#F59E0B');
  });

  it('should return correct color for checkTypes category', () => {
    expect(getCategoryColor('checkTypes')).toBe('#EF4444');
  });

  it('should return correct color for emit category', () => {
    expect(getCategoryColor('emit')).toBe('#8B5CF6');
  });

  it('should return program color for unknown category', () => {
    expect(getCategoryColor('program')).toBe('#6B7280');
  });
});

describe('getKindGradient', () => {
  it('should return pink/red gradient for Call kinds', () => {
    const gradient = getKindGradient('CallExpression');
    expect(gradient).toBe('linear-gradient(135deg, #ec4899, #f43f5e)');
  });

  it('should return pink/red gradient for New kinds', () => {
    const gradient = getKindGradient('NewExpression');
    expect(gradient).toBe('linear-gradient(135deg, #ec4899, #f43f5e)');
  });

  it('should return purple gradient for Type kinds', () => {
    const gradient = getKindGradient('TypeReference');
    expect(gradient).toBe('linear-gradient(135deg, #8b5cf6, #6366f1)');
  });

  it('should return purple gradient for Interface kinds', () => {
    const gradient = getKindGradient('InterfaceDeclaration');
    expect(gradient).toBe('linear-gradient(135deg, #8b5cf6, #6366f1)');
  });

  it('should return cyan gradient for Property kinds', () => {
    const gradient = getKindGradient('PropertyAccess');
    expect(gradient).toBe('linear-gradient(135deg, #06b6d4, #0891b2)');
  });

  it('should return cyan gradient for Element kinds', () => {
    const gradient = getKindGradient('ElementAccess');
    expect(gradient).toBe('linear-gradient(135deg, #06b6d4, #0891b2)');
  });

  it('should return green gradient for Jsx kinds', () => {
    // Note: 'JsxElement' contains 'Element', so it matches cyan first
    // Testing with pure Jsx kind
    const gradient = getKindGradient('JsxOpeningFragment');
    expect(gradient).toBe('linear-gradient(135deg, #10b981, #059669)');
  });

  it('should return amber gradient for Expression kinds', () => {
    const gradient = getKindGradient('BinaryExpression');
    expect(gradient).toBe('linear-gradient(135deg, #f59e0b, #d97706)');
  });

  it('should return blue gradient for Declaration kinds', () => {
    const gradient = getKindGradient('FunctionDeclaration');
    expect(gradient).toBe('linear-gradient(135deg, #3b82f6, #2563eb)');
  });

  it('should return blue gradient for Statement kinds', () => {
    const gradient = getKindGradient('IfStatement');
    expect(gradient).toBe('linear-gradient(135deg, #3b82f6, #2563eb)');
  });

  it('should return gray gradient for unknown kinds', () => {
    const gradient = getKindGradient('UnknownKind');
    expect(gradient).toBe('linear-gradient(135deg, #6b7280, #4b5563)');
  });

  it('should prioritize Call over Expression when both are present', () => {
    const gradient = getKindGradient('CallExpression');
    expect(gradient).toBe('linear-gradient(135deg, #ec4899, #f43f5e)');
  });
});
