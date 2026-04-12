import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadWorkflow,
  isReusableWorkflow,
  getWorkflowInputs,
  getWorkflowJobs,
  findStepsUsingAction,
  validateInput,
  validateJob,
  usesPackageManager,
  getInstallCommand,
  ReusableWorkflow,
} from './workflow-utils';

describe('ts-ci.yaml (npm)', () => {
  let workflow: ReusableWorkflow;

  beforeAll(() => {
    workflow = loadWorkflow('ts-ci.yaml');
  });

  describe('workflow structure', () => {
    it('should have a name', () => {
      expect(workflow.name).toBe('TypeScript CI');
    });

    it('should be a reusable workflow', () => {
      expect(isReusableWorkflow(workflow)).toBe(true);
    });

    it('should have read-only contents permission', () => {
      expect(workflow.permissions?.contents).toBe('read');
    });
  });

  describe('inputs', () => {
    it('should have node-versions input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['node-versions']).toBeDefined();
      expect(inputs['node-versions'].type).toBe('string');
    });

    it('should have platforms input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['platforms']).toBeDefined();
    });

    it('should have working-directory input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['working-directory']).toBeDefined();
    });

    it('should have test-script input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['test-script']).toBeDefined();
    });

    it('should have all inputs properly configured', () => {
      const inputs = getWorkflowInputs(workflow);
      const errors: string[] = [];

      for (const [name, input] of Object.entries(inputs)) {
        errors.push(...validateInput(name, input));
      }

      expect(errors).toHaveLength(0);
    });
  });

  describe('jobs', () => {
    it('should have a test job', () => {
      const jobs = getWorkflowJobs(workflow);
      expect(jobs['test']).toBeDefined();
    });

    it('should have valid job configuration', () => {
      const jobs = getWorkflowJobs(workflow);
      const errors: string[] = [];

      for (const [name, job] of Object.entries(jobs)) {
        errors.push(...validateJob(name, job));
      }

      expect(errors).toHaveLength(0);
    });
  });

  describe('package manager', () => {
    it('should use npm', () => {
      expect(usesPackageManager(workflow, 'npm')).toBe(true);
    });

    it('should NOT use pnpm', () => {
      expect(usesPackageManager(workflow, 'pnpm')).toBe(false);
    });

    it('should use npm ci for installation', () => {
      const installCmd = getInstallCommand(workflow);
      expect(installCmd).toContain('npm ci');
    });
  });

  describe('steps', () => {
    it('should checkout code', () => {
      const checkoutSteps = findStepsUsingAction(workflow, 'actions/checkout');
      expect(checkoutSteps.length).toBeGreaterThan(0);
    });

    it('should setup Node.js', () => {
      const nodeSteps = findStepsUsingAction(workflow, 'actions/setup-node');
      expect(nodeSteps.length).toBeGreaterThan(0);
    });

    it('should reference package-lock.json for cache', () => {
      const nodeSteps = findStepsUsingAction(workflow, 'actions/setup-node');
      const hasPackageLock = nodeSteps.some((step) =>
        step.with?.['cache-dependency-path']?.includes('package-lock.json')
      );
      expect(hasPackageLock).toBe(true);
    });
  });
});
