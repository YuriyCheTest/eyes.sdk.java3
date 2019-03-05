package com.applitools.eyes.selenium;

import com.applitools.eyes.TestResults;
import com.applitools.eyes.visualgridclient.model.TestResultContainer;
import com.applitools.eyes.visualgridclient.model.TestResultSummary;
import com.applitools.eyes.visualgridclient.services.EyesRunner;

import java.util.ArrayList;
import java.util.List;

public class SeleniumRunner extends EyesRunner {

    public Eyes eyes;
    private TestResults testResult;

    void addEyes(Eyes eyes){
        this.eyes = eyes;
    }

    TestResults setTestResults(TestResults result){
        this.testResult = result;
        return result;
    }

    @Override
    public TestResultSummary getAllTestResults(){
        List<TestResultContainer> result = new ArrayList<>();
        result.add(new TestResultContainer(this.testResult, null));
        return new TestResultSummary(result);
    }

    @Override
    public TestResultSummary getAllTestResults(boolean shouldThrowException) {
        return null;
    }
}