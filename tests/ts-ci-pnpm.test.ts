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

describe('ts-ci-pnpm.yaml', () => {
  let workflow: ReusableWorkflow;

  beforeAll(() => {
    workflow = loadWorkflow('ts-ci-pnpm.yaml');
  });

  describe('workflow structure', () => {
    it('should have a name', () => {
      expect(workflow.name).toBe('TypeScript CI (pnpm)');
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
      expect(inputs['node-versions'].default).toBe('["20.x", "22.x"]');
    });

    it('should have pnpm-version input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['pnpm-version']).toBeDefined();
      expect(inputs['pnpm-version'].type).toBe('string');
      expect(inputs['pnpm-version'].default).toBe('9');
    });

    it('should have platforms input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['platforms']).toBeDefined();
      expect(inputs['platforms'].type).toBe('string');
      expect(inputs['platforms'].default).toBe('["ubuntu-latest"]');
    });

    it('should have working-directory input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['working-directory']).toBeDefined();
      expect(inputs['working-directory'].default).toBe('.');
    });

    it('should have test-script input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['test-script']).toBeDefined();
      expect(inputs['test-script'].default).toBe('test');
    });

    it('should have build-script input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['build-script']).toBeDefined();
      expect(inputs['build-script'].default).toBe('build');
    });

    it('should have typecheck-script input', () => {
      const inputs = getWorkflowInputs(workflow);
      expect(inputs['typecheck-script']).toBeDefined();
      expect(inputs['typecheck-script'].default).toBe('typecheck');
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

    it('should use matrix strategy for node versions and platforms', () => {
      const jobs = getWorkflowJobs(workflow);
      const testJob = jobs['test'];

      expect(testJob.strategy?.matrix).toBeDefined();
      expect(testJob.strategy?.matrix['node-version']).toBeDefined();
      expect(testJob.strategy?.matrix['platform']).toBeDefined();
    });

    it('should set working-directory in defaults', () => {
      const jobs = getWorkflowJobs(workflow);
      const testJob = jobs['test'];

      expect(testJob.defaults?.run?.['working-directory']).toBeDefined();
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

    it('should use pnpm cache in setup-node', () => {
      const nodeSteps = findStepsUsingAction(workflow, 'actions/setup-node');
      const hasCache = nodeSteps.some((step) => step.with?.cache === 'pnpm');
      expect(hasCache).toBe(true);
    });

    it('should reference pnpm-lock.yaml for cache', () => {
      const nodeSteps = findStepsUsingAction(workflow, 'actions/setup-node');
      const hasPnpmLock = nodeSteps.some((step) =>
        step.with?.['cache-dependency-path']?.includes('pnpm-lock.yaml')
      );
      expect(hasPnpmLock).toBe(true);
    });
  });
});
