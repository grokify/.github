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

describe('ts-lint-pnpm.yaml', () => {
  let workflow: ReusableWorkflow;

  beforeAll(() => {
    workflow = loadWorkflow('ts-lint-pnpm.yaml');
  });

  describe('workflow structure', () => {
    it('should have a name', () => {
      expect(workflow.name).toBe('TypeScript Lint (pnpm)');
    });

    it('should be a reusable workflow', () => {
      expect(isReusableWorkflow(workflow)).toBe(true);
    });

    it('should have read-only contents permission', () => {
      expect(workflow.permissions?.contents).toBe('read');
    });
  });

  describe('inputs', () => {
    it('should have node-version input (singular)', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['node-version']).toBeDefined();
      expect(inputs['node-version'].type).toBe('string');
      expect(inputs['node-version'].default).toBe('22.x');
    });

    it('should have pnpm-version input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['pnpm-version']).toBeDefined();
      expect(inputs['pnpm-version'].type).toBe('string');
      expect(inputs['pnpm-version'].default).toBe('9');
    });

    it('should have working-directory input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['working-directory']).toBeDefined();
      expect(inputs['working-directory'].default).toBe('.');
    });

    it('should have lint-script input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['lint-script']).toBeDefined();
      expect(inputs['lint-script'].default).toBe('lint');
    });

    it('should have format-check-script input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['format-check-script']).toBeDefined();
      expect(inputs['format-check-script'].default).toBe('format:check');
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

    it('should NOT use matrix strategy (linting only needs one run)', () => {
      const jobs = getWorkflowJobs(workflow);
      expect(jobs['lint'].strategy).toBeUndefined();
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
    it('should use pnpm', () => {
      expect(usesPackageManager(workflow, 'pnpm')).toBe(true);
    });

    it('should NOT use npm directly', () => {
      const installCmd = getInstallCommand(workflow);
      expect(installCmd).not.toContain('npm ci');
    });

    it('should use pnpm install with frozen-lockfile', () => {
      const installCmd = getInstallCommand(workflow);
      expect(installCmd).toContain('pnpm install --frozen-lockfile');
    });
  });

  describe('steps', () => {
    it('should checkout code', () => {
      const checkoutSteps = findStepsUsingAction(workflow, 'actions/checkout');
      expect(checkoutSteps.length).toBeGreaterThan(0);
    });

    it('should setup pnpm', () => {
      const pnpmSteps = findStepsUsingAction(workflow, 'pnpm/action-setup');
      expect(pnpmSteps.length).toBeGreaterThan(0);
    });

    it('should setup Node.js', () => {
      const nodeSteps = findStepsUsingAction(workflow, 'actions/setup-node');
      expect(nodeSteps.length).toBeGreaterThan(0);
    });

    it('should use pnpm cache', () => {
      const nodeSteps = findStepsUsingAction(workflow, 'actions/setup-node');
      const hasCache = nodeSteps.some((step) => step.with?.cache === 'pnpm');
      expect(hasCache).toBe(true);
    });

    it('should have conditional format check step', () => {
      const jobs = getWorkflowJobs(workflow);
      const lintJob = jobs['lint'];
      const formatStep = lintJob.steps.find((s) =>
        s.name?.toLowerCase().includes('format')
      );

      expect(formatStep).toBeDefined();
      expect(formatStep?.if).toBeDefined();
    });
  });
});
