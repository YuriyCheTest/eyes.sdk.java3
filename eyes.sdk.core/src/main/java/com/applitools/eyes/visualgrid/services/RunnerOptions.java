package com.applitools.eyes.visualgrid.services;

public class RunnerOptions {

    public static class EnabledRunnerOptions extends RunnerOptions {
        private int testConcurrency;

        private EnabledRunnerOptions(int testConcurrency) {
            this.testConcurrency = testConcurrency;
        }

        @Override
        public EnabledRunnerOptions testConcurrency(int testConcurrency) {
            this.testConcurrency = testConcurrency;
            return this;
        }

        public int getTestConcurrency() {
            return testConcurrency;
        }
    }

    public EnabledRunnerOptions testConcurrency(int testConcurrency) {
        return new EnabledRunnerOptions(testConcurrency);
    }
}
