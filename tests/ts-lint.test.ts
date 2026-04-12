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

describe('ts-lint.yaml (npm)', () => {
  let workflow: ReusableWorkflow;

  beforeAll(() => {
    workflow = loadWorkflow('ts-lint.yaml');
  });

  describe('workflow structure', () => {
    it('should have a name', () => {
      expect(workflow.name).toBe('TypeScript Lint');
    });

    it('should be a reusable workflow', () => {
      expect(isReusableWorkflow(workflow)).toBe(true);
    });

    it('should have read-only contents permission', () => {
      expect(workflow.permissions?.contents).toBe('read');
    });
  });

  describe('inputs', () => {
    it('should have node-version input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['node-version']).toBeDefined();
    });

    it('should have working-directory input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['working-directory']).toBeDefined();
    });

    it('should have lint-script input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['lint-script']).toBeDefined();
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
    it('should have a lint job', () => {
      const jobs = getWorkflowJobs(workflow);
      expect(jobs['lint']).toBeDefined();
    });

    it('should run on ubuntu-latest', () => {
      const jobs = getWorkflowJobs(workflow);
      expect(jobs['lint']['runs-on']).toBe('ubuntu-latest');
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
  });
});
