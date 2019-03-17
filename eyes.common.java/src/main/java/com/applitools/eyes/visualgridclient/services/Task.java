package com.applitools.eyes.visualgridclient.services;

import com.applitools.ICheckSettings;
import com.applitools.eyes.Logger;
import com.applitools.eyes.RectangleSize;
import com.applitools.eyes.Region;
import com.applitools.eyes.TestResults;
import com.applitools.eyes.config.ISeleniumConfigurationProvider;
import com.applitools.eyes.visualgridclient.model.*;
import com.applitools.utils.GeneralUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.atomic.AtomicBoolean;

public class Task implements Callable<TestResultContainer>, CompletableTask {


    private final Logger logger;
    private boolean isSent;

    public enum TaskType {OPEN, CHECK, CLOSE, ABORT}

    private ISeleniumConfigurationProvider configurationProvider;
    private TestResults testResults;

    private IEyesConnector eyesConnector;
    private TaskType type;

    private RenderStatusResults renderResult;
    private List<TaskListener> listeners = new ArrayList<>();
    private ICheckSettings checkSettings;

    private RunningTest runningTest;
    private Error exception;
    private RenderingTask renderingTask = null;

    private AtomicBoolean isTaskComplete = new AtomicBoolean(false);
    private final List<VisualGridSelector[]> regionSelectors;

    interface TaskListener {

        void onTaskComplete(Task task);

        void onTaskFailed(Error e, Task task);

        void onRenderComplete();

    }

    public Task(ISeleniumConfigurationProvider seleniumConfigurationProvider, TestResults testResults, IEyesConnector eyesConnector, TaskType type, TaskListener runningTestListener,
                ICheckSettings checkSettings, RunningTest runningTest, List<VisualGridSelector[]> regionSelectors) {
        this.configurationProvider = seleniumConfigurationProvider;
        this.testResults = testResults;
        this.eyesConnector = eyesConnector;
        this.type = type;
        this.regionSelectors = regionSelectors;
        this.listeners.add(runningTestListener);
        this.logger = runningTest.getLogger();
        this.checkSettings = checkSettings;
        this.runningTest = runningTest;
    }

    public RenderBrowserInfo getBrowserInfo() {
        return runningTest.getBrowserInfo();
    }

    public TaskType getType() {
        return type;
    }

    boolean isSent() {
        return isSent;
    }

    void setIsSent() {
        this.isSent = true;
    }

    @Override
    public TestResultContainer call() {
        try {
            testResults = null;
            switch (type) {
                case OPEN:
                    logger.log("Task.run opening task");
                    String userAgent = renderResult.getUserAgent();
                    RectangleSize deviceSize = renderResult.getDeviceSize();
                    eyesConnector.setUserAgent(userAgent);
                    eyesConnector.setDeviceSize(deviceSize);
                    eyesConnector.open(configurationProvider);
                    break;

                case CHECK:
                    logger.log("Task.run check task");
                    try {
                        String imageLocation = renderResult.getImageLocation();
                        String domLocation = renderResult.getDomLocation();
                        List<Region> regions = renderResult.getSelectorRegions();
                        if (imageLocation == null) {
                            logger.verbose("CHECKING IMAGE WITH NULL LOCATION - ");
                            logger.verbose(renderResult.toString());
                        }
                        eyesConnector.matchWindow(imageLocation, domLocation, checkSettings, regions, this.regionSelectors);
                    } catch (Exception e) {
                        GeneralUtils.logExceptionStackTrace(logger,e);
                    }
                    break;

                case CLOSE:
                    logger.log("Task.run close task");
                    testResults = eyesConnector.close(configurationProvider.get().isThrowExceptionOn());
                    break;

                case ABORT:
                    logger.log("Task.run abort task");
                    if (runningTest.isTestOpen()) {
                        testResults = eyesConnector.abortIfNotClosed();
                    }
                    else{
                        logger.log("Closing a not opened test");
                    }
            }
            @SuppressWarnings("UnnecessaryLocalVariable")
            TestResultContainer testResultContainer = new TestResultContainer(testResults, this.exception);
            notifySuccessAllListeners();
            return testResultContainer;
        } catch (Exception e) {
            GeneralUtils.logExceptionStackTrace(logger, e);
            notifyFailureAllListeners(new Error(e));
        } finally {
            logger.verbose("marking task as complete: " + this.configurationProvider.get().getTestName());
            this.isTaskComplete.set(true);
            //call the callback
        }
        return null;
    }

    private void notifySuccessAllListeners() {
        for (TaskListener listener : listeners) {
            listener.onTaskComplete(this);
        }
    }

    private void notifyFailureAllListeners(Error e) {
        for (TaskListener listener : listeners) {
            listener.onTaskFailed(e, this);
        }
    }

    private void notifyRenderCompleteAllListeners() {
        for (TaskListener listener : listeners) {
            listener.onRenderComplete();
        }
    }

    public IEyesConnector getEyesConnector() {
        return eyesConnector;
    }

    public void setRenderResult(RenderStatusResults renderResult) {
        logger.verbose("enter");
        this.renderResult = renderResult;
        notifyRenderCompleteAllListeners();
        logger.verbose("exit");
    }

    public boolean isTaskReadyToCheck() {
        return this.renderResult != null;
    }

    public RunningTest getRunningTest() {
        return runningTest;
    }

    public boolean getIsTaskComplete() {
        return isTaskComplete.get();
    }

    public void addListener(TaskListener listener) {
        this.listeners.add(listener);
    }

    public void setRenderError(String renderId) {
        logger.verbose("enter - renderId: " + renderId);
        for (TaskListener listener : listeners) {
            exception = new Error("Render Failed for " + this.getBrowserInfo() + " (renderId: " + renderId + ")");
            listener.onTaskFailed(exception, this);
        }
        logger.verbose("exit - renderId: " + renderId);
    }

    public Error getException() {
        return exception;
    }

    public void setException(Error exception) {
        logger.verbose("aborting task with exception");
        this.exception = exception;
        this.type = TaskType.ABORT;
    }

    @Override
    public String toString() {
        return "Task - Type: " + type + " ; Browser Info: " + getBrowserInfo();
    }

    public void setRenderingTask(RenderingTask renderingTask) {
        this.renderingTask = renderingTask;
    }
}

