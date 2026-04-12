import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

export interface WorkflowInput {
  description: string;
  required: boolean;
  type: string;
  default?: string;
}

export interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, string>;
  if?: string;
}

export interface WorkflowJob {
  'runs-on': string;
  strategy?: {
    matrix: Record<string, unknown>;
  };
  defaults?: {
    run?: {
      'working-directory'?: string;
    };
  };
  steps: WorkflowStep[];
}

export interface ReusableWorkflow {
  name: string;
  on: {
    workflow_call: {
      inputs?: Record<string, WorkflowInput>;
    };
  };
  permissions?: Record<string, string>;
  jobs: Record<string, WorkflowJob>;
}

const WORKFLOWS_DIR = join(__dirname, '..', '.github', 'workflows');

/**
 * Load and parse a workflow YAML file
 */
export function loadWorkflow(filename: string): ReusableWorkflow {
  const filepath = join(WORKFLOWS_DIR, filename);
  const content = readFileSync(filepath, 'utf-8');
  return parse(content) as ReusableWorkflow;
}

/**
 * Check if a workflow is a reusable workflow (has workflow_call trigger)
 */
export function isReusableWorkflow(workflow: ReusableWorkflow): boolean {
  return workflow.on?.workflow_call !== undefined;
}

/**
 * Get all inputs from a reusable workflow
 */
export function getWorkflowInputs(
  workflow: ReusableWorkflow
): Record<string, WorkflowInput> {
  return workflow.on?.workflow_call?.inputs ?? {};
}

/**
 * Get all jobs from a workflow
 */
export function getWorkflowJobs(
  workflow: ReusableWorkflow
): Record<string, WorkflowJob> {
  return workflow.jobs ?? {};
}

/**
 * Find steps that use a specific action
 */
export function findStepsUsingAction(
  workflow: ReusableWorkflow,
  actionName: string
): WorkflowStep[] {
  const steps: WorkflowStep[] = [];
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) {
      if (step.uses?.startsWith(actionName)) {
        steps.push(step);
      }
    }
  }
  return steps;
}

/**
 * Validate that an input has required properties
 */
export function validateInput(
  name: string,
  input: WorkflowInput
): string[] {
  const errors: string[] = [];

  if (!input.description) {
    errors.push(`Input '${name}' is missing description`);
  }

  if (input.type === undefined) {
    errors.push(`Input '${name}' is missing type`);
  }

  if (!['string', 'boolean', 'number'].includes(input.type)) {
    errors.push(`Input '${name}' has invalid type '${input.type}'`);
  }

  return errors;
}

/**
 * Validate that a job has required properties
 */
export function validateJob(name: string, job: WorkflowJob): string[] {
  const errors: string[] = [];

  if (!job['runs-on']) {
    errors.push(`Job '${name}' is missing 'runs-on'`);
  }

  if (!job.steps || job.steps.length === 0) {
    errors.push(`Job '${name}' has no steps`);
  }

  return errors;
}

/**
 * Check if workflow uses a specific package manager setup
 */
export function usesPackageManager(
  workflow: ReusableWorkflow,
  manager: 'npm' | 'pnpm' | 'yarn'
): boolean {
  const actionMap = {
    npm: 'actions/setup-node',
    pnpm: 'pnpm/action-setup',
    yarn: 'actions/setup-node', // yarn uses setup-node with cache: 'yarn'
  };

  const steps = findStepsUsingAction(workflow, actionMap[manager]);

  if (manager === 'pnpm') {
    return steps.length > 0;
  }

  // For npm/yarn, check the cache setting in setup-node
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) {
      if (step.uses?.startsWith('actions/setup-node')) {
        if (manager === 'yarn' && step.with?.cache === 'yarn') {
          return true;
        }
        if (manager === 'npm' && step.with?.cache === 'npm') {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get the install command used in a workflow
 */
export function getInstallCommand(workflow: ReusableWorkflow): string | null {
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) {
      if (step.name?.toLowerCase().includes('install') && step.run) {
        return step.run;
      }
    }
  }
  return null;
}
