/**
 * Shared constants for the application
 * Consolidated from parser/types.ts and visualization/utils/colors.ts
 */

import type { TraceCategory } from '../parser/types.js';

/**
 * Phase colors for visualization
 */
export const PHASE_COLORS: Record<TraceCategory, string> = {
  parse: '#3B82F6', // Blue
  bind: '#10B981', // Green
  check: '#F59E0B', // Amber
  checkTypes: '#EF4444', // Red
  emit: '#8B5CF6', // Purple
  program: '#6B7280', // Gray
  __metadata: '#9CA3AF', // Light gray
};

/**
 * Phase display names
 */
export const PHASE_NAMES: Record<TraceCategory, string> = {
  parse: 'Parse',
  bind: 'Bind',
  check: 'Check',
  checkTypes: 'Type Check',
  emit: 'Emit',
  program: 'Program',
  __metadata: 'Metadata',
};

/**
 * Get color for a trace category
 */
export function getCategoryColor(category: TraceCategory): string {
  return PHASE_COLORS[category] || PHASE_COLORS.program;
}

/**
 * Get gradient for kind badges
 */
export function getKindGradient(kindName: string): string {
  if (kindName.includes('Call') || kindName.includes('New')) {
    return 'linear-gradient(135deg, #ec4899, #f43f5e)';
  }
  if (kindName.includes('Type') || kindName.includes('Interface')) {
    return 'linear-gradient(135deg, #8b5cf6, #6366f1)';
  }
  if (kindName.includes('Property') || kindName.includes('Element')) {
    return 'linear-gradient(135deg, #06b6d4, #0891b2)';
  }
  if (kindName.includes('Jsx')) {
    return 'linear-gradient(135deg, #10b981, #059669)';
  }
  if (kindName.includes('Expression')) {
    return 'linear-gradient(135deg, #f59e0b, #d97706)';
  }
  if (kindName.includes('Declaration') || kindName.includes('Statement')) {
    return 'linear-gradient(135deg, #3b82f6, #2563eb)';
  }
  return 'linear-gradient(135deg, #6b7280, #4b5563)';
}
